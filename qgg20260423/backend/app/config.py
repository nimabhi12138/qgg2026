from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_SECRET_KEY = "qgg-dev-secret-key"


class Settings(BaseSettings):
    app_name: str = "QGG API"
    environment: str = "development"
    secret_key: str = DEFAULT_SECRET_KEY
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    database_url: str = "sqlite:///./qgg_dev.db"

    model_config = SettingsConfigDict(env_prefix="QGG_", case_sensitive=False)

    @model_validator(mode="after")
    def require_secret_for_non_dev(self):
        if self.environment.lower() not in {"dev", "development", "local", "test"} and self.secret_key == DEFAULT_SECRET_KEY:
            raise ValueError("QGG_SECRET_KEY must be set outside development")
        return self


settings = Settings()

