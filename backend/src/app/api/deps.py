from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.company_service import CompanyService
from app.services.event_service import EventService
from app.services.market_service import MarketService


async def get_db(
    session: AsyncSession = Depends(get_session),
) -> AsyncSession:
    return session


async def get_company_service(
    session: AsyncSession = Depends(get_session),
) -> CompanyService:
    return CompanyService(session)


async def get_event_service(
    session: AsyncSession = Depends(get_session),
) -> EventService:
    return EventService(session)


async def get_market_service(
    session: AsyncSession = Depends(get_session),
) -> MarketService:
    return MarketService(session)
