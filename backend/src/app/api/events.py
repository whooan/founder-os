from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_event_service
from app.schemas.event import EventRead
from app.services.event_service import EventService

router = APIRouter()


@router.get("/", response_model=list[EventRead])
async def list_events(
    company_id: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    service: EventService = Depends(get_event_service),
):
    return await service.list_events(
        company_id=company_id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
