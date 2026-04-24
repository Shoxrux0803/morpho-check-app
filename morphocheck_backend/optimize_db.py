import sqlite3

def optimize():
    conn = sqlite3.connect('morphocheck.db')
    cursor = conn.cursor()
    
    print("Applying optimizations...")
    
    # 1. Chat Messages
    print(" - Updating chat_messages indices...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_sender_id ON chat_messages (sender_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_recipient_id ON chat_messages (recipient_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_is_read ON chat_messages (is_read);")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_created_at ON chat_messages (created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_message_type ON chat_messages (message_type);")

    # 2. Users
    print(" - Updating users indices...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_last_active_at ON users (last_active_at);")

    # 3. Patient Analysis & Research Records (Composite indices)
    print(" - Updating patient_analysis & research_records composite indices...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_patient_analysis_deleted_created ON patient_analysis (is_deleted, created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_deleted_created ON research_records (is_deleted, created_at);")

    # 4. Remove redundant indices (Optional but cleaner)
    # primary key indices are often named like 'sqlite_autoindex_table_1' but SQLAlchemy might have created explicit ones
    # Let's check and remove if they exist
    redundant = [
        'ix_chat_messages_id', 
        'ix_users_id', 
        'ix_patient_analysis_id', 
        'ix_research_records_id',
        'ix_audit_logs_id'
    ]
    for idx in redundant:
        try:
            cursor.execute(f"DROP INDEX IF EXISTS {idx};")
            print(f" - Dropped redundant index: {idx}")
        except:
            pass

    # 5. Maintenance
    print(" - Running ANALYZE...")
    cursor.execute("ANALYZE;")
    
    print(" - Running VACUUM...")
    cursor.execute("VACUUM;")
    
    conn.commit()
    conn.close()
    print("Database optimization completed successfully!")

if __name__ == "__main__":
    optimize()
