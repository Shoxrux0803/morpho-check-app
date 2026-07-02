import ipaddress
import json
from functools import lru_cache
from urllib.error import URLError
from urllib.request import Request as UrlRequest, urlopen


def _clean_ip(ip_address: str | None) -> str:
    value = (ip_address or "").strip()
    if value.startswith("[") and "]" in value:
        return value[1 : value.index("]")]
    if value.count(":") == 1 and "." in value:
        return value.split(":", 1)[0]
    return value


def describe_ip_location(ip_address: str | None) -> dict:
    ip = _clean_ip(ip_address)
    if not ip:
        return {"label": "Unknown location", "city": None, "country": None, "source": "empty"}
    if ip == "testclient":
        return {"label": "Test client", "city": None, "country": None, "source": "test"}

    try:
        parsed = ipaddress.ip_address(ip)
    except ValueError:
        return {"label": "Unknown location", "city": None, "country": None, "source": "invalid"}

    if parsed.is_loopback:
        return {"label": "Local device", "city": None, "country": None, "source": "local"}
    if parsed.is_private:
        return {"label": "Private network", "city": None, "country": None, "source": "private"}
    if parsed.is_reserved or parsed.is_multicast or parsed.is_unspecified:
        return {"label": "Network address", "city": None, "country": None, "source": "network"}

    return _lookup_public_ip(ip)


@lru_cache(maxsize=512)
def _lookup_public_ip(ip_address: str) -> dict:
    url = (
        f"http://ip-api.com/json/{ip_address}"
        "?fields=status,country,city,regionName,query,message"
    )
    request = UrlRequest(url, headers={"User-Agent": "MorphoCheck/1.0"})
    try:
        with urlopen(request, timeout=0.8) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, ValueError):
        return {"label": "Location unavailable", "city": None, "country": None, "source": "lookup_failed"}

    if data.get("status") != "success":
        return {"label": "Location unavailable", "city": None, "country": None, "source": "lookup_failed"}

    city = data.get("city") or data.get("regionName")
    country = data.get("country")
    label = ", ".join(part for part in (city, country) if part) or "Location unavailable"
    return {"label": label, "city": city, "country": country, "source": "ip-api"}


def describe_user_agent(user_agent: str | None) -> dict:
    ua = (user_agent or "").strip()
    if not ua:
        return {"device": "Unknown device", "program": "Unknown app", "label": "Unknown device - Unknown app"}

    lower = ua.lower()
    os_name = _detect_os(lower)
    device_type = _detect_device_type(lower)
    program = _detect_program(ua, lower)
    device = " ".join(part for part in (os_name, device_type) if part).strip() or "Unknown device"

    return {
        "device": device,
        "program": program,
        "label": f"{device} - {program}",
        "raw": ua,
    }


def _detect_os(lower_ua: str) -> str:
    if "windows" in lower_ua:
        return "Windows"
    if "android" in lower_ua:
        return "Android"
    if "iphone" in lower_ua or "ipad" in lower_ua or "ios" in lower_ua:
        return "iOS"
    if "mac os" in lower_ua or "macintosh" in lower_ua:
        return "macOS"
    if "linux" in lower_ua:
        return "Linux"
    return "Unknown"


def _detect_device_type(lower_ua: str) -> str:
    if "bot" in lower_ua or "crawler" in lower_ua or "spider" in lower_ua:
        return "bot"
    if "ipad" in lower_ua or "tablet" in lower_ua:
        return "tablet"
    if "mobile" in lower_ua or "iphone" in lower_ua or "android" in lower_ua:
        return "phone"
    return "desktop"


def _detect_program(user_agent: str, lower_ua: str) -> str:
    checks = (
        ("edg/", "Microsoft Edge"),
        ("opr/", "Opera"),
        ("opera", "Opera"),
        ("samsungbrowser", "Samsung Internet"),
        ("firefox/", "Firefox"),
        ("chrome/", "Chrome"),
        ("crios/", "Chrome"),
        ("safari/", "Safari"),
        ("postmanruntime", "Postman"),
        ("insomnia", "Insomnia"),
        ("curl/", "curl"),
        ("python-requests", "Python requests"),
        ("httpx", "httpx"),
    )
    for marker, name in checks:
        if marker in lower_ua:
            return name
    if "/" in user_agent and "mozilla" not in lower_ua:
        return user_agent.split(" ", 1)[0][:60]
    return "Unknown app"
