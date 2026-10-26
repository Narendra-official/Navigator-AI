import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment and .env file."""

    # API configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "OpenSource Navigator AI API"
    VERSION: str = "1.0.0"

    # GitHub Integration
    GITHUB_TOKEN: Optional[str] = None
    GITHUB_API_BASE_URL: str = "https://api.github.com"
    GITHUB_SEARCH_CACHE_TTL_SECONDS: int = 120

    # Ollama Integration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "deepseek-r1:8b"  # Configurable: e.g. qwen3:4b, deepseek-r1:8b, etc.
    OLLAMA_TIMEOUT_SECONDS: float = 180.0

    # CORS configuration: supports both FRONTEND_ORIGIN and CORS_ORIGINS
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    CORS_ORIGINS: Optional[str] = None  # Comma-separated list of allowed origins

    @property
    def allowed_cors_origins(self) -> List[str]:
        """Compute the unique list of allowed CORS origins for local and deployed frontends."""
        origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
        if self.FRONTEND_ORIGIN:
            for item in self.FRONTEND_ORIGIN.split(","):
                clean = item.strip()
                if clean:
                    origins.add(clean)
        if self.CORS_ORIGINS:
            for item in self.CORS_ORIGINS.split(","):
                clean = item.strip()
                if clean:
                    origins.add(clean)
        # Also check FRONTEND_ORIGINS env var
        raw_env = os.environ.get("FRONTEND_ORIGINS")
        if raw_env:
            for item in raw_env.split(","):
                clean = item.strip()
                if clean:
                    origins.add(clean)
        return sorted(list(origins))

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
