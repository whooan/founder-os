from pydantic import BaseModel


class TreasuryAccountRead(BaseModel):
    id: str
    holded_id: str
    name: str
    account_type: str
    balance: float
    iban: str | None
    currency: str


class MonthlySummary(BaseModel):
    year_month: str
    income: float
    expenses: float
    net: float
    is_forecast: bool = False
    projected_cash: float | None = None


class ExpenseCategory(BaseModel):
    category: str
    contact_name: str | None = None
    total: float
    transaction_count: int


class BurnRates(BaseModel):
    three_month: float
    six_month: float
    twelve_month: float


class RunwayScenarios(BaseModel):
    worst: float | None  # cash / avg_burn (expenses only, zero income)
    current: float | None  # cash / (avg_burn - avg_income)
    best: float | None  # cash / 12mo_avg_net_burn
    forecast: float | None  # cash / forecast_burn (from settings, zero income)


class ForecastSettings(BaseModel):
    monthly_burn: float = 0.0
    monthly_income: float = 0.0


class FinanceKPIs(BaseModel):
    cash_position: float
    monthly_burn: float
    monthly_income: float
    runway_months: float | None
    runway_scenarios: RunwayScenarios
    net_last_month: float
    burn_rates: BurnRates


class FinanceDashboard(BaseModel):
    kpis: FinanceKPIs
    monthly_summary: list[MonthlySummary]
    expense_breakdown: list[ExpenseCategory]
    income_sources: list[ExpenseCategory]
    treasury_accounts: list[TreasuryAccountRead]
    last_synced: str | None
    forecast: ForecastSettings


class SyncResult(BaseModel):
    accounts_synced: int
    transactions_synced: int
    status: str


class HoldedConnectionTest(BaseModel):
    success: bool
    message: str
    accounts_found: int = 0


class SyncStatus(BaseModel):
    status: str  # "idle" | "syncing" | "done" | "error"
    step: str
    progress: int  # 0-100


# ── Category rules ──────────────────────────────────────────

class CategoryRuleRead(BaseModel):
    id: str
    contact_name: str
    category: str
    is_auto: bool


class CategoryRuleUpdate(BaseModel):
    contact_name: str
    category: str


# ── Planned expenses ────────────────────────────────────────

class PlannedExpenseRead(BaseModel):
    id: str
    name: str
    category: str
    amount: float
    quarter: str | None
    is_recurring: bool
    notes: str | None


class PlannedExpenseCreate(BaseModel):
    name: str
    category: str
    amount: float
    quarter: str | None = None
    is_recurring: bool = False
    notes: str | None = None


class PlannedExpenseUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    amount: float | None = None
    quarter: str | None = None
    is_recurring: bool | None = None
    notes: str | None = None
