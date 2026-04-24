
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'morphocheck_backend'))

from morphocheck_backend.main import app

print("Exposed routes:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"{route.methods if hasattr(route, 'methods') else 'ALL'} {route.path}")
