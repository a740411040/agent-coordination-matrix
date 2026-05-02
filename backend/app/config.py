from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "Composite Visual AI Agent Coordination System"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/futureagent.db"

    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    MIMO_API_KEY: str = ""
    MIMO_BASE_URL: str = ""

    DEFAULT_PROVIDER: str = "mock"
    DEFAULT_MODEL: str = "default"

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000","https://futureagent-c0ab4cnu.edgeone.cool"]'

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
