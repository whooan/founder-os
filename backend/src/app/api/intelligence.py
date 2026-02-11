from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.intelligence import AskQuery, AskResponse

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask_intelligence(
    query: AskQuery,
    session: AsyncSession = Depends(get_db),
):
    from app.intelligence.ask import ask_intelligence as do_ask

    return await do_ask(query, session)
