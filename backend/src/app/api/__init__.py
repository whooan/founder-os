from fastapi import APIRouter

from app.api.companies import router as companies_router
from app.api.conversations import router as conversations_router
from app.api.events import router as events_router
from app.api.founders import router as founders_router
from app.api.health import router as health_router
from app.api.intelligence import router as intelligence_router
from app.api.market import router as market_router
from app.api.suggestions import router as suggestions_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(companies_router, prefix="/companies", tags=["companies"])
api_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
api_router.include_router(founders_router, prefix="/founders", tags=["founders"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(market_router, prefix="/market", tags=["market"])
api_router.include_router(intelligence_router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(suggestions_router, prefix="/suggestions", tags=["suggestions"])
