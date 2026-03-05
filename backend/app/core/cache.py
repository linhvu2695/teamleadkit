import time
import logging
from typing import Optional


class InMemoryCache:
    """Drop-in replacement for RedisCache using a simple in-memory dict with per-key TTL."""

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(InMemoryCache, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._store: dict[str, tuple[str, float]] = {}
        self._initialized = True

    async def get(self, key: str) -> Optional[str]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expire_at = entry
        if time.time() >= expire_at:
            del self._store[key]
            return None
        return value

    async def set(self, key: str, value: str, expiration: int = 60) -> bool:
        self._store[key] = (value, time.time() + expiration)
        return True

    async def check_health(self):
        logging.getLogger("uvicorn.info").info("In-memory cache is ready")
        return True

    async def close(self):
        self._store.clear()
        self._initialized = False
