import os

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.settings_service import SettingsService

HOLDED_BASE_URL = "https://api.holded.com"


class HoldedClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"key": api_key, "Accept": "application/json"}

    @classmethod
    async def from_session(cls, session: AsyncSession) -> "HoldedClient":
        svc = SettingsService(session)
        api_key = await svc.get("holded_api_key")
        if not api_key:
            api_key = os.environ.get("HOLDED_API_KEY", "")
        if not api_key:
            raise ValueError("Holded API key not configured")
        return cls(api_key)

    async def get_treasury_accounts(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{HOLDED_BASE_URL}/api/invoicing/v1/treasury",
                headers=self.headers,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_payments(
        self, start_timestamp: int | None = None, end_timestamp: int | None = None
    ) -> list[dict]:
        params: dict[str, str] = {}
        if start_timestamp is not None:
            params["starttmp"] = str(start_timestamp)
        if end_timestamp is not None:
            params["endtmp"] = str(end_timestamp)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{HOLDED_BASE_URL}/api/invoicing/v1/payments",
                headers=self.headers,
                params=params,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def test_connection(self) -> bool:
        try:
            await self.get_treasury_accounts()
            return True
        except Exception:
            return False
