"""Root ASGI entrypoint for local uvicorn commands.

This lets `uvicorn main:app` work from the repository root while preserving
the backend app's existing relative imports and file paths.
"""

import os
import sys
import importlib.util
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "morphocheck_backend"
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

spec = importlib.util.spec_from_file_location("morphocheck_backend_main", BACKEND_DIR / "main.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load morphocheck_backend/main.py")

backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)

app = backend_main.app
