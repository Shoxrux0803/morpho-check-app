import os
import sqlite_utils

def migrate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "morphocheck.db")
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    db = sqlite_utils.Database(db_path)
    table = db["users"]
    
    columns = table.columns_dict
    
    new_columns = {
        "last_active_at": str, # DateTime stores as ISO string in SQLite usually or handled by SQLAlchemy
        "last_form_open_at": str,
        "total_entry_time_seconds": int,
        "completed_entries_count": int
    }
    
    for col, col_type in new_columns.items():
        if col not in columns:
            print(f"Adding column {col} to users table...")
            table.add_column(col, col_type)
        else:
            print(f"Column {col} already exists.")

if __name__ == "__main__":
    migrate()
