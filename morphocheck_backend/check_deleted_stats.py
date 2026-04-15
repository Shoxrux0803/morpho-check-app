from sqlalchemy import create_engine, text
import os

db_url = "sqlite:///morphocheck.db"
engine = create_engine(db_url)

with engine.connect() as conn:
    res = conn.execute(text("SELECT is_deleted, COUNT(*) FROM patient_analysis GROUP BY is_deleted"))
    for row in res:
        print(f"is_deleted={row[0]}, count={row[1]}")
