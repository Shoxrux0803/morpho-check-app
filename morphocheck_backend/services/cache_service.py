import json
import os
import time
from collections import OrderedDict
from hashlib import sha256
from typing import Any, Optional

try:
    import redis
except ImportError:  # pragma: no cover - dependency can be absent in local dev
    redis = None


class CacheService:
    """
    Optional Redis-backed cache with an in-process TTL fallback.
    """

    def __init__(self) -> None:
        self._memory: OrderedDict[str, tuple[float, str]] = OrderedDict()
        self._memory_max = int(os.getenv("CACHE_MEMORY_MAX_ITEMS", "512"))
        self._redis_client = None
        self._redis_checked_at = 0.0
        self._redis_retry_seconds = 30

    @staticmethod
    def make_key(namespace: str, payload: Any) -> str:
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
        return f"morphocheck:{namespace}:{sha256(raw.encode('utf-8')).hexdigest()}"

    def get_json(self, key: str) -> Optional[Any]:
        cached = self._redis_get(key)
        if cached is None:
            cached = self._memory_get(key)
        if cached is None:
            return None
        try:
            return json.loads(cached)
        except (TypeError, json.JSONDecodeError):
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = int(ttl_seconds or os.getenv("CACHE_TTL_SECONDS", "900"))
        encoded = json.dumps(value, ensure_ascii=False, default=str)
        if not self._redis_set(key, encoded, ttl):
            self._memory_set(key, encoded, ttl)

    def delete_pattern(self, pattern: str) -> None:
        client = self._redis()
        if client:
            try:
                for key in client.scan_iter(pattern):
                    client.delete(key)
            except Exception:
                pass
        prefix = pattern.rstrip("*")
        for key in list(self._memory.keys()):
            if key.startswith(prefix):
                self._memory.pop(key, None)

    def _redis(self):
        if redis is None or os.getenv("CACHE_BACKEND", "redis").lower() == "memory":
            return None
        now = time.time()
        if self._redis_client is not None:
            return self._redis_client
        if now - self._redis_checked_at < self._redis_retry_seconds:
            return None
        self._redis_checked_at = now
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            return None
        try:
            client = redis.Redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
            client.ping()
            self._redis_client = client
            return client
        except Exception:
            self._redis_client = None
            return None

    def _redis_get(self, key: str) -> Optional[str]:
        client = self._redis()
        if not client:
            return None
        try:
            value = client.get(key)
            if value is None:
                return None
            return value.decode("utf-8") if isinstance(value, bytes) else value
        except Exception:
            self._redis_client = None
            return None

    def _redis_set(self, key: str, value: str, ttl: int) -> bool:
        client = self._redis()
        if not client:
            return False
        try:
            client.setex(key, ttl, value)
            return True
        except Exception:
            self._redis_client = None
            return False

    def _memory_get(self, key: str) -> Optional[str]:
        item = self._memory.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at < time.time():
            self._memory.pop(key, None)
            return None
        self._memory.move_to_end(key)
        return value

    def _memory_set(self, key: str, value: str, ttl: int) -> None:
        self._memory[key] = (time.time() + ttl, value)
        self._memory.move_to_end(key)
        while len(self._memory) > self._memory_max:
            self._memory.popitem(last=False)


cache_service = CacheService()
