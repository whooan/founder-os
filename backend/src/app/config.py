from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./founderos.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-5.2"
    openai_model_large: str = "gpt-5.2"
    frontend_url: str = "http://localhost:3000"
    secret_key: str = ""
    debug: bool = True

    model_config = {"env_file": ".env"}


settings = Settings()
