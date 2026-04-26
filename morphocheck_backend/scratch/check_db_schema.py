
import sqlite3

conn = sqlite3.connect("morphocheck.db")
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(patient_analysis)")
columns = cursor.fetchall()
for col in columns:
    print(col)
conn.close()
