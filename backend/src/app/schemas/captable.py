from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Share Classes ────────────────────────────────────────────

class ShareClassCreate(BaseModel):
    name: str
    votes_per_share: int = 1
    liquidation_preference: str | None = None
    seniority: int = 0


class ShareClassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    votes_per_share: int
    liquidation_preference: str | None
    seniority: int
    created_at: datetime | None = None


# ── Stakeholders ─────────────────────────────────────────────

class StakeholderCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    type: str  # founder | employee | angel | vc | other
    entity_name: str | None = None
    contact_person: str | None = None
    partner_emails: str | None = None
    linkedin_url: str | None = None
    notes: str | None = None


class StakeholderUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    type: str | None = None
    entity_name: str | None = None
    contact_person: str | None = None
    partner_emails: str | None = None
    linkedin_url: str | None = None
    notes: str | None = None


class StakeholderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str | None
    phone: str | None
    type: str
    entity_name: str | None
    contact_person: str | None
    partner_emails: str | None
    linkedin_url: str | None
    notes: str | None
    created_at: datetime | None = None


# ── Allocations ──────────────────────────────────────────────

class AllocationCreate(BaseModel):
    stakeholder_id: str
    share_class_id: str
    shares: int
    amount_invested: float | None = None
    ownership_pct: float = 0.0
    notes: str | None = None


class AllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    stakeholder_id: str
    stakeholder_name: str | None = None
    share_class_id: str
    share_class_name: str | None = None
    shares: int
    amount_invested: float | None
    ownership_pct: float
    notes: str | None


# ── Equity Events ────────────────────────────────────────────

class EquityEventCreate(BaseModel):
    name: str
    event_type: str  # incorporation | funding_round | grant | secondary | conversion
    date: str | None = None  # ISO date string
    pre_money_valuation: float | None = None
    amount_raised: float | None = None
    price_per_share: float | None = None
    total_shares_after: int | None = None
    notes: str | None = None
    allocations: list[AllocationCreate] = []


class EquityEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    event_type: str
    date: datetime | None
    pre_money_valuation: float | None
    amount_raised: float | None
    price_per_share: float | None
    total_shares_after: int | None
    notes: str | None
    allocations: list[AllocationRead] = []
    created_at: datetime | None = None


# ── Cap Table Snapshot ───────────────────────────────────────

class CapTableRow(BaseModel):
    stakeholder: StakeholderRead
    shares_by_class: dict[str, int]
    total_shares: int
    ownership_pct: float
    total_invested: float


class CapTableSnapshot(BaseModel):
    rows: list[CapTableRow]
    total_shares: int
    share_classes: list[ShareClassRead]


class CapTableEvolutionEntry(BaseModel):
    event: EquityEventRead
    snapshot: list[CapTableRow]


# ── KPI Summary ──────────────────────────────────────────────

class CapTableKPIs(BaseModel):
    last_valuation: float | None
    post_money_valuation: float | None
    total_raised: float
    total_shareholders: int
    founder_ownership_pct: float
    total_shares: int
    rounds_count: int
    last_round_name: str | None
