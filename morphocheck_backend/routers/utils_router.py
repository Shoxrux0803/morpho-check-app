# morphocheck_backend/routers/utils_router.py
import httpx
from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter(tags=["Utilities"])
logger = logging.getLogger("uvicorn.error")

@router.get("/geo-ip")
async def get_geo_ip(request: Request):
    # Try to get IP from headers (behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    client_ip = forwarded.split(",")[0] if forwarded else request.client.host
    
    logger.info(f"[GEO-IP] Request from IP: {client_ip}")
    
    url = f"https://ipapi.co/{client_ip}/json/"
    # If it's localhost or internal, ipapi.co needs to be called without IP to get server's location
    if client_ip in ["127.0.0.1", "localhost", "::1"] or client_ip.startswith("192.168."):
        url = "https://ipapi.co/json/"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"[GEO-IP ERROR] ipapi.co returned {response.status_code}")
                # Fallback data if API fails
                return {"city": "Tashkent", "country_name": "Uzbekistan", "latitude": 41.2995, "longitude": 69.2401}
        except Exception as e:
            logger.error(f"[GEO-IP EXCEPTION] {str(e)}")
            return {"city": "Tashkent", "country_name": "Uzbekistan", "latitude": 41.2995, "longitude": 69.2401}
