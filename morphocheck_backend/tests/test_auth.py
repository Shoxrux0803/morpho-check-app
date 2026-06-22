import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient):
    # Parol yoki email xato bo'lganda 400 qaytarishini tekshirish
    response = await async_client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 400
    assert "Email yoki parol noto'g'ri" in response.json()["message"]
