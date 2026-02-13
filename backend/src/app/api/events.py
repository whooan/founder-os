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
    limit: int = 200,
    service: EventService = Depends(get_event_service),
):
    events = await service.list_events(
        company_id=company_id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    # Build response with company info from eagerly-loaded relationship
    result = []
    for event in events:
        data = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "event_date": event.event_date,
            "source_url": event.source_url,
            "source_type": event.source_type,
            "sentiment": event.sentiment,
            "significance": event.significance,
            "company_id": event.company_id,
            "company_name": event.company.name if event.company else "",
            "company_domain": event.company.domain if event.company else None,
            "founder_id": event.founder_id,
            "raw_content": event.raw_content,
            "created_at": event.created_at,
        }
        result.append(data)
    return result
