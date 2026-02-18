from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings
from app.models.base import Base

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
# Alias used by orchestrator and background tasks
async_session = async_session_factory


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add columns to existing tables (SQLite ALTER TABLE)
        await _add_column_if_missing(conn, "bank_transactions", "category", "VARCHAR(100)")


async def _add_column_if_missing(conn, table: str, column: str, col_type: str):
    """Safely add a column to an existing SQLite table."""
    import sqlalchemy as sa

    result = await conn.execute(sa.text(f"PRAGMA table_info({table})"))
    columns = [row[1] for row in result.fetchall()]
    if column not in columns:
        await conn.execute(sa.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
