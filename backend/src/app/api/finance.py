from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_session
from app.schemas.finance import (
    BurnRates,
    CategoryRuleRead,
    CategoryRuleUpdate,
    FinanceDashboard,
    FinanceKPIs,
    ForecastSettings,
    HoldedConnectionTest,
    PlannedExpenseCreate,
    PlannedExpenseRead,
    PlannedExpenseUpdate,
    RunwayScenarios,
    SyncStatus,
)
from app.services.finance_service import FinanceService, STARTUP_CATEGORIES, get_sync_status, _set_sync_status
from app.services.holded_client import HoldedClient

router = APIRouter()


@router.get("/dashboard", response_model=FinanceDashboard)
async def get_dashboard(session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)

    cash = await svc.get_cash_position()
    monthly = await svc.get_monthly_summary()
    burn_rates = await svc.get_burn_rates(monthly)
    expenses = await svc.get_expense_breakdown(months=6)
    income = await svc.get_income_sources(months=6)
    accounts = await svc.get_treasury_accounts()
    last_synced = await svc.get_last_synced()
    forecast_settings = await svc.get_forecast_settings()

    runway = await svc.get_runway_from_burn(cash, burn_rates["six_month"])
    runway_scenarios = svc.compute_runway_scenarios(cash, burn_rates, monthly, forecast_settings)

    now_ym = __import__("datetime").datetime.utcnow().strftime("%Y-%m")
    complete = [m for m in monthly if m["year_month"] < now_ym]
    monthly_burn = complete[-1]["expenses"] if complete else 0.0
    monthly_income = complete[-1]["income"] if complete else 0.0
    net_last = complete[-1]["net"] if complete else 0.0

    # Exclude current partial month from chart; forecast starts from last complete month
    forecast_months = svc.build_forecast_months(cash, forecast_settings, complete, count=36)
    all_months = [
        {**m, "is_forecast": False} for m in complete
    ] + forecast_months

    return FinanceDashboard(
        kpis=FinanceKPIs(
            cash_position=cash,
            monthly_burn=monthly_burn,
            monthly_income=monthly_income,
            runway_months=runway,
            runway_scenarios=RunwayScenarios(**runway_scenarios),
            net_last_month=net_last,
            burn_rates=BurnRates(**burn_rates),
        ),
        monthly_summary=all_months,
        expense_breakdown=expenses,
        income_sources=income,
        treasury_accounts=[
            {
                "id": a.id,
                "holded_id": a.holded_id,
                "name": a.name,
                "account_type": a.account_type,
                "balance": a.balance,
                "iban": a.iban,
                "currency": a.currency,
            }
            for a in accounts
        ],
        last_synced=last_synced,
        forecast=ForecastSettings(**forecast_settings),
    )


# ── Sync ────────────────────────────────────────────────────

async def _run_sync():
    try:
        async with async_session() as session:
            svc = FinanceService(session)
            await svc.full_sync()
    except Exception as e:
        _set_sync_status("error", str(e), 0)


@router.post("/sync", status_code=202, response_model=dict)
async def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_sync)
    return {"message": "Sync started"}


@router.get("/sync-status", response_model=SyncStatus)
async def sync_status():
    return SyncStatus(**get_sync_status())


# ── Forecast ────────────────────────────────────────────────

@router.get("/forecast", response_model=ForecastSettings)
async def get_forecast(session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    settings = await svc.get_forecast_settings()
    return ForecastSettings(**settings)


@router.put("/forecast", response_model=ForecastSettings)
async def update_forecast(body: ForecastSettings, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    settings = await svc.set_forecast_settings(body.monthly_burn, body.monthly_income)
    return ForecastSettings(**settings)


# ── Category rules ──────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryRuleRead])
async def list_categories(session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    rules = await svc.get_category_rules()
    return [
        CategoryRuleRead(
            id=r.id,
            contact_name=r.contact_name,
            category=r.category,
            is_auto=r.is_auto,
        )
        for r in rules
    ]


@router.get("/categories/options", response_model=list[str])
async def category_options():
    return STARTUP_CATEGORIES


@router.put("/categories", response_model=CategoryRuleRead)
async def upsert_category(body: CategoryRuleUpdate, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    rule = await svc.set_category_rule(body.contact_name, body.category)
    return CategoryRuleRead(
        id=rule.id,
        contact_name=rule.contact_name,
        category=rule.category,
        is_auto=rule.is_auto,
    )


@router.post("/categories/auto-classify", response_model=dict)
async def auto_classify(session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    await svc.auto_classify_contacts()
    return {"message": "Classification complete"}


@router.delete("/categories/{rule_id}", status_code=204)
async def delete_category(rule_id: str, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    await svc.delete_category_rule(rule_id)


# ── Planned expenses ───────────────────────────────────────

@router.get("/planned-expenses", response_model=list[PlannedExpenseRead])
async def list_planned_expenses(session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    items = await svc.get_planned_expenses()
    return [
        PlannedExpenseRead(
            id=pe.id,
            name=pe.name,
            category=pe.category,
            amount=pe.amount,
            quarter=pe.quarter,
            is_recurring=pe.is_recurring,
            notes=pe.notes,
        )
        for pe in items
    ]


@router.post("/planned-expenses", response_model=PlannedExpenseRead, status_code=201)
async def create_planned_expense(body: PlannedExpenseCreate, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    pe = await svc.create_planned_expense(**body.model_dump())
    return PlannedExpenseRead(
        id=pe.id, name=pe.name, category=pe.category,
        amount=pe.amount, quarter=pe.quarter,
        is_recurring=pe.is_recurring, notes=pe.notes,
    )


@router.put("/planned-expenses/{pe_id}", response_model=PlannedExpenseRead)
async def update_planned_expense(pe_id: str, body: PlannedExpenseUpdate, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    pe = await svc.update_planned_expense(pe_id, **body.model_dump(exclude_unset=True))
    if not pe:
        raise HTTPException(404, "Planned expense not found")
    return PlannedExpenseRead(
        id=pe.id, name=pe.name, category=pe.category,
        amount=pe.amount, quarter=pe.quarter,
        is_recurring=pe.is_recurring, notes=pe.notes,
    )


@router.delete("/planned-expenses/{pe_id}", status_code=204)
async def delete_planned_expense(pe_id: str, session: AsyncSession = Depends(get_session)):
    svc = FinanceService(session)
    await svc.delete_planned_expense(pe_id)


# ── Connection test ─────────────────────────────────────────

@router.post("/test-connection", response_model=HoldedConnectionTest)
async def test_connection(session: AsyncSession = Depends(get_session)):
    try:
        client = await HoldedClient.from_session(session)
        accounts = await client.get_treasury_accounts()
        return HoldedConnectionTest(
            success=True,
            message=f"Connected successfully. Found {len(accounts)} account(s).",
            accounts_found=len(accounts),
        )
    except ValueError as e:
        return HoldedConnectionTest(success=False, message=str(e))
    except Exception as e:
        return HoldedConnectionTest(success=False, message=f"Connection failed: {str(e)}")
