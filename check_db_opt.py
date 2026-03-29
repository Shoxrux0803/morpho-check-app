import sqlite3
import os

db_path = "d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"

def check_optimization():
    if not os.path.exists(db_path):
        print(f"Baza topilmadi: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print("--- INDEKSLAR TEKSHIRILMOQDA ---")
    cur.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index'")
    indices = cur.fetchall()
    for idx_name, tbl_name in indices:
        print(f"Indeks: {idx_name} (Jadval: {tbl_name})")

    print("\n--- JADVAL O'LCHAMLARI ---")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    for (table_name,) in tables:
        cur.execute(f"SELECT count(*) FROM {table_name}")
        count = cur.fetchone()[0]
        print(f"Jadval: {table_name}, Yozuvlar soni: {count}")

    print("\n--- PRAGMA SOZLAMALARI ---")
    cur.execute("PRAGMA journal_mode")
    print(f"Journal Mode: {cur.fetchone()[0]}")
    cur.execute("PRAGMA synchronous")
    print(f"Synchronous: {cur.fetchone()[0]} (1=NORMAL, 2=FULL)")
    
    # Optimizatsiya qilish: VACUUM va ANALYZE
    print("\nOptimizatsiya qilinmoqda (VACUUM & ANALYZE)...")
    cur.execute("VACUUM")
    cur.execute("ANALYZE")
    print("Tayyor.")

    conn.close()

if __name__ == "__main__":
    check_optimization()
