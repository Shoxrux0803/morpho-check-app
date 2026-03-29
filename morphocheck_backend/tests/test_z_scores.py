import sys
import os

# Добавляем путь к бэкенду
backend_path = os.path.join(os.getcwd(), "morphocheck_backend")
sys.path.append(backend_path)

from services.indices_service import calculate_detailed_indices

def test_clinical_logic():
    print("--- Запуск финальной верификации клинической логики ---")
    
    # 1. Тест для ребенка (5 лет, мальчик, нормальный вес)
    # Примерные данные: вес 18.5 кг, рост 110 см
    bmi1 = 18.5 / ((110/100)**2)
    res1 = calculate_detailed_indices(age=5, gender="erkak", height=110, weight=18.5, bmi=bmi1)
    
    print(f"Ребенок 5 лет: BMI={bmi1:.2f}, Z_BMI={res1['z_bmi']:.2f}, Type={res1['morphological_type']}")
    assert abs(res1['z_bmi']) < 1.0, f"Z-score ({res1['z_bmi']}) должен быть в пределах нормы"
    assert res1['morphological_type'] == "normostenik", "Должен быть нормостеник"
    
    # 2. Тест для взрослого (30 лет, мужчина, избыточный вес)
    bmi2 = 95 / ((180/100)**2)
    res2 = calculate_detailed_indices(age=30, gender="erkak", height=180, weight=95, bmi=bmi2)
    print(f"Взрослый 30 лет: BMI={bmi2:.2f}, Z_BMI={res2['z_bmi']:.2f}, Type={res2['morphological_type']}")
    assert res2['z_bmi'] > 1.5, f"Z-score ({res2['z_bmi']}) должен указывать на избыточный вес"
    assert res2['morphological_type'] == "giperstenik", "Должен быть гиперстеник"
    
    # 3. Астеник (Высокий и худой)
    bmi3 = 60 / ((190/100)**2)
    res3 = calculate_detailed_indices(age=25, gender="erkak", height=190, weight=60, bmi=bmi3)
    print(f"Астеник 25 лет: BMI={bmi3:.2f}, Z_BMI={res3['z_bmi']:.2f}, Type={res3['morphological_type']}")
    assert res3['morphological_type'] == "astenik", "Должен быть астеник"

    print("--- Верификация прошла успешно! ---")

if __name__ == "__main__":
    try:
        test_clinical_logic()
    except Exception as e:
        print(f"Ошибка при верификации: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
