# morphocheck_backend/routers/utils_router.py
import ipaddress
import logging

import httpx
from fastapi import APIRouter, Request

router = APIRouter(tags=["Utilities"])
logger = logging.getLogger("uvicorn.error")

DEFAULT_GEO_IP = {
    "city": "Tashkent",
    "country_name": "Uzbekistan",
    "latitude": 41.2995,
    "longitude": 69.2401,
    "source": "fallback",
}


def _is_local_or_private_ip(ip_value: str | None) -> bool:
    value = (ip_value or "").strip()
    if value in {"localhost", "testclient"}:
        return True
    try:
        parsed = ipaddress.ip_address(value)
    except ValueError:
        return False
    return parsed.is_loopback or parsed.is_private or parsed.is_reserved


@router.get("/geo-ip")
async def get_geo_ip(request: Request):
    forwarded = request.headers.get("X-Forwarded-For")
    client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

    logger.info(f"[GEO-IP] Request from IP: {client_ip}")

    if _is_local_or_private_ip(client_ip):
        return DEFAULT_GEO_IP

    url = f"https://ipapi.co/{client_ip}/json/"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            logger.warning("[GEO-IP] ipapi.co returned %s; using fallback", response.status_code)
            return DEFAULT_GEO_IP
        except Exception as exc:
            logger.warning("[GEO-IP] lookup failed: %s", exc)
            return DEFAULT_GEO_IP
