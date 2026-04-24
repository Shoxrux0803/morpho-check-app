
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'morphocheck_backend'))

from morphocheck_backend.utils.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()

print(f"Tables in database: {tables}")
if 'chat_messages' in tables:
    print("SUCCESS: chat_messages table exists.")
else:
    print("WARNING: chat_messages table MISSING!")
