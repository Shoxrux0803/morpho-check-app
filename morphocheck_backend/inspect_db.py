import sqlite3


def check_db():
    conn = sqlite3.connect("morphocheck.db")
    cursor = conn.cursor()

    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in DB:")
    for table in tables:
        t_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {t_name}")
        count = cursor.fetchone()[0]
        print(f" - {t_name}: {count} rows")

    print("\nIndices in DB:")
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index';")
    indices = cursor.fetchall()
    for index in indices:
        print(f" - {index[0]} on {index[1]}")

    # Check WAL mode
    cursor.execute("PRAGMA journal_mode;")
    mode = cursor.fetchone()[0]
    print(f"\nJournal mode: {mode}")

    # Check for missing foreign key indices (manual check)
    print("\nChecking for missing indices on Foreign Keys:")
    # We can't easily automate this without parsing SQL, but let's see chat_messages specifically
    cursor.execute("PRAGMA index_list('chat_messages');")
    chat_indices = cursor.fetchall()
    print(f"Indices on chat_messages: {chat_indices}")

    conn.close()


if __name__ == "__main__":
    check_db()
