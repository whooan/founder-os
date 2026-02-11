from fastapi import APIRouter, Depends

from app.api.deps import get_market_service
from app.schemas.market import MarketGraphData
from app.services.market_service import MarketService

router = APIRouter()


@router.get("/graph", response_model=MarketGraphData)
async def get_market_graph(
    service: MarketService = Depends(get_market_service),
):
    return await service.build_graph()
