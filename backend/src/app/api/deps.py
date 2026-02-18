from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.company_service import CompanyService
from app.services.event_service import EventService
from app.services.founder_service import FounderService
from app.services.captable_service import CapTableService
from app.services.legal_service import LegalService
from app.services.market_service import MarketService
from app.services.vsop_service import VsopService


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


async def get_founder_service(
    session: AsyncSession = Depends(get_session),
) -> FounderService:
    return FounderService(session)


async def get_market_service(
    session: AsyncSession = Depends(get_session),
) -> MarketService:
    return MarketService(session)


async def get_captable_service(
    session: AsyncSession = Depends(get_session),
) -> CapTableService:
    return CapTableService(session)


async def get_legal_service(
    session: AsyncSession = Depends(get_session),
) -> LegalService:
    return LegalService(session)


async def get_vsop_service(
    session: AsyncSession = Depends(get_session),
) -> VsopService:
    return VsopService(session)
