import os
import sqlite3

db_path = "d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"


def apply_final_optimizations():
    if not os.path.exists(db_path):
        print(f"Baza topilmadi: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print("--- OPTIMIZATSIYA BOSHLANDI ---")

    # 1. Dublikat indekscni o'chirish
    try:
        cur.execute("DROP INDEX IF EXISTS idx_patient_region")
        print("[+] Dublikat indeks o'chirildi: idx_patient_region")
    except Exception as e:
        print(f"[!] Xato (idx_patient_region): {e}")

    # 2. Yetishmayotgan indekslarni qo'shish
    indices_to_add = [
        (
            "ix_patient_analysis_examination_date",
            "patient_analysis",
            "examination_date",
        ),
        ("ix_patient_analysis_birth_date", "patient_analysis", "birth_date"),
    ]

    for idx_name, table, col in indices_to_add:
        try:
            cur.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({col})")
            print(f"[+] Indeks qo'shildi: {idx_name} ({table}.{col})")
        except Exception as e:
            print(f"[!] Xato ({idx_name}): {e}")

    # 3. VACUUM va ANALYZE
    print("\nVACUUM bajarilmoqda...")
    cur.execute("VACUUM")
    print("ANALYZE bajarilmoqda...")
    cur.execute("ANALYZE")

    conn.commit()
    conn.close()
    print("\n--- BARCHA AMALLAR BAJARILDI ---")


if __name__ == "__main__":
    apply_final_optimizations()
