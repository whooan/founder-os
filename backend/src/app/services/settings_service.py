from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.encryption import decrypt_value, encrypt_value, mask_api_key
from app.models.app_setting import AppSetting


class SettingsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, key: str) -> str | None:
        """Get a setting value, decrypting if it's a secret."""
        result = await self.session.execute(
            select(AppSetting).where(AppSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        if setting is None:
            return None
        if setting.is_secret and setting.value:
            return decrypt_value(setting.value)
        return setting.value

    async def set(self, key: str, value: str, is_secret: bool = False) -> None:
        """Set a setting value, encrypting if it's a secret."""
        result = await self.session.execute(
            select(AppSetting).where(AppSetting.key == key)
        )
        setting = result.scalar_one_or_none()

        stored_value = encrypt_value(value) if is_secret and value else value

        if setting is None:
            setting = AppSetting(key=key, value=stored_value, is_secret=is_secret)
            self.session.add(setting)
        else:
            setting.value = stored_value
            setting.is_secret = is_secret

        await self.session.commit()

    async def get_masked(self, key: str) -> str:
        """Get a masked version of a secret setting for display."""
        value = await self.get(key)
        if value is None:
            return ""
        return mask_api_key(value)

    async def get_openai_api_key(self) -> str | None:
        return await self.get("openai_api_key")

    async def get_openai_model(self) -> str | None:
        return await self.get("openai_model")
