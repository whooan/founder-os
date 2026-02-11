from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_founder_service
from app.models.founder import Founder
from app.schemas.founder import FounderRead, FounderUpdate
from app.services.founder_service import FounderService

router = APIRouter()


@router.get("/", response_model=list[FounderRead])
async def list_founders(
    company_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Founder)
    if company_id:
        stmt = stmt.where(Founder.company_id == company_id)
    stmt = stmt.offset(skip).limit(limit).order_by(Founder.name)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.patch("/{founder_id}")
async def update_founder(
    founder_id: str,
    data: FounderUpdate,
    service: FounderService = Depends(get_founder_service),
):
    founder = await service.update(founder_id, data)
    if not founder:
        raise HTTPException(status_code=404, detail="Founder not found")
    return founder
