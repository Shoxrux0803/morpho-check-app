import os
import sys

# Backend yo'lini qo'shish
sys.path.append(os.path.abspath('morphocheck_backend'))

from morphocheck_backend.services.pdf_services import generate_pdf_file

mock_data = {
    'first_name': 'Test',
    'last_name': 'User',
    'age': '10',
    'age_months': 5,
    'age_days': 12,
    'gender': 'Erkak',
    'birth_date': '2014-01-01',
    'examination_date': '2024-03-22',
    'preschool_institution': 'Test Bogcha',
    'region': 'Toshkent',
    'district': 'Yunusobod',
    'address': 'Test ko\'chasi 1',
    'analysis': {
        'bmi': 18.5,
        'bmi_category': 'Normal',
        'somatotype': 'Mezomorf',
        'ideal_weight_range': {'min': 30, 'max': 45},
        'weight_diff': 0.0,
        'shoulder_ratio': 45.0,
        'thigh_ratio': 55.0
    },
    'advices': {
        'specialist': 'Sog\'lom hayot maslahatlari',
        'nutrition': 'Muntazam ovqatlanish',
        'activity': 'Ertalabki badantarbiya',
        'checkups': 'Yillik ko\'rik'
    }
}

try:
    buffer = generate_pdf_file(mock_data)
    with open('test_report_with_watermark.pdf', 'wb') as f:
        f.write(buffer.getvalue())
    print("PDF muvaffaqiyatli yaratildi: test_report_with_watermark.pdf")
except Exception as e:
    import traceback
    print(f"Xatolik: {e}")
    traceback.print_exc()
