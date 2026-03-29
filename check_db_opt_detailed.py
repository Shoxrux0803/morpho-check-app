import sqlite3
import os

db_path = "d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"

def check_optimization():
    if not os.path.exists(db_path):
        print(f"Baza topilmadi: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print("--- TEKSHIRUV BOSHLANDI ---")
    
    # 1. PRAGMA sozlamalari
    cur.execute("PRAGMA journal_mode")
    jm = cur.fetchone()[0]
    print(f"Journal Mode: {jm} (WAL tavsiya etiladi)")
    
    cur.execute("PRAGMA synchronous")
    sync = cur.fetchone()[0]
    print(f"Synchronous: {sync} (1=NORMAL tavsiya etiladi)")

    # 2. Indekslar ro'yxati
    print("\nMavjud indekslar:")
    cur.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index'")
    indices = cur.fetchall()
    existing_indices = [idx[0] for idx in indices]
    for idx_name, tbl_name in indices:
        print(f" - {idx_name} ({tbl_name})")

    # 3. Muhim ustunlar uchun indekslar borligini tekshirish
    required_indices = [
        ("patient_analysis", ["id_code", "name", "region", "district", "age", "gender", "created_at"]),
        ("users", ["email", "region", "role"]),
        ("payments", ["user_id", "status"])
    ]
    
    missing = []
    for table, columns in required_indices:
        for col in columns:
            # SQLAlchemy odatda ix_table_column ko'rinishida nomlaydi
            # Bizning apply_refactor scriptimiz idx_table_column deb nomlaydi
            found = False
            for idx in existing_indices:
                if (table in idx or idx.startswith("ix_") or idx.startswith("idx_")) and col in idx:
                    found = True
                    break
            if not found:
                missing.append(f"{table}.{col}")

    if missing:
        print("\nDIQQAT! Quyidagi ustunlar uchun indekslar topilmadi:")
        for m in missing:
            print(f" [!] {m}")
    else:
        print("\nHamma muhim ustunlar indekslangan.")

    # 4. Optimizatsiya
    print("\nVACUUM va ANALYZE bajarilmoqda...")
    cur.execute("VACUUM")
    cur.execute("ANALYZE")
    print("Bajarildi.")

    conn.close()

if __name__ == "__main__":
    check_optimization()
