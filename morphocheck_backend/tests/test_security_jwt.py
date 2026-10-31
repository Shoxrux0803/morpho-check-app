from datetime import timedelta

import jwt

from utils.security import ALGORITHM, SECRET_KEY, create_access_token


def test_access_token_round_trip_with_pyjwt():
    token = create_access_token(
        {"sub": "audit@example.com"},
        expires_delta=timedelta(minutes=5),
    )

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["sub"] == "audit@example.com"
    assert payload["jti"]
    assert payload["exp"] > payload["iat"]
