from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event


class EventService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_events(
        self,
        company_id: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Event]:
        stmt = select(Event)

        if company_id:
            stmt = stmt.where(Event.company_id == company_id)
        if event_type:
            stmt = stmt.where(Event.event_type == event_type)
        if start_date:
            stmt = stmt.where(Event.event_date >= start_date)
        if end_date:
            stmt = stmt.where(Event.event_date <= end_date)

        stmt = stmt.order_by(Event.event_date.desc().nullslast()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, event_id: str) -> Event | None:
        stmt = select(Event).where(Event.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
