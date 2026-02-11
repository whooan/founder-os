from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./signalmap.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    frontend_url: str = "http://localhost:3000"
    debug: bool = True

    model_config = {"env_file": ".env"}


settings = Settings()
