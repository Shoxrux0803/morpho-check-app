import sqlite3

def upgrade():
    conn = sqlite3.connect('morphocheck.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_restricted INTEGER DEFAULT 0")
        print("Column 'is_restricted' added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column already exists): {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
