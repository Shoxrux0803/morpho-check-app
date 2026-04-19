import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

from services.research_docx import _translate_uz_to_ru

test_cases = [
    ("O'zbek", "Узбек"),
    ("uzbek", "узбек"),
    ("Tabiiy emizish", "Естественное вскармливание"),
    ("Yaqin qarindosh", "Близкородственный"),
    ("Toshkent viloyati", "Ташкент область"),
    ("Samarqand shahri", "Самарканд город"),
    ("Ha", "Да"),
    ("Yo'q", "Нет"),
    ("Sog'lom", "Здоров(а)"),
    ("Anemiya va gripp", "Анемия и грипп"),
    ("Maktabda o'qiydi", "Школада o'qiydi"), # 'da' is suffix, but 'Maktab' should translate
    ("O‘zbekiston", "O‘zbekiston"), # Not in dictionary, but apostrophe normalized?
    ("Sog’lom", "Здоров(а)"), # Different apostrophe
    ("Qashqadaryo viloyati", "Кашкадарья область"),
]

# Set stdout to use utf-8
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("Starting enhanced translation tests...")
for input_str, expected in test_cases:
    result = _translate_uz_to_ru(input_str)
    # Check if expected is in result (for multi-word partial tests)
    status = "PASS" if result == expected else f"FAIL (Got: {result}, Expected: {expected})"
    print(f"'{input_str}' -> '{result}' | {status}")

# Case with multi-word phrase inside longer text
text = "Bolam tabiiy emizishda edi"
translated = _translate_uz_to_ru(text)
print(f"\nLong text test:\n'{text}' -> '{translated}'")
