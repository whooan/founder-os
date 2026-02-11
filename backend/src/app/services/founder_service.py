from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.founder import Founder
from app.schemas.founder import FounderUpdate


class FounderService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, founder_id: str) -> Founder | None:
        stmt = select(Founder).where(Founder.id == founder_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, founder_id: str, data: FounderUpdate) -> Founder | None:
        """Partial update of founder fields."""
        founder = await self.get_by_id(founder_id)
        if not founder:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(founder, field, value)
        await self.session.commit()
        await self.session.refresh(founder)
        return founder
