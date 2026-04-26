
import sqlite3
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "sqlite:///morphocheck.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_pow():
    db = SessionLocal()
    try:
        # Try a simple power calculation using func.pow
        result = db.execute(text("SELECT pow(2, 3)")).scalar()
        print(f"Result of pow(2, 3): {result}")
    except Exception as e:
        print(f"Error executing pow: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_pow()
