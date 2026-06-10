import sqlite3
import os
from sqlalchemy import create_engine, inspect
from models.base import Base
# Import all models to ensure they are registered with Base.metadata

DATABASE_URL = "sqlite:///morphocheck.db"


def fix_database():
    if not os.path.exists("morphocheck.db"):
        print("Database file not found.")
        return

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    conn = sqlite3.connect("morphocheck.db")
    cursor = conn.cursor()

    # Iterate over all tables defined in SQLAlchemy models
    for table_name, table in Base.metadata.tables.items():
        if not inspector.has_table(table_name):
            print(f"Table {table_name} does not exist. Creating...")
            table.create(engine)
            continue

        # Get existing columns in DB
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = {row[1]: row[2] for row in cursor.fetchall()}

        # Check for missing columns
        for column in table.columns:
            if column.name not in existing_cols:
                print(f"Adding missing column {column.name} to table {table_name}...")

                # Determine type
                col_type = str(column.type).upper()
                if "VARCHAR" in col_type or "STRING" in col_type:
                    sql_type = "TEXT"
                elif "FLOAT" in col_type or "DECIMAL" in col_type:
                    sql_type = "FLOAT"
                elif "INTEGER" in col_type:
                    sql_type = "INTEGER"
                elif "DATETIME" in col_type:
                    sql_type = "DATETIME"
                else:
                    sql_type = "TEXT"

                try:
                    cursor.execute(
                        f"ALTER TABLE {table_name} ADD COLUMN {column.name} {sql_type}"
                    )
                    print(f"Successfully added {column.name}")
                except Exception as e:
                    print(f"Error adding {column.name}: {e}")

    conn.commit()
    conn.close()
    print("Database sync complete.")


if __name__ == "__main__":
    fix_database()
