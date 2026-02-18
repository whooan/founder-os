from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── VSOP Pool ────────────────────────────────────────────────

class VsopPoolCreate(BaseModel):
    name: str = "Employee VSOP Pool"
    total_shares: int
    share_class_id: str | None = None
    notes: str | None = None


class VsopPoolUpdate(BaseModel):
    name: str | None = None
    total_shares: int | None = None
    share_class_id: str | None = None
    notes: str | None = None


class VsopPoolRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    total_shares: int
    share_class_id: str | None
    notes: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ── VSOP Grants ──────────────────────────────────────────────

class VsopGrantCreate(BaseModel):
    stakeholder_id: str
    shares_granted: int
    strike_price: float | None = None
    grant_date: str | None = None  # ISO date
    cliff_months: int = 12
    vesting_months: int = 48
    notes: str | None = None


class VsopGrantUpdate(BaseModel):
    shares_granted: int | None = None
    strike_price: float | None = None
    grant_date: str | None = None
    cliff_months: int | None = None
    vesting_months: int | None = None
    status: str | None = None
    notes: str | None = None


class VsopGrantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    stakeholder_id: str
    stakeholder_name: str | None = None
    shares_granted: int
    strike_price: float | None
    grant_date: datetime | None
    cliff_months: int
    vesting_months: int
    status: str
    notes: str | None
    # Computed vesting fields
    vested_shares: int = 0
    unvested_shares: int = 0
    vesting_pct: float = 0.0
    cliff_met: bool = False
    created_at: datetime | None = None


# ── Pool Summary (computed) ──────────────────────────────────

class VsopSummary(BaseModel):
    pool: VsopPoolRead | None
    grants: list[VsopGrantRead]
    total_granted: int
    total_available: int
    total_vested: int
    total_unvested: int
    pool_utilization_pct: float
    overall_vesting_pct: float
