import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# Development da limit kattaroq, production da qat'iyroq
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Limit for authentication endpoints to prevent brute force attacks
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"] if DEBUG else ["60/minute"],
)
