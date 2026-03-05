from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    db_path: str = str(Path(__file__).parent.parent.parent / "data" / "teamleadkit.db")

    class Config:
        env_file = ".env"

settings = Settings()  # type: ignore
