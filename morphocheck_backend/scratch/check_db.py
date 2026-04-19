import sys
import os
from sqlalchemy import create_engine, inspect

# Add parent dir to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import SQLALCHEMY_DATABASE_URL

def check_db():
    print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    inspector = inspect(engine)
    
    if "users" in inspector.get_table_names():
        print("Table 'users' exists.")
        columns = inspector.get_columns("users")
        for column in columns:
            print(f"Column: {column['name']} ({column['type']})")
    else:
        print("Table 'users' DOES NOT exist!")

if __name__ == "__main__":
    check_db()
