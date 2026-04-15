from slowapi import Limiter
from slowapi.util import get_remote_address

# Limit for authentication endpoints to prevent brute force attacks
limiter = Limiter(key_func=get_remote_address)
