import sys
import os
import io

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'morphocheck_backend'))

from services.research_docx import generate_researcher_docx

test_data = {
    "full_name": "Test Testov",
    "school_name": "School #1",
    "settlement": "Tashkent",
    "birth_place": "Tashkent",
    "birth_date": "2015-01-01",
    "father_nationality": "Uzbek",
    "mother_nationality": "Uzbek",
}

print("Testing RU generation...")
buf_ru = generate_researcher_docx(test_data, lang="ru")
with open("test_report_ru.docx", "wb") as f:
    f.write(buf_ru.read())
print("RU report saved.")

print("Testing UZ generation...")
buf_uz = generate_researcher_docx(test_data, lang="uz")
with open("test_report_uz.docx", "wb") as f:
    f.write(buf_uz.read())
print("UZ report saved.")

print("Verification complete. Check test_report_ru.docx and test_report_uz.docx")
