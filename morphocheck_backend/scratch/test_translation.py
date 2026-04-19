import sys
import os

# Add morphocheck_backend to sys.path
sys.path.append(os.path.join(os.getcwd(), "morphocheck_backend"))

from services.research_docx import _translate_uz_to_ru

test_cases = [
    ("O'zbek", "Узбек"),
    ("Tabiiy", "Естественное"),
    ("Yaqin qarindosh", "Близкородственный"),
    ("Toshkent viloyati", "Ташкент область"),
    ("Samarqand shahri", "Самарканд город"),
    ("Ha", "Да"),
    ("Sog'lom", "Здоров(а)"),
    ("Noma'lum", "Noma'lum"), # Not in map
    ("rus", "русский"),
]

print("Starting translation tests...")
for input_str, expected in test_cases:
    result = _translate_uz_to_ru(input_str)
    status = "PASS" if result == expected else f"FAIL (Got: {result}, Expected: {expected})"
    print(f"'{input_str}' -> '{result}' | {status}")
