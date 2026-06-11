import datetime
import os
from io import BytesIO

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing, Line
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from services.ky_localization import report_text
from utils.translit import lat2cyr

__all__ = ["generate_pdf_report"]

LOGO_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__), "..", "..", "src", "assets", "morphocheck-logo.png"
    )
)

# ---------------------------------------------------------------------------
# Til lug'atlari
# ---------------------------------------------------------------------------
PDF_LABELS = {
    "uz": {
        "title": "MORPHOCHECK PRO ANTROPOMETRIK TAHLIL HISOBOTI",
        "full_name": "Ism Familiya:",
        "age": "Yosh:",
        "gender": "Jins:",
        "birth_date": "Tug'ilgan sana:",
        "exam_date": "Tekshiruv sanasi:",
        "institution": "Muassasa:",
        "region": "Viloyat:",
        "district": "Tuman:",
        "mahalla": "Mahalla:",
        "address": "Manzil:",
        "id_code": "ID kod:",
        "parents_phone": "Ota-ona telefon raqami:",
        "male": "Erkak",
        "female": "Ayol",
        "results_section": "TAHLILNING ASOSIY NATIJALARI",
        "indicator": "Ko'rsatkich",
        "value": "Qiymat",
        "note": "Izoh",
        "bmi_label": "BMI (Vazn indeksi)",
        "somatotype": "Tana tuzilishi",
        "somatotype_note": "Somatotip",
        "ideal_weight": "Me'yoriy vazn",
        "ideal_weight_note": "Tavsiya etilgan oraliq",
        "weight_diff": "Vazn farqi",
        "weight_diff_note": "Idealdan og'ish",
        "hmai": "HMAI (Moslashuv)",
        "mii": "MII (Integratsiya)",
        "adi": "ADI (Nomutanosiblik)",
        "shoulder_ratio": "Yelka proporsiyasi",
        "shoulder_note": "Bo'yga nisbatan",
        "thigh_ratio": "Son proporsiyasi",
        "thigh_note": "Bo'yga nisbatan",
        "bmi_status": "BMI holati:",
        "recommendation": "Tavsiya:",
        "advice_section": "SHAXSIY TAVSIYALAR",
        "advice_for_parents": " (OTA-ONALAR UCHUN)",
        "no_advice": "• Maxsus tavsiyalar mavjud emas.",
        "report_date": "Hisobot sanasi:",
        "report_number": "Hisobot raqami:",
        "doctor_sign": "Shifokor imzosi",
        "patient_sign": "Bemor/Ota-ona imzosi",
        "confidential": "Ushbu hisobot maxfiy ma'lumot hisoblanadi",
        "bmi_underweight": "Vazn yetishmovchiligi",
        "bmi_normal": "Me'yor",
        "bmi_overweight": "Ortiqcha vazn",
        "bmi_obese": "Semizlik",
        "ai_title": "PROGNOSTIK TAHLIL VA XAVFLAR (AI YORDAMIDA)",
        "ai_adult_height": "18 yoshdagi taxminiy bo'y:",
        "ai_risk_type": "Xavf turi",
        "ai_probability": "Ehtimollik (%)",
        "risk_obesity": "Semizlik (Obesity)",
        "risk_metabolic": "Metabolik Sindrom",
        "risk_musculoskeletal": "Tayanch-harakat tizimi buzilishlari",
        "unit_year": "yosh",
        "unit_month": "oy",
        "unit_day": "kun",
        "ai_parent_tips_title": "MORPHOAI: OTA-ONALAR UCHUN QISQA MASLAHATLAR",
        "adv_sport": "Sportga yo'naltirish",
        "adv_specialist": "👨‍⚕️ Mutaxassis",
        "adv_nutrition": "🍎 Ovqatlanish",
        "adv_activity": "🏃 Faollik",
        "adv_checkups": "🏥 Tekshiruvlar",
        "adv_sport": "Sportga yo'naltirish",
        "adv_general": "📝 Umumiy tavsiya",
    },
    "ru": {
        "title": "MORPHOCHECK PRO ОТЧЁТ АНТРОПОМЕТРИЧЕСКОГО АНАЛИЗА",
        "full_name": "Имя Фамилия:",
        "age": "Возраст:",
        "gender": "Пол:",
        "birth_date": "Дата рождения:",
        "exam_date": "Дата обследования:",
        "institution": "Учреждение:",
        "region": "Область:",
        "district": "Район:",
        "mahalla": "Махалля:",
        "address": "Адрес:",
        "id_code": "ID код:",
        "parents_phone": "Телефон родителей:",
        "male": "Мужской",
        "female": "Женский",
        "results_section": "ОСНОВНЫЕ РЕЗУЛЬТАТЫ АНАЛИЗА",
        "indicator": "Показатель",
        "value": "Значение",
        "note": "Примечание",
        "bmi_label": "ИМТ (Индекс массы тела)",
        "somatotype": "Телосложение",
        "somatotype_note": "Соматотип",
        "ideal_weight": "Норма веса",
        "ideal_weight_note": "Рекомендуемый диапазон",
        "weight_diff": "Разница веса",
        "weight_diff_note": "Отклонение от идеала",
        "hmai": "HMAI (Адаптация)",
        "mii": "MII (Интеграция)",
        "adi": "ADI (Дисгармония)",
        "shoulder_ratio": "Пропорция плеч",
        "shoulder_note": "К росту",
        "thigh_ratio": "Пропорция бёдер",
        "thigh_note": "К росту",
        "bmi_status": "Статус ИМТ:",
        "recommendation": "Рекомендация:",
        "advice_section": "ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ",
        "advice_for_parents": " (ДЛЯ РОДИТЕЛЕЙ)",
        "no_advice": "• Специальных рекомендаций нет.",
        "report_date": "Дата отчёта:",
        "report_number": "Номер отчёта:",
        "doctor_sign": "Подпись врача",
        "patient_sign": "Подпись пациента/родителя",
        "confidential": "Данный отчёт является конфиденциальным",
        "bmi_underweight": "Дефицит массы тела",
        "bmi_normal": "Норма",
        "bmi_overweight": "Избыточный вес",
        "bmi_obese": "Ожирение",
        "ai_title": "ПРОГНОСТИЧЕСКИЙ АНАЛИЗ И РИСКИ (ИИ)",
        "ai_adult_height": "Предполагаемый рост в 18 лет:",
        "ai_risk_type": "Тип риска",
        "ai_probability": "Вероятность (%)",
        "risk_obesity": "Ожирение (Obesity)",
        "risk_metabolic": "Метаболический синдром",
        "risk_musculoskeletal": "Нарушения опорно-двигательного аппарата",
        "unit_year": "лет",
        "unit_month": "мес",
        "unit_day": "дн",
        "ai_parent_tips_title": "MORPHOAI: КРАТКИЕ СОВЕТЫ ДЛЯ РОДИТЕЛЕЙ",
        "adv_sport": "Спортивная ориентация",
        "adv_specialist": "Специалист",
        "adv_nutrition": "Питание",
        "adv_activity": "Активность",
        "adv_checkups": "Обследования",
        "adv_sport": "Спортивная ориентация",
        "adv_general": "Общая рекомендация",
        "detailed_advices_label": "ДОПОЛНИТЕЛЬНЫЕ УКАЗАНИЯ:",
    },
    "en": {
        "title": "MORPHOCHECK PRO ANTHROPOMETRIC ANALYSIS REPORT",
        "full_name": "Full Name:",
        "age": "Age:",
        "gender": "Gender:",
        "birth_date": "Birth Date:",
        "exam_date": "Examination Date:",
        "institution": "Institution:",
        "region": "Region:",
        "district": "District:",
        "mahalla": "Mahalla:",
        "address": "Address:",
        "id_code": "ID Code:",
        "parents_phone": "Parent phone:",
        "male": "Male",
        "female": "Female",
        "results_section": "MAIN ANALYSIS RESULTS",
        "indicator": "Indicator",
        "value": "Value",
        "note": "Note",
        "bmi_label": "BMI (Body Mass Index)",
        "somatotype": "Body Type",
        "somatotype_note": "Somatotype",
        "ideal_weight": "Ideal Weight",
        "ideal_weight_note": "Recommended range",
        "weight_diff": "Weight Difference",
        "weight_diff_note": "Deviation from ideal",
        "hmai": "HMAI (Adaptation)",
        "mii": "MII (Integration)",
        "adi": "ADI (Disharmony)",
        "shoulder_ratio": "Shoulder Proportion",
        "shoulder_note": "Relative to height",
        "thigh_ratio": "Thigh Proportion",
        "thigh_note": "Relative to height",
        "bmi_status": "BMI Status:",
        "recommendation": "Recommendation:",
        "advice_section": "PERSONAL RECOMMENDATIONS",
        "advice_for_parents": " (FOR PARENTS)",
        "no_advice": "• No special recommendations.",
        "report_date": "Report Date:",
        "report_number": "Report Number:",
        "doctor_sign": "Doctor's Signature",
        "patient_sign": "Patient/Parent Signature",
        "confidential": "This report is confidential",
        "bmi_underweight": "Underweight",
        "bmi_normal": "Normal",
        "bmi_overweight": "Overweight",
        "bmi_obese": "Obesity",
        "ai_title": "PROGNOSTIC ANALYSIS AND RISKS (AI)",
        "ai_adult_height": "Estimated height at age 18:",
        "ai_risk_type": "Risk Type",
        "ai_probability": "Probability (%)",
        "risk_obesity": "Obesity",
        "risk_metabolic": "Metabolic Syndrome",
        "risk_musculoskeletal": "Musculoskeletal disorders",
        "unit_year": "years",
        "unit_month": "months",
        "unit_day": "days",
        "ai_parent_tips_title": "MORPHOAI: SHORT TIPS FOR PARENTS",
        "adv_sport": "Sports orientation",
        "adv_specialist": "Specialist",
        "adv_nutrition": "Nutrition",
        "adv_activity": "Activity",
        "adv_checkups": "Checkups",
        "adv_sport": "Sports orientation",
        "adv_general": "General advice",
        "detailed_advices_label": "ADDITIONAL INSTRUCTIONS:",
    },
    "kz": {
        "title": "MORPHOCHECK PRO АНТРОПОМЕТРИЯЛЫҚ ТАЛДАУ ЕСЕБІ",
        "full_name": "Аты-жөні:",
        "age": "Жасы:",
        "gender": "Жынысы:",
        "birth_date": "Туған күні:",
        "exam_date": "Тексеру күні:",
        "institution": "Мекеме:",
        "region": "Аймақ:",
        "district": "Аудан:",
        "mahalla": "Махалля:",
        "address": "Мекенжай:",
        "id_code": "ID коды:",
        "male": "Ер",
        "female": "Әйел",
        "results_section": "ТАЛДАУДЫҢ НЕГІЗГІ НӘТИЖЕЛЕРІ",
        "indicator": "Көрсеткіш",
        "value": "Мән",
        "note": "Ескертпе",
        "bmi_label": "ДМИ (Дене массасы индексі)",
        "somatotype": "Дене түрі",
        "somatotype_note": "Соматотип",
        "ideal_weight": "Норма салмақ",
        "ideal_weight_note": "Ұсынылған диапазон",
        "weight_diff": "Салмақ айырмасы",
        "weight_diff_note": "Идеалдан ауытқу",
        "hmai": "HMAI (Бейімделу)",
        "mii": "MII (Интеграция)",
        "adi": "ADI (Дисгармония)",
        "shoulder_ratio": "Иық пропорциясы",
        "shoulder_note": "Бойға қатысты",
        "thigh_ratio": "Сан пропорциясы",
        "thigh_note": "Бойға қатысты",
        "bmi_status": "ДМИ күйі:",
        "recommendation": "Ұсыныс:",
        "advice_section": "ЖЕКЕ ҰСЫНЫСТАР",
        "advice_for_parents": " (АТА-АНАЛАР ҮШІН)",
        "no_advice": "• Арнайы ұсыныстар жоқ.",
        "report_date": "Есеп күні:",
        "report_number": "Есеп нөмірі:",
        "doctor_sign": "Дәрігер қолы",
        "patient_sign": "Пациент/Ата-ана қолы",
        "confidential": "Бұл есеп құпия ақпарат болып табылады",
        "bmi_underweight": "Салмақ жетіспеушілігі",
        "bmi_normal": "Норма",
        "bmi_overweight": "Артық салмақ",
        "bmi_obese": "Семіздік",
        "ai_title": "ПРОГНОСТИКАЛЫҚ ТАЛДАУ ЖӘНЕ ҚАУІПТЕР (AI)",
        "ai_adult_height": "18 жастағы болжамды бойы:",
        "ai_risk_type": "Қауіп түрі",
        "ai_probability": "Ықтималдық (%)",
        "risk_obesity": "Семіздік (Obesity)",
        "risk_metabolic": "Метаболикалық синдром",
        "risk_musculoskeletal": "Тірек-қимыл аппаратының бұзылуы",
        "unit_year": "жас",
        "unit_month": "ай",
        "unit_day": "күн",
        "ai_parent_tips_title": "MORPHOAI: АТА-АНАЛАРҒА АРНАЛҒАН ҚЫСҚА КЕҢЕСТЕР",
        "adv_sport": "Спортқа бағыттау",
        "adv_specialist": "Маман",
        "adv_nutrition": "Тамақтану",
        "adv_activity": "Белсенділік",
        "adv_checkups": "Тексерулер",
        "adv_sport": "Спортқа бағыттау",
        "adv_general": "📝 Жалпы ұсыныс",
        "detailed_advices_label": "ҚОСЫМША НҰСҚАУЛАР:",
    },
}


PDF_LABELS["ky"] = {
    **PDF_LABELS["uz"],
    "title": "MORPHOCHECK PRO АНТРОПОМЕТРИЯЛЫК ТАЛДОО ОТЧЕТУ",
    "full_name": "Аты-жөнү:",
    "age": "Жашы:",
    "gender": "Жынысы:",
    "birth_date": "Туулган күнү:",
    "exam_date": "Текшерүү күнү:",
    "institution": "Мекеме:",
    "region": "Облус:",
    "district": "Район:",
    "mahalla": "Махалла:",
    "address": "Дарек:",
    "id_code": "ID код:",
    "parents_phone": "Ата-эне телефону:",
    "male": "Эркек",
    "female": "Аял",
    "results_section": "ТАЛДООНУН НЕГИЗГИ ЖЫЙЫНТЫКТАРЫ",
    "indicator": "Көрсөткүч",
    "value": "Маани",
    "note": "Эскертүү",
    "bmi_label": "BMI (дене салмагынын индекси)",
    "somatotype": "Дене түзүлүшү",
    "somatotype_note": "Соматотип",
    "ideal_weight": "Нормалдуу салмак",
    "ideal_weight_note": "Сунушталган аралык",
    "weight_diff": "Салмак айырмасы",
    "weight_diff_note": "Идеалдан четтөө",
    "bmi_status": "BMI абалы:",
    "recommendation": "Сунуш:",
    "advice_section": "ЖЕКЕ СУНУШТАР",
    "advice_for_parents": " (АТА-ЭНЕЛЕР ҮЧҮН)",
    "no_advice": "• Атайын сунуштар жок.",
    "report_date": "Отчет күнү:",
    "report_number": "Отчет номери:",
    "doctor_sign": "Дарыгердин колу",
    "patient_sign": "Бейтап/ата-эне колу",
    "confidential": "Бул отчет купуя маалымат болуп саналат",
    "bmi_underweight": "Салмак жетишсиздиги",
    "bmi_normal": "Норма",
    "bmi_overweight": "Ашыкча салмак",
    "bmi_obese": "Семирүү",
    "ai_title": "ПРОГНОЗДУК ТАЛДОО ЖАНА КОРКУНУЧТАР (AI)",
    "ai_adult_height": "18 жаштагы болжолдуу бой:",
    "ai_risk_type": "Коркунуч түрү",
    "ai_probability": "Ыктымалдык (%)",
    "risk_obesity": "Семирүү (Obesity)",
    "risk_metabolic": "Метаболикалык синдром",
    "risk_musculoskeletal": "Таяныч-кыймыл аппаратынын бузулуштары",
    "unit_year": "жаш",
    "unit_month": "ай",
    "unit_day": "күн",
    "ai_parent_tips_title": "MORPHOAI: АТА-ЭНЕЛЕР ҮЧҮН КЫСКА КЕҢЕШТЕР",
    "adv_sport": "Спортко багыттоо",
    "adv_specialist": "Адис",
    "adv_nutrition": "Тамактануу",
    "adv_activity": "Активдүүлүк",
    "adv_checkups": "Текшерүүлөр",
    "adv_general": "Жалпы сунуш",
    "detailed_advices_label": "КОШУМЧА КӨРСӨТМӨЛӨР:",
    "hmai": "HMAI (ыңгайлашуу)",
    "mii": "MII (интеграция)",
    "adi": "ADI (дисгармония)",
    "shoulder_ratio": "Ийин пропорциясы",
    "shoulder_note": "Бойго салыштырмалуу",
    "thigh_ratio": "Сан пропорциясы",
    "thigh_note": "Бойго салыштырмалуу",
}


def setup_font():
    try:
        font_path = os.path.join(
            os.path.dirname(__file__), "..", "fonts", "DejaVuSans.ttf"
        )
        pdfmetrics.registerFont(TTFont("DejaVu", font_path))
        return "DejaVu"
    except Exception as e:
        print(f"Shrift ulashda xatolik: {e}")
        return "Helvetica"


def create_header():
    drawing = Drawing(400, 1)
    drawing.add(
        Line(0, 0, 400, 0, strokeColor=colors.HexColor("#3498db"), strokeWidth=2)
    )
    return drawing


def create_divider():
    drawing = Drawing(400, 1)
    drawing.add(
        Line(0, 0, 400, 0, strokeColor=colors.HexColor("#bdc3c7"), strokeWidth=1)
    )
    return drawing


def create_qr_drawing(value: str, size: int = 82):
    qr = QrCodeWidget(value)
    bounds = qr.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(qr)
    return drawing


def draw_watermark(canvas, doc):
    canvas.saveState()
    if os.path.exists(LOGO_PATH):
        canvas.setFillAlpha(0.045)
        page_width, page_height = A4
        img_width = 5.4 * inch
        img_height = 5.4 * inch
        x = (page_width - img_width) / 2
        y = (page_height - img_height) / 2 - 0.15 * inch
        canvas.drawImage(
            LOGO_PATH, x, y, width=img_width, height=img_height, mask="auto"
        )
    canvas.restoreState()


PDF_LABELS["tg"] = {
    **PDF_LABELS["uz"],
    "title": "MORPHOCHECK PRO ҲИСОБОТИ ТАҲЛИЛИ АНТРОПОМЕТРӢ",
    "full_name": "Ному насаб:",
    "age": "Синну сол:",
    "gender": "Ҷинс:",
    "birth_date": "Санаи таваллуд:",
    "exam_date": "Санаи муоина:",
    "institution": "Муассиса:",
    "region": "Вилоят:",
    "district": "Ноҳия:",
    "mahalla": "Маҳалла:",
    "address": "Суроға:",
    "id_code": "ID код:",
    "parents_phone": "Телефони волидон:",
    "male": "Мард",
    "female": "Зан",
    "results_section": "НАТИҶАҲОИ АСОСИИ ТАҲЛИЛ",
    "indicator": "Нишондиҳанда",
    "value": "Қимат",
    "note": "Эзоҳ",
    "bmi_label": "BMI (индекси массаи бадан)",
    "somatotype": "Сохтори бадан",
    "somatotype_note": "Соматотип",
    "ideal_weight": "Вазни меъёрӣ",
    "ideal_weight_note": "Диапазони тавсияшуда",
    "weight_diff": "Фарқи вазн",
    "weight_diff_note": "Дуршавӣ аз меъёр",
    "hmai": "HMAI (мутобиқшавӣ)",
    "mii": "MII (интегратсия)",
    "adi": "ADI (номувофиқатӣ)",
    "shoulder_ratio": "Мутаносибии китф",
    "shoulder_note": "Нисбат ба қад",
    "thigh_ratio": "Мутаносибии рон",
    "thigh_note": "Нисбат ба қад",
    "bmi_status": "Ҳолати BMI:",
    "recommendation": "Тавсия:",
    "advice_section": "ТАВСИЯҲОИ ШАХСӢ",
    "advice_for_parents": " (БАРОИ ВОЛИДОН)",
    "no_advice": "• Тавсияи махсус мавҷуд нест.",
    "report_date": "Санаи ҳисобот:",
    "report_number": "Рақами ҳисобот:",
    "doctor_sign": "Имзои духтур",
    "patient_sign": "Имзои бемор/волид",
    "confidential": "Ин ҳисобот маълумоти махфӣ мебошад",
    "bmi_underweight": "Камвазнӣ",
    "bmi_normal": "Меъёр",
    "bmi_overweight": "Вазни зиёдатӣ",
    "bmi_obese": "Фарбеҳӣ",
    "ai_title": "ТАҲЛИЛИ ПЕШГӮӢ ВА ХАВФҲО (AI)",
    "ai_adult_height": "Қади тахминӣ дар 18-солагӣ:",
    "ai_risk_type": "Навъи хавф",
    "ai_probability": "Эҳтимолият (%)",
    "risk_obesity": "Фарбеҳӣ",
    "risk_metabolic": "Синдроми метаболикӣ",
    "risk_musculoskeletal": "Ихтилоли такягоҳу ҳаракат",
    "unit_year": "сол",
    "unit_month": "моҳ",
    "unit_day": "рӯз",
    "ai_parent_tips_title": "MORPHOAI: МАСЛИҲАТҲОИ КӮТОҲ БАРОИ ВОЛИДОН",
    "adv_sport": "Роҳнамоӣ ба варзиш",
    "adv_specialist": "Мутахассис",
    "adv_nutrition": "Ғизо",
    "adv_activity": "Фаъолият",
    "adv_checkups": "Муоинаҳо",
    "adv_general": "Тавсияи умумӣ",
    "detailed_advices_label": "ДАСТУРҲОИ ИЛОВАГӢ:",
}


PDF_LABELS["tm"] = {
    **PDF_LABELS["uz"],
    "title": "MORPHOCHECK PRO ANTROPOMETRIK ANALIZ HASABATY",
    "full_name": "Ady familiyasy:",
    "age": "Yasy:",
    "gender": "Jynsy:",
    "birth_date": "Doglan senesi:",
    "exam_date": "Barlag senesi:",
    "institution": "Edara:",
    "region": "Welayat:",
    "district": "Etrap:",
    "mahalla": "Mahalla:",
    "address": "Salgy:",
    "parents_phone": "Ene-ata telefony:",
    "male": "Erkek",
    "female": "Ayal",
    "results_section": "ANALIZIN ESASY NETIJELERI",
    "indicator": "Gorkeziji",
    "value": "Bahasy",
    "note": "Bellik",
    "bmi_label": "BMI (beden massa indeksi)",
    "somatotype": "Beden gurlusy",
    "ideal_weight": "Kadaly agram",
    "weight_diff": "Agram tapawudy",
    "bmi_status": "BMI yagdayy:",
    "recommendation": "Maslahat:",
    "advice_section": "SAHSY MASLAHATLAR",
    "advice_for_parents": " (ENE-ATALAR UCIN)",
    "no_advice": "Maxsus maslahatlar yok.",
    "report_date": "Hasabat senesi:",
    "report_number": "Hasabat belgisi:",
    "doctor_sign": "Lukmanyn goly",
    "patient_sign": "Hasta/Ene-ata goly",
    "confidential": "Bu hasabat gizlin maglumat hasaplanýar",
    "bmi_underweight": "Agram yetmezciligi",
    "bmi_normal": "Kada",
    "bmi_overweight": "Artyk agram",
    "bmi_obese": "Semizlik",
    "ai_title": "PROGNOSTIK ANALIZ WE HOWPLAR (AI)",
    "ai_adult_height": "18 yasdaky cak edilen boy:",
    "ai_risk_type": "Howp gornusi",
    "ai_probability": "Ahtimallyk (%)",
    "risk_obesity": "Semizlik",
    "risk_metabolic": "Metabolik sindrom",
    "risk_musculoskeletal": "Dayanc-hereket ulgamynyn bozulmalary",
    "unit_year": "yas",
    "unit_month": "ay",
    "unit_day": "gun",
    "ai_parent_tips_title": "MORPHOAI: ENE-ATALAR UCIN GYSGA MASLAHATLAR",
    "adv_sport": "Sport ugrukdyrmasy",
    "adv_specialist": "Hunarment",
    "adv_nutrition": "Iymitlenme",
    "adv_activity": "Isjenlik",
    "adv_checkups": "Barlaglar",
    "adv_general": "Umumy maslahat",
    "detailed_advices_label": "GOSMACA GORKEMELER:",
    "doctor_note": "Lukman belligi:",
    "qr_title": "QR kod",
    "qr_hint": "Yazgyny acmak ucin skan ediň",
}


def generate_pdf_file(data: dict, lang: str = "uz"):
    # Til lug'atini olish (topilmasa UZ)
    L = PDF_LABELS.get(lang, PDF_LABELS["uz"])
    fallback_extra = {
        "uz": {
            "doctor_note": "Shifokor izohi:",
            "qr_title": "Rekordni tekshirish yoki qayta ochish",
            "qr_hint": "QR kodni skanerlang",
        },
        "ru": {
            "doctor_note": "Заметка врача:",
            "qr_title": "Проверка или повторное открытие записи",
            "qr_hint": "Отсканируйте QR-код",
        },
        "en": {
            "doctor_note": "Doctor note:",
            "qr_title": "Verify or reopen this record",
            "qr_hint": "Scan the QR code",
        },
        "ky": {
            "doctor_note": "Дарыгер эскертүүсү:",
            "qr_title": "Жазууну текшерүү же кайра ачуу",
            "qr_hint": "QR кодду сканерлеңиз",
        },
        "kz": {
            "doctor_note": "Дәрігер жазбасы:",
            "qr_title": "Жазбаны тексеру немесе қайта ашу",
            "qr_hint": "QR кодты сканерлеңіз",
        },
        "tg": {
            "doctor_note": "Эзоҳи духтур:",
            "qr_title": "Санҷиш ё бозкушоии сабт",
            "qr_hint": "QR кодро скан кунед",
        },
    }
    L = {**L, **fallback_extra.get(lang, fallback_extra["uz"])}

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    font_name = setup_font()

    styles["Normal"].fontName = font_name
    styles["Heading2"].fontName = font_name

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=16,
        alignment=1,
        spaceAfter=14,
        fontName=font_name,
        textColor=colors.HexColor("#2c3e50"),
        borderPadding=10,
    )

    brand_style = ParagraphStyle(
        "BrandTitle",
        parent=styles["Normal"],
        fontSize=18,
        leading=20,
        fontName=font_name,
        textColor=colors.HexColor("#0f4f7f"),
        spaceAfter=0,
    )

    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        fontName=font_name,
        textColor=colors.HexColor("#34495e"),
        backColor=colors.HexColor("#ecf0f1"),
        borderPadding=5,
        leftIndent=10,
    )

    highlight_style = ParagraphStyle(
        "Highlight",
        parent=styles["Normal"],
        fontSize=10,
        fontName=font_name,
        textColor=colors.HexColor("#7f8c8d"),
        alignment=0,
    )

    elements = []

    if os.path.exists(LOGO_PATH):
        logo_image = Image(LOGO_PATH, width=0.72 * inch, height=0.72 * inch)
        brand_table = Table(
            [
                [
                    logo_image,
                    Paragraph(
                        "<b>MorphoCheck Pro</b><br/><font size='9' color='#64748b'>Clinical anthropometric analysis</font>",
                        brand_style,
                    ),
                ]
            ],
            colWidths=[0.9 * inch, 5.2 * inch],
        )
        brand_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(brand_table)

    # Sarlavha
    elements.append(Paragraph(L["title"], title_style))
    elements.append(create_header())
    elements.append(Spacer(1, 15))

    # Ma'lumotlarni olish (snake_case va camelCase variantlarini tekshiramiz)
    def gv(key_snake, key_camel, default=None):
        if isinstance(data, dict):
            return data.get(key_snake, data.get(key_camel, default))
        return getattr(data, key_snake, getattr(data, key_camel, default))

    first_name = gv("first_name", "firstName", "")
    last_name = gv("last_name", "lastName", "")
    age_y = gv("age", "age", 0)
    age_m = gv("age_months", "ageMonths", 0)
    age_d = gv("age_days", "ageDays", 0)

    # Ensure integers
    try:
        age_y = int(age_y or 0)
    except (TypeError, ValueError):
        age_y = 0
    try:
        age_m = int(age_m or 0)
    except (TypeError, ValueError):
        age_m = 0
    try:
        age_d = int(age_d or 0)
    except (TypeError, ValueError):
        age_d = 0

    gender = gv("gender", "gender", "")
    birth_date = gv("birth_date", "birthDate", "")
    examination_date = gv("examination_date", "examinationDate", "")
    preschool_institution = gv("preschool_institution", "preschoolInstitution", "")
    region = gv("region", "region", "")
    district = gv("district", "district", "")
    mahalla = gv("mahalla", "mahalla", "")
    address = gv("address", "address", "")
    id_code_val = gv("id_code", "idCode", "")
    parents_phone = gv("parents_phone", "parentsPhone", "")
    doctor_note = gv("doctor_note", "doctorNote", "")
    record_url = gv("record_url", "recordUrl", "")

    # Sana formatini o'zgartirish (YYYY-MM-DD -> DD.MM.YYYY)
    def format_date_str(d_str):
        if not d_str or not isinstance(d_str, str):
            return d_str
        try:
            # Agar format YYYY-MM-DD bo'lsa
            if len(d_str) == 10 and d_str[4] == "-" and d_str[7] == "-":
                parts = d_str.split("-")
                return f"{parts[2]}.{parts[1]}.{parts[0]}"
        except (IndexError, TypeError, ValueError):
            return d_str
        return d_str

    birth_date = format_date_str(birth_date)
    examination_date = format_date_str(examination_date)

    def localize_value(value, transliterate=False):
        text = report_text(value or "-", lang)
        if lang == "ru" and transliterate and text not in ("-", ""):
            text = lat2cyr(text)
        return text

    # Yoshni formatlash: 5 yosh, 8 oy, 19 kun
    age_str = f"{age_y} {L.get('unit_year', 'yosh')}"
    if age_m:
        age_str += f", {age_m} {L.get('unit_month', 'oy')}"
    if age_d:
        age_str += f", {age_d} {L.get('unit_day', 'kun')}"

    gender_lower = (gender or "").lower()
    gender_text = (
        L["male"]
        if (
            "erkak" in gender_lower
            or "o'g'il" in gender_lower
            or "male" in gender_lower
        )
        else L["female"]
    )

    personal_info_data = [
        [L["full_name"], f"{first_name} {last_name}"],
        [L["age"], age_str],
        [L["gender"], gender_text],
        [L["birth_date"], birth_date or "-"],
        [L["exam_date"], examination_date or "-"],
        [L["institution"], localize_value(preschool_institution, transliterate=True)],
        [L["region"], localize_value(region, transliterate=True)],
        [L["district"], localize_value(district, transliterate=True)],
        [L["mahalla"], localize_value(mahalla, transliterate=True)],
        [L["address"], localize_value(address, transliterate=True)],
        [L.get("parents_phone", "Parents' phone:"), parents_phone or "-"],
        [L["id_code"], id_code_val or "-"],
    ]

    personal_table = Table(personal_info_data, colWidths=[2.5 * inch, 3.5 * inch])
    personal_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e9ecef")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(personal_table)
    elements.append(Spacer(1, 20))

    if doctor_note:
        note_table = Table(
            [
                [
                    Paragraph(f"<b>{L['doctor_note']}</b>", styles["Normal"]),
                    Paragraph(str(doctor_note), styles["Normal"]),
                ]
            ],
            colWidths=[1.6 * inch, 4.4 * inch],
        )
        note_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fed7aa")),
                    ("PADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        elements.append(note_table)
        elements.append(Spacer(1, 16))

    # Tahlil natijalari
    elements.append(Paragraph(L["results_section"], section_title_style))

    analysis_data_dict = (
        data.get("analysis", {})
        if isinstance(data, dict)
        else getattr(data, "analysis", {})
    )

    analysis_table_data = [
        [L["indicator"], L["value"], L["note"]],
        [
            L["bmi_label"],
            f"{analysis_data_dict.get('bmi', 0):.1f}",
            report_text(analysis_data_dict.get("bmi_category", ""), lang),
        ],
        [
            L["somatotype"],
            report_text(analysis_data_dict.get("somatotype", ""), lang),
            L["somatotype_note"],
        ],
        [
            L["ideal_weight"],
            f"{analysis_data_dict.get('ideal_weight_range', {}).get('min', 0)} - {analysis_data_dict.get('ideal_weight_range', {}).get('max', 0)} kg",
            L["ideal_weight_note"],
        ],
        [
            L["weight_diff"],
            f"{analysis_data_dict.get('weight_diff', 0):.1f} kg",
            L["weight_diff_note"],
        ],
    ]

    shoulder_length_val = (
        data.get("shoulder_length", 0)
        if isinstance(data, dict)
        else getattr(data, "shoulder_length", 0)
    )
    try:
        is_deep_analysis = float(shoulder_length_val) > 0
    except (TypeError, ValueError):
        is_deep_analysis = False

    detailed = analysis_data_dict.get("indices", {})
    if detailed and is_deep_analysis:
        analysis_table_data.append(
            [
                L["hmai"],
                f"{detailed.get('hmai', '')}",
                report_text(detailed.get("hmai_desc", ""), lang),
            ]
        )
        analysis_table_data.append(
            [
                L["mii"],
                f"{detailed.get('mii', '')}",
                report_text(detailed.get("mii_desc", ""), lang),
            ]
        )
        analysis_table_data.append(
            [
                L["adi"],
                f"{detailed.get('adi', '')}",
                report_text(detailed.get("adi_desc", ""), lang),
            ]
        )

    if is_deep_analysis:
        shoulder_ratio = analysis_data_dict.get("shoulder_ratio", 0)
        if shoulder_ratio:
            analysis_table_data.append(
                [L["shoulder_ratio"], f"{shoulder_ratio}%", L["shoulder_note"]]
            )

        thigh_ratio = analysis_data_dict.get("thigh_ratio", 0)
        if thigh_ratio:
            analysis_table_data.append(
                [L["thigh_ratio"], f"{thigh_ratio}%", L["thigh_note"]]
            )

    col_widths = [2.0 * inch, 1.3 * inch, 3.1 * inch]

    formatted_analysis_data = []
    for row in analysis_table_data:
        formatted_analysis_data.append(
            [
                Paragraph(str(row[0]), styles["Normal"]),
                Paragraph(str(row[1]), styles["Normal"]),
                Paragraph(str(row[2]), styles["Normal"]),
            ]
        )

    t_analysis = Table(formatted_analysis_data, colWidths=col_widths)
    t_analysis.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3498db")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, 0), font_name),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("FONTNAME", (0, 1), (-1, -1), font_name),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#dee2e6")),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(t_analysis)
    elements.append(Spacer(1, 25))

    # BMI holati
    bmi_value = analysis_data_dict.get("bmi", 0)
    if bmi_value < 18.5:
        bmi_status = L["bmi_underweight"]
        bmi_color = "#3498db"
    elif bmi_value < 25:
        bmi_status = L["bmi_normal"]
        bmi_color = "#2ecc71"
    elif bmi_value < 30:
        bmi_status = L["bmi_overweight"]
        bmi_color = "#f39c12"
    else:
        bmi_status = L["bmi_obese"]
        bmi_color = "#e74c3c"

    # BMI kategoriyasi tilga moslab
    bmi_val_raw = analysis_data_dict.get("bmi", 0)
    if bmi_val_raw is None:
        bmi_val_raw = 0
    bmi_cat_float = float(bmi_val_raw)
    if bmi_cat_float < 18.5:
        bmi_cat_text = L["bmi_underweight"]
    elif bmi_cat_float < 25:
        bmi_cat_text = L["bmi_normal"]
    elif bmi_cat_float < 30:
        bmi_cat_text = L["bmi_overweight"]
    else:
        bmi_cat_text = L["bmi_obese"]

    bmi_info = [
        [L["bmi_status"], bmi_status],
        [L["recommendation"], bmi_cat_text],
    ]

    bmi_table = Table(bmi_info, colWidths=[2 * inch, 4 * inch])
    bmi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bmi_color)),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("BORDER", (0, 0), (-1, -1), 1, colors.white),
            ]
        )
    )
    elements.append(bmi_table)
    elements.append(Spacer(1, 20))

    # AI Bashoratlari bo'limi
    ai_preds = (
        data.get("ai_predictions", {})
        if isinstance(data, dict)
        else getattr(data, "ai_predictions", {})
    )
    if ai_preds:
        elements.append(
            Paragraph(
                L.get("ai_title", "PROGNOSTIK TAHLIL VA XAVFLAR (AI YORDAMIDA)"),
                section_title_style,
            )
        )

        # 1. 18 Yoshdagi Taxminiy Bo'y (faqat 18 yoshdan kichiklar uchun)
        try:
            current_age = int(float(age_y))
        except (TypeError, ValueError):
            current_age = 0

        if current_age < 18:
            adult_height = ai_preds.get("adult_height_prediction", 0)
            adult_height_label = L.get("ai_adult_height", "18 yoshdagi taxminiy bo'y:")
            ai_height_info = [
                [
                    Paragraph(f"<b>{adult_height_label}</b>", styles["Normal"]),
                    Paragraph(f"<b>{adult_height} sm</b>", styles["Normal"]),
                ]
            ]

            t_ai_height = Table(ai_height_info, colWidths=[3.5 * inch, 2.5 * inch])
            t_ai_height.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (-1, -1), font_name),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4ecf7")),
                        ("PADDING", (0, 0), (-1, -1), 8),
                        ("BORDER", (0, 0), (-1, -1), 1, colors.HexColor("#d2b4de")),
                    ]
                )
            )
            elements.append(t_ai_height)
            elements.append(Spacer(1, 10))

        # 2. Xavflar
        risks = ai_preds.get("risks", {})
        ai_risks_data = [
            [
                Paragraph(
                    f"<b>{L.get('ai_risk_type', 'Xavf turi')}</b>", styles["Normal"]
                ),
                Paragraph(
                    f"<b>{L.get('ai_probability', 'Ehtimollik (%)')}</b>",
                    styles["Normal"],
                ),
            ]
        ]

        risk_labels = [
            (L.get("risk_obesity", "Semizlik (Obesity)"), risks.get("obesity_risk", 0)),
            (
                L.get("risk_metabolic", "Metabolik Sindrom"),
                risks.get("metabolic_syndrome_risk", 0),
            ),
            (
                L.get("risk_musculoskeletal", "Tayanch-harakat tizimi buzilishlari"),
                risks.get("musculoskeletal_risk", 0),
            ),
        ]

        for label, val in risk_labels:
            color = "#e74c3c" if val > 50 else ("#f39c12" if val > 25 else "#2ecc71")
            val_para = Paragraph(
                f"<font color='{color}'><b>{val}%</b></font>", styles["Normal"]
            )
            ai_risks_data.append([Paragraph(label, styles["Normal"]), val_para])

        t_ai_risks = Table(ai_risks_data, colWidths=[4.2 * inch, 1.8 * inch])
        t_ai_risks.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#ecf0f1")),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fdfefe")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(t_ai_risks)
        elements.append(Spacer(1, 20))

    # AI Parent Tips (NEW)
    ai_tips = (
        data.get("ai_parent_tips", [])
        if isinstance(data, dict)
        else getattr(data, "ai_parent_tips", [])
    )
    if ai_tips:
        elements.append(
            Paragraph(
                L.get(
                    "ai_parent_tips_title",
                    "MORPHOAI: OTA-ONALAR UCHUN QISQA MASLAHATLAR",
                ),
                section_title_style,
            )
        )

        import html

        tips_data = []
        for tip in ai_tips:
            # Escape HTML characters to prevent ReportLab Paragraph errors
            safe_tip = html.escape(report_text(tip, lang))
            tips_data.append([Paragraph(f"• {safe_tip}", styles["Normal"])])

        t_tips = Table(tips_data, colWidths=[6.0 * inch])
        t_tips.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e8f8f5")),
                    ("PADDING", (0, 0), (-1, -1), 8),
                    ("BORDER", (0, 0), (-1, -1), 1, colors.HexColor("#a3e4d7")),
                ]
            )
        )
        elements.append(t_tips)
        elements.append(Spacer(1, 20))

    # Tavsiyalar bo'limi
    age_y_val = 0
    try:
        age_y_val = int(float(age_y)) if age_y else 0
    except (TypeError, ValueError):
        pass

    section_title = L["advice_section"]
    if age_y_val < 21:
        section_title += L["advice_for_parents"]

    elements.append(Paragraph(section_title, section_title_style))

    # 1. Structured Advices (Specialist, Nutrition, Activity, Checkups)
    advices_dict = (
        data.get("advices", {})
        if isinstance(data, dict)
        else getattr(data, "advices", {})
    )
    if advices_dict:
        advice_categories = [
            ("sport", L.get("adv_sport", "Sports orientation")),
            ("specialist", L.get("adv_specialist", "Specialist")),
            ("nutrition", L.get("adv_nutrition", "Nutrition")),
            ("activity", L.get("adv_activity", "Activity")),
            ("checkups", L.get("adv_checkups", "Checkups")),
        ]

        cat_elements = []
        for key, title in advice_categories:
            val = advices_dict.get(key)
            if val and val != "—":
                cat_elements.append(
                    [
                        Paragraph(f"<b>{title}:</b>", styles["Normal"]),
                        Paragraph(report_text(val, lang), styles["Normal"]),
                    ]
                )

        if cat_elements:
            cat_table = Table(cat_elements, colWidths=[1.8 * inch, 4.2 * inch])
            cat_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (-1, -1), font_name),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d5dbdb")),
                        ("PADDING", (0, 0), (-1, -1), 6),
                        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f4f6f7")),
                    ]
                )
            )
            elements.append(cat_table)
            elements.append(Spacer(1, 15))

    # 2. Detailed advice list (from Bioimpedance/Indices)
    detailed = analysis_data_dict.get("indices", {})
    advice_list = detailed.get("advice", [])

    if advice_list:
        elements.append(
            Paragraph(
                L.get("detailed_advices_label", "QO'SHIMCHA KO'RSATMALAR:"),
                styles["Normal"],
            )
        )
        elements.append(Spacer(1, 5))

        advice_elements = []
        for item in advice_list:
            # Avoid showing items already present in categorized advice
            item_clean = str(item).strip()
            already_shown = False
            for v in advices_dict.values():
                if item_clean in str(v):
                    already_shown = True
                    break

            if not already_shown:
                p = Paragraph(report_text(item, lang), styles["Normal"])
                bullet_p = Paragraph("•", styles["Normal"])
                advice_elements.append([bullet_p, p])

        if advice_elements:
            advice_table = Table(advice_elements, colWidths=[0.2 * inch, 5.8 * inch])
            advice_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (-1, -1), font_name),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("PADDING", (0, 0), (-1, -1), 4),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            elements.append(advice_table)
    else:
        elements.append(Paragraph(L["no_advice"], styles["Normal"]))
    elements.append(Spacer(1, 30))

    # Yakuniy qism
    elements.append(create_divider())
    elements.append(Spacer(1, 20))

    footer_data = [
        [L["report_date"], datetime.datetime.now().strftime("%Y-%m-%d %H:%M")],
        [L["report_number"], f"MCP-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"],
    ]

    footer_table = Table(footer_data, colWidths=[2 * inch, 4 * inch])
    footer_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(footer_table)
    if record_url or id_code_val:
        qr_value = record_url or f"MorphoCheck record: {id_code_val}"
        qr_table = Table(
            [
                [
                    create_qr_drawing(qr_value),
                    Paragraph(
                        f"<b>{L['qr_title']}</b><br/>{L['qr_hint']}<br/><font size='8'>{qr_value}</font>",
                        styles["Normal"],
                    ),
                ]
            ],
            colWidths=[1.2 * inch, 4.8 * inch],
        )
        qr_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbeafe")),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
                    ("PADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(Spacer(1, 10))
        elements.append(qr_table)
    elements.append(Spacer(1, 25))

    # Imzo qismi
    signature_table_data = [
        ["", ""],
        ["_________________________", "_________________________"],
        [L["doctor_sign"], L["patient_sign"]],
    ]

    signature_table = Table(signature_table_data, colWidths=[2.5 * inch, 2.5 * inch])
    signature_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(signature_table)

    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"<i>{L['confidential']}</i>", highlight_style))

    doc.build(elements, onFirstPage=draw_watermark, onLaterPages=draw_watermark)
    buffer.seek(0)
    return buffer


def generate_pdf_report(data: dict, lang: str = "uz"):
    """PDF hisobotini yaratish"""
    return generate_pdf_file(data, lang=lang)
