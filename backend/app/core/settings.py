from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "orchestrator-api"
    environment: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///backend/data/app.db"
    cors_allow_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    auth_enabled: bool = True
    admin_email: str = "admin@voicenexus.ai"
    admin_password: str = "admin123"
    editor_email: str = "operator@voicenexus.ai"
    editor_password: str = "operator123"
    viewer_email: str = "viewer@voicenexus.ai"
    viewer_password: str = "viewer123"
    admin_api_token: str = "dev-admin-token"
    editor_api_token: str = "dev-editor-token"
    viewer_api_token: str = "dev-viewer-token"

    def parsed_cors_origins(self) -> list[str]:
        origins = [item.strip() for item in self.cors_allow_origins.split(",") if item.strip()]

        return origins if origins else ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
