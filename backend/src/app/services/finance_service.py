import json
import logging
from datetime import datetime, timedelta

from sqlalchemy import case, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bank_transaction import BankTransaction
from app.models.expense_category_rule import ExpenseCategoryRule
from app.models.planned_expense import PlannedExpense
from app.models.treasury_account import TreasuryAccount
from app.services.holded_client import HoldedClient
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

# ── Module-level sync status (in-memory) ─────────────────────

_sync_status: dict = {"status": "idle", "step": "", "progress": 0}

STARTUP_CATEGORIES = [
    "Payroll",
    "Legal & Compliance",
    "Office & Coworking",
    "SaaS & Tools",
    "Marketing & Sales",
    "Consulting",
    "Infrastructure & Cloud",
    "Taxes & Government",
    "Insurance",
    "Travel & Events",
    "Banking & Fees",
    "Other",
]


def get_sync_status() -> dict:
    return dict(_sync_status)


def _set_sync_status(status: str, step: str = "", progress: int = 0):
    _sync_status["status"] = status
    _sync_status["step"] = step
    _sync_status["progress"] = progress


def _normalize_contact(contact_name: str | None, description: str | None) -> str:
    if contact_name:
        return contact_name
    desc = (description or "").lower()
    if "nómina" in desc or "nomina" in desc or "salario" in desc:
        return "Payroll"
    return "Other"


class FinanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Sync ────────────────────────────────────────────────────

    async def sync_treasury(self, client: HoldedClient) -> int:
        accounts = await client.get_treasury_accounts()
        count = 0
        for acc in accounts:
            holded_id = acc.get("id", "")
            if not holded_id:
                continue
            result = await self.session.execute(
                select(TreasuryAccount).where(
                    TreasuryAccount.holded_id == holded_id
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                existing.name = acc.get("name", "")
                existing.account_type = acc.get("type", "")
                existing.balance = float(acc.get("balance", 0))
                existing.iban = acc.get("iban")
                existing.updated_at = datetime.utcnow()
            else:
                self.session.add(
                    TreasuryAccount(
                        holded_id=holded_id,
                        name=acc.get("name", ""),
                        account_type=acc.get("type", ""),
                        balance=float(acc.get("balance", 0)),
                        iban=acc.get("iban"),
                        currency=acc.get("currency", "EUR"),
                    )
                )
            count += 1
        await self.session.commit()
        return count

    async def sync_payments(
        self,
        client: HoldedClient,
        start_timestamp: int | None = None,
        end_timestamp: int | None = None,
    ) -> int:
        payments = await client.get_payments(start_timestamp, end_timestamp)
        count = 0
        for pay in payments:
            holded_id = pay.get("id", "")
            if not holded_id:
                continue

            ts = pay.get("date", 0)
            dt = datetime.utcfromtimestamp(ts) if ts else datetime.utcnow()
            year_month = dt.strftime("%Y-%m")

            raw_contact = pay.get("contactName") or None
            desc = pay.get("desc", "")
            contact = _normalize_contact(raw_contact, desc)

            result = await self.session.execute(
                select(BankTransaction).where(
                    BankTransaction.holded_id == holded_id
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                existing.amount = float(pay.get("amount", 0))
                existing.description = desc
                existing.contact_name = contact
                existing.date = dt
                existing.year_month = year_month
                existing.treasury_holded_id = pay.get("bankId")
            else:
                self.session.add(
                    BankTransaction(
                        holded_id=holded_id,
                        treasury_holded_id=pay.get("bankId"),
                        date=dt,
                        amount=float(pay.get("amount", 0)),
                        description=desc,
                        contact_name=contact,
                        year_month=year_month,
                    )
                )
            count += 1
        await self.session.commit()
        return count

    async def apply_category_rules(self):
        """Apply existing category rules to all transactions."""
        rules = await self.session.execute(select(ExpenseCategoryRule))
        for rule in rules.scalars().all():
            await self.session.execute(
                update(BankTransaction)
                .where(BankTransaction.contact_name == rule.contact_name)
                .values(category=rule.category)
            )
        await self.session.commit()

    async def full_sync(self, history_months: int = 36) -> tuple[int, int]:
        _set_sync_status("syncing", "Connecting to Holded...", 10)
        client = await HoldedClient.from_session(self.session)

        _set_sync_status("syncing", "Syncing bank accounts...", 20)
        accounts = await self.sync_treasury(client)

        _set_sync_status("syncing", "Syncing transactions...", 40)
        start_dt = datetime.utcnow() - timedelta(days=history_months * 31)
        start_ts = int(start_dt.timestamp())
        end_ts = int(datetime.utcnow().timestamp())
        transactions = await self.sync_payments(client, start_ts, end_ts)

        _set_sync_status("syncing", "Applying categories...", 70)
        await self.apply_category_rules()

        _set_sync_status("syncing", "Auto-classifying new contacts...", 80)
        await self.auto_classify_contacts()

        _set_sync_status("syncing", "Finalizing...", 95)
        svc = SettingsService(self.session)
        await svc.set("holded_last_sync", datetime.utcnow().isoformat())

        _set_sync_status("done", "Sync complete", 100)
        return accounts, transactions

    # ── Category classification ──────────────────────────────────

    async def get_uncategorized_contacts(self) -> list[str]:
        """Get contacts that don't have a category rule yet."""
        result = await self.session.execute(
            select(BankTransaction.contact_name)
            .where(BankTransaction.contact_name.isnot(None))
            .where(BankTransaction.category.is_(None))
            .group_by(BankTransaction.contact_name)
        )
        return [r[0] for r in result.all() if r[0]]

    async def auto_classify_contacts(self):
        """Use OpenAI to classify uncategorized contacts into startup categories."""
        contacts = await self.get_uncategorized_contacts()
        if not contacts:
            return

        try:
            from app.intelligence.openai_client import structured_completion
            from pydantic import BaseModel

            class CategoryAssignment(BaseModel):
                contact_name: str
                category: str

            class ClassificationResult(BaseModel):
                assignments: list[CategoryAssignment]

            categories_str = ", ".join(STARTUP_CATEGORIES)
            contacts_str = "\n".join(f"- {c}" for c in contacts)

            result = await structured_completion(
                system_prompt=f"""You are a financial categorizer for a startup. Classify each vendor/contact into exactly one category.

Available categories: {categories_str}

Rules:
- Payroll: salary payments, nóminas, employee compensation
- Legal & Compliance: law firms, notaries, legal services
- Office & Coworking: workspace rentals, coworking spaces
- SaaS & Tools: software subscriptions, cloud tools
- Marketing & Sales: advertising, marketing agencies, sales tools
- Consulting: external consultants, advisory services
- Infrastructure & Cloud: AWS, GCP, hosting, servers
- Taxes & Government: tax payments, social security, government fees
- Insurance: insurance premiums
- Travel & Events: flights, hotels, conference tickets
- Banking & Fees: bank charges, transfer fees
- Other: anything that doesn't fit above""",
                user_prompt=f"Classify these vendors/contacts:\n{contacts_str}",
                response_model=ClassificationResult,
            )

            for assignment in result.assignments:
                if assignment.category in STARTUP_CATEGORIES:
                    # Upsert rule
                    existing = await self.session.execute(
                        select(ExpenseCategoryRule).where(
                            ExpenseCategoryRule.contact_name == assignment.contact_name
                        )
                    )
                    rule = existing.scalar_one_or_none()
                    if rule:
                        rule.category = assignment.category
                        rule.is_auto = True
                    else:
                        self.session.add(
                            ExpenseCategoryRule(
                                contact_name=assignment.contact_name,
                                category=assignment.category,
                                is_auto=True,
                            )
                        )
                    # Apply to transactions
                    await self.session.execute(
                        update(BankTransaction)
                        .where(BankTransaction.contact_name == assignment.contact_name)
                        .values(category=assignment.category)
                    )
            await self.session.commit()
        except Exception as e:
            logger.warning("Auto-classify failed (OpenAI may not be configured): %s", e)

    async def get_category_rules(self) -> list[ExpenseCategoryRule]:
        result = await self.session.execute(
            select(ExpenseCategoryRule).order_by(ExpenseCategoryRule.contact_name)
        )
        return list(result.scalars().all())

    async def set_category_rule(self, contact_name: str, category: str) -> ExpenseCategoryRule:
        result = await self.session.execute(
            select(ExpenseCategoryRule).where(
                ExpenseCategoryRule.contact_name == contact_name
            )
        )
        rule = result.scalar_one_or_none()
        if rule:
            rule.category = category
            rule.is_auto = False
        else:
            rule = ExpenseCategoryRule(
                contact_name=contact_name,
                category=category,
                is_auto=False,
            )
            self.session.add(rule)

        # Apply to transactions
        await self.session.execute(
            update(BankTransaction)
            .where(BankTransaction.contact_name == contact_name)
            .values(category=category)
        )
        await self.session.commit()
        return rule

    async def delete_category_rule(self, rule_id: str):
        await self.session.execute(
            delete(ExpenseCategoryRule).where(ExpenseCategoryRule.id == rule_id)
        )
        await self.session.commit()

    # ── Queries ─────────────────────────────────────────────────

    async def get_cash_position(self) -> float:
        result = await self.session.execute(
            select(func.coalesce(func.sum(TreasuryAccount.balance), 0.0))
        )
        return float(result.scalar())

    async def get_treasury_accounts(self) -> list[TreasuryAccount]:
        result = await self.session.execute(
            select(TreasuryAccount).order_by(TreasuryAccount.name)
        )
        return list(result.scalars().all())

    async def get_monthly_summary(self) -> list[dict]:
        result = await self.session.execute(
            select(
                BankTransaction.year_month,
                func.sum(
                    case(
                        (BankTransaction.amount > 0, BankTransaction.amount),
                        else_=0.0,
                    )
                ).label("income"),
                func.sum(
                    case(
                        (BankTransaction.amount < 0, func.abs(BankTransaction.amount)),
                        else_=0.0,
                    )
                ).label("expenses"),
                func.sum(BankTransaction.amount).label("net"),
            )
            .group_by(BankTransaction.year_month)
            .order_by(BankTransaction.year_month)
        )
        return [
            {
                "year_month": row.year_month,
                "income": round(float(row.income), 2),
                "expenses": round(float(row.expenses), 2),
                "net": round(float(row.net), 2),
            }
            for row in result.all()
        ]

    async def get_burn_rates(self, monthly: list[dict]) -> dict:
        now_ym = datetime.utcnow().strftime("%Y-%m")
        complete = [m for m in monthly if m["year_month"] < now_ym]

        def avg_expenses(n: int) -> float:
            recent = complete[-n:] if len(complete) >= n else complete
            if not recent:
                return 0.0
            return round(sum(m["expenses"] for m in recent) / len(recent), 2)

        return {
            "three_month": avg_expenses(3),
            "six_month": avg_expenses(6),
            "twelve_month": avg_expenses(12),
        }

    def compute_runway_scenarios(
        self, cash: float, burn_rates: dict, monthly: list[dict],
        forecast_settings: dict | None = None,
    ) -> dict:
        """Compute runway under different scenarios."""
        now_ym = datetime.utcnow().strftime("%Y-%m")
        complete = [m for m in monthly if m["year_month"] < now_ym]

        burn_6 = burn_rates["six_month"]

        # Avg income (6 month)
        recent_6 = complete[-6:] if len(complete) >= 6 else complete
        avg_income_6 = (
            round(sum(m["income"] for m in recent_6) / len(recent_6), 2)
            if recent_6
            else 0.0
        )

        # Avg net burn (12 month)
        recent_12 = complete[-12:] if len(complete) >= 12 else complete
        avg_net_12 = (
            round(sum(m["expenses"] - m["income"] for m in recent_12) / len(recent_12), 2)
            if recent_12
            else 0.0
        )

        def runway(burn: float) -> float | None:
            return round(cash / burn, 1) if burn > 0 else None

        net_burn_6 = max(burn_6 - avg_income_6, 0)

        # Forecast runway: cash / forecast_burn (zero income worst case)
        forecast_burn = (forecast_settings or {}).get("monthly_burn", 0.0)
        forecast_runway = runway(forecast_burn) if forecast_burn > 0 else None

        return {
            "worst": runway(burn_6),
            "current": runway(net_burn_6) if net_burn_6 > 0 else None,
            "best": runway(avg_net_12) if avg_net_12 > 0 else None,
            "forecast": forecast_runway,
        }

    async def get_runway_from_burn(self, cash: float, burn: float) -> float | None:
        if burn <= 0:
            return None
        return round(cash / burn, 1)

    async def get_expense_breakdown(self, months: int = 6) -> list[dict]:
        """Group expenses by category (falls back to contact_name). Excludes current partial month."""
        now_ym = datetime.utcnow().strftime("%Y-%m")
        cutoff = (datetime.utcnow() - timedelta(days=months * 31)).strftime("%Y-%m")
        result = await self.session.execute(
            select(
                func.coalesce(
                    BankTransaction.category,
                    BankTransaction.contact_name,
                    "Other",
                ).label("category"),
                func.sum(func.abs(BankTransaction.amount)).label("total"),
                func.count(BankTransaction.id).label("transaction_count"),
            )
            .where(
                BankTransaction.amount < 0,
                BankTransaction.year_month >= cutoff,
                BankTransaction.year_month < now_ym,
            )
            .group_by(
                func.coalesce(
                    BankTransaction.category,
                    BankTransaction.contact_name,
                    "Other",
                )
            )
            .order_by(func.sum(func.abs(BankTransaction.amount)).desc())
            .limit(15)
        )
        return [
            {
                "category": row.category or "Other",
                "total": round(float(row.total), 2),
                "transaction_count": int(row.transaction_count),
            }
            for row in result.all()
        ]

    async def get_income_sources(self, months: int = 6) -> list[dict]:
        """Group income by category. Excludes current partial month."""
        now_ym = datetime.utcnow().strftime("%Y-%m")
        cutoff = (datetime.utcnow() - timedelta(days=months * 31)).strftime("%Y-%m")
        result = await self.session.execute(
            select(
                func.coalesce(
                    BankTransaction.category,
                    BankTransaction.contact_name,
                    "Other",
                ).label("category"),
                func.sum(BankTransaction.amount).label("total"),
                func.count(BankTransaction.id).label("transaction_count"),
            )
            .where(
                BankTransaction.amount > 0,
                BankTransaction.year_month >= cutoff,
                BankTransaction.year_month < now_ym,
            )
            .group_by(
                func.coalesce(
                    BankTransaction.category,
                    BankTransaction.contact_name,
                    "Other",
                )
            )
            .order_by(func.sum(BankTransaction.amount).desc())
            .limit(15)
        )
        return [
            {
                "category": row.category or "Other",
                "total": round(float(row.total), 2),
                "transaction_count": int(row.transaction_count),
            }
            for row in result.all()
        ]

    # ── Planned Expenses ────────────────────────────────────────

    async def get_planned_expenses(self) -> list[PlannedExpense]:
        result = await self.session.execute(
            select(PlannedExpense).order_by(PlannedExpense.quarter, PlannedExpense.name)
        )
        return list(result.scalars().all())

    async def create_planned_expense(self, **kwargs) -> PlannedExpense:
        pe = PlannedExpense(**kwargs)
        self.session.add(pe)
        await self.session.commit()
        await self.session.refresh(pe)
        return pe

    async def update_planned_expense(self, pe_id: str, **kwargs) -> PlannedExpense | None:
        result = await self.session.execute(
            select(PlannedExpense).where(PlannedExpense.id == pe_id)
        )
        pe = result.scalar_one_or_none()
        if not pe:
            return None
        for k, v in kwargs.items():
            if v is not None:
                setattr(pe, k, v)
        await self.session.commit()
        await self.session.refresh(pe)
        return pe

    async def delete_planned_expense(self, pe_id: str):
        await self.session.execute(
            delete(PlannedExpense).where(PlannedExpense.id == pe_id)
        )
        await self.session.commit()

    # ── Forecast ────────────────────────────────────────────────

    async def get_forecast_settings(self) -> dict:
        svc = SettingsService(self.session)
        raw = await svc.get("finance_forecast")
        if raw:
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                pass
        return {"monthly_burn": 0.0, "monthly_income": 0.0}

    async def set_forecast_settings(self, monthly_burn: float, monthly_income: float) -> dict:
        settings = {"monthly_burn": monthly_burn, "monthly_income": monthly_income}
        svc = SettingsService(self.session)
        await svc.set("finance_forecast", json.dumps(settings))
        return settings

    def build_forecast_months(
        self, cash: float, forecast: dict, existing_months: list[dict], count: int = 12
    ) -> list[dict]:
        burn = forecast.get("monthly_burn", 0.0)
        income = forecast.get("monthly_income", 0.0)
        if burn <= 0 and income <= 0:
            return []

        monthly_net = income - burn

        if existing_months:
            last_ym = existing_months[-1]["year_month"]
            y, m = int(last_ym[:4]), int(last_ym[5:7])
        else:
            now = datetime.utcnow()
            y, m = now.year, now.month

        projected: list[dict] = []
        running_cash = cash
        for _ in range(count):
            m += 1
            if m > 12:
                m = 1
                y += 1
            running_cash += monthly_net
            projected.append({
                "year_month": f"{y:04d}-{m:02d}",
                "income": round(income, 2),
                "expenses": round(burn, 2),
                "net": round(monthly_net, 2),
                "is_forecast": True,
                "projected_cash": round(max(running_cash, 0), 2),
            })
            if running_cash <= 0:
                break

        return projected

    async def get_last_synced(self) -> str | None:
        svc = SettingsService(self.session)
        return await svc.get("holded_last_sync")
