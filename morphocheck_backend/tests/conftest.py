import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app, ensure_schema_updates


@pytest_asyncio.fixture
async def async_client():
    ensure_schema_updates()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
