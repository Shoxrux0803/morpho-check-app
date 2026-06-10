from sqlalchemy.orm import Session
from models.clinical import ClinicalSetting
from typing import Dict, Any
import time

from services.cache_service import cache_service


class ClinicalService:
    """
    Klinik sozlamalarni boshqarish va keshdan olish.
    """

    _cache = {}
    _last_refresh = 0
    _ttl = 600  # 10 minut kesh

    @classmethod
    def get_all_settings(
        cls, db: Session, bypass_cache: bool = False
    ) -> Dict[str, Any]:
        """Barcha sozlamalarni guruhlangan holda qaytaradi."""
        now = time.time()
        if not bypass_cache and cls._cache and (now - cls._last_refresh < cls._ttl):
            return cls._cache

        settings = db.query(ClinicalSetting).all()
        result = {}
        for s in settings:
            # key orqali to'g'ridan-to'g'ri kirish uchun lug'at
            result[s.key] = s.value_json

        cls._cache = result
        cls._last_refresh = now
        return result

    @classmethod
    def get_setting(cls, db: Session, key: str, default: Any = None) -> Any:
        """Ma'lum bir kalit bo'yicha qiymatni qaytaradi."""
        all_s = cls.get_all_settings(db)
        return all_s.get(key, default)

    @classmethod
    def clear_cache(cls):
        """Keshni tozalash (o'zgarish bo'lganda chaqiriladi)."""
        cls._cache = {}
        cls._last_refresh = 0
        cache_service.delete_pattern("morphocheck:analysis:*")


clinical_service = ClinicalService()
