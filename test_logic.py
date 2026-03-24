
import sys
import os

# Backend yo'lini qo'shish
sys.path.append(os.path.abspath("morphocheck_backend"))

from services.indices_service import calculate_detailed_indices

# Case 1: 3 yoshli bola
res_3yo = calculate_detailed_indices(age=3, gender="o'g'il", height=95.0, weight=15.0, bmi=16.6)
print(f"3 yoshli bola (15kg) fm_norm: {res_3yo['fm_norm']}, fm_kg_norm: {res_3yo['fm_kg_norm']}")

# Case 2: 10 yoshli bola
res_10yo = calculate_detailed_indices(age=10, gender="o'g'il", height=138.0, weight=32.0, bmi=16.8)
print(f"10 yoshli bola (32kg) fm_norm: {res_10yo['fm_norm']}, fm_kg_norm: {res_10yo['fm_kg_norm']}")
