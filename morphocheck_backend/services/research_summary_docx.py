import io
import math
from collections import Counter, defaultdict
from datetime import datetime

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

METRICS = [
    ("chest_standing_height", "Bo'y (tik)", "sm"),
    ("weight", "Vazn", "kg"),
    ("bmi", "BMI", "kg/m2"),
    ("chest_circumference_pause", "Ko'krak aylanasi", "sm"),
    ("waist_circumference", "Bel aylanasi", "sm"),
    ("head_circumference", "Bosh aylanasi", "sm"),
    ("thigh_circumference", "Son aylanasi", "sm"),
    ("calf_circumference", "Boldir aylanasi", "sm"),
    ("dynamometry", "Dinamometriya", "kg"),
]

ANALYSIS_METRICS = METRICS[:6]

SUMMARY_I18N = {
    "uz": {
        "title": "MORPHOCHECK ILMIY-STATISTIK DOCX HISOBOTI",
        "report_date": "Hisobot sanasi",
        "summary": "1. Umumiy svodka",
        "scope": "Qamrov",
        "all_researchers": "Barcha izlanuvchilar ma'lumotlari",
        "researcher_scope": "Izlanuvchiga tegishli ma'lumotlar",
        "researcher": "Izlanuvchi",
        "total_records": "Jami yozuvlar",
        "age_range": "Yosh oralig'i",
        "avg_age": "O'rtacha yosh",
        "active_filters": "Faol filtrlar",
        "none": "Yo'q",
        "indicator": "Ko'rsatkich",
        "value": "Qiymat",
        "demographics": "2. Demografik infografikalar",
        "gender": "Jins",
        "region": "Hudud",
        "visual_share": "Vizual ulush",
        "stats": "3. Avtomatik statistik tahlil jadvallari",
        "z_group": "BMI Z-score guruhi",
        "groups": "4. Guruhlar kesimidagi tahlil",
        "male_n": "Erkak N",
        "male_mean": "Erkak mean",
        "female_n": "Ayol N",
        "female_mean": "Ayol mean",
        "diff": "Farq",
        "share": "Ulush",
        "correlation": "5. Korrelyatsiya va regressiya",
        "model": "Model",
        "not_enough": "Ma'lumot yetarli emas",
        "equation": "Vazn = {intercept} + {slope} x Bo'y",
        "note_title": "6. Ilmiy izoh",
        "note": "Hisobot avtomatik shakllantirildi. Jadvallarda tavsifiy statistika, jinslar bo'yicha t-test, hududlar bo'yicha ANOVA, korrelyatsiya matritsasi va bo'y-vazn regressiya modeli keltirilgan.",
        "years": "yil",
    },
    "tg": {
        "title": "MORPHOCHECK ҲИСОБОТИ ИЛМӢ-ОМОРИИ DOCX",
        "report_date": "Санаи ҳисобот",
        "summary": "1. Хулосаи умумӣ",
        "scope": "Фарогирӣ",
        "all_researchers": "Маълумоти ҳамаи таҳқиқотчиён",
        "researcher_scope": "Маълумоти марбут ба таҳқиқотчӣ",
        "researcher": "Таҳқиқотчӣ",
        "total_records": "Ҳамаи сабтҳо",
        "age_range": "Диапазони синну сол",
        "avg_age": "Синну соли миёна",
        "active_filters": "Филтрҳои фаъол",
        "none": "Нест",
        "indicator": "Нишондиҳанда",
        "value": "Қимат",
        "demographics": "2. Инфографикаи демографӣ",
        "gender": "Ҷинс",
        "region": "Ҳудуд",
        "visual_share": "Ҳиссаи визуалӣ",
        "stats": "3. Ҷадвалҳои таҳлили омории худкор",
        "z_group": "Гурӯҳи BMI Z-score",
        "groups": "4. Таҳлил аз рӯи гурӯҳҳо",
        "male_n": "Мард N",
        "male_mean": "Мард mean",
        "female_n": "Зан N",
        "female_mean": "Зан mean",
        "diff": "Фарқ",
        "share": "Ҳисса",
        "correlation": "5. Коррелятсия ва регрессия",
        "model": "Модел",
        "not_enough": "Маълумот кофӣ нест",
        "equation": "Вазн = {intercept} + {slope} x Қад",
        "note_title": "6. Шарҳи илмӣ",
        "note": "Ҳисобот ба таври худкор шакл дода шуд. Ҷадвалҳо омори тавсифӣ, t-test аз рӯи ҷинс, ANOVA аз рӯи ҳудуд, матритсаи коррелятсия ва модели регрессияи қад-вазнро дар бар мегиранд.",
        "years": "сол",
    },
}

METRIC_LABELS = {
    "tg": {
        "chest_standing_height": "Қад (рост)",
        "weight": "Вазн",
        "bmi": "BMI",
        "chest_circumference_pause": "Даври сина",
        "waist_circumference": "Даври миён",
        "head_circumference": "Даври сар",
        "thigh_circumference": "Даври рон",
        "calf_circumference": "Даври соқ",
        "dynamometry": "Динамометрия",
    }
}


SUMMARY_I18N["ky"] = {
    **SUMMARY_I18N["uz"],
    "title": "MORPHOCHECK ИЛИМИЙ-СТАТИСТИКАЛЫК DOCX ОТЧЕТУ",
    "report_date": "Отчет датасы",
    "summary": "1. Жалпы жыйынтык",
    "scope": "Камтуу",
    "all_researchers": "Бардык изилдөөчүлөрдүн маалыматтары",
    "researcher_scope": "Изилдөөчүгө тиешелүү маалыматтар",
    "researcher": "Изилдөөчү",
    "total_records": "Жалпы жазуулар",
    "age_range": "Жаш аралыгы",
    "avg_age": "Орточо жаш",
    "active_filters": "Активдүү фильтрлер",
    "none": "Жок",
    "indicator": "Көрсөткүч",
    "value": "Маани",
    "demographics": "2. Демографиялык инфографикалар",
    "gender": "Жыныс",
    "region": "Аймак",
    "visual_share": "Визуалдык үлүш",
    "stats": "3. Автоматтык статистикалык талдоо таблицалары",
    "z_group": "BMI Z-score тобу",
    "groups": "4. Топтор боюнча талдоо",
    "male_n": "Эркек N",
    "male_mean": "Эркек mean",
    "female_n": "Аял N",
    "female_mean": "Аял mean",
    "diff": "Айырма",
    "share": "Үлүш",
    "correlation": "5. Корреляция жана регрессия",
    "model": "Модель",
    "not_enough": "Маалымат жетишсиз",
    "equation": "Салмак = {intercept} + {slope} x Бой",
    "note_title": "6. Илимий түшүндүрмө",
    "note": "Отчет автоматтык түрдө түзүлдү. Таблицаларда сыпаттамалык статистика, жыныстар боюнча t-test, аймактар боюнча ANOVA, корреляция матрицасы жана бой-салмак регрессия модели берилген.",
    "years": "жаш",
}

METRIC_LABELS["ky"] = {
    "chest_standing_height": "Бой (тик)",
    "weight": "Салмак",
    "bmi": "BMI",
    "chest_circumference_pause": "Көкүрөк айланасы",
    "waist_circumference": "Бел айланасы",
    "head_circumference": "Баш айланасы",
    "thigh_circumference": "Сан айланасы",
    "calf_circumference": "Балтыр айланасы",
    "dynamometry": "Динамометрия",
}


SUMMARY_I18N["tm"] = {
    **SUMMARY_I18N["uz"],
    "title": "MORPHOCHECK YLMY-STATISTIK DOCX HASABATY",
    "report_date": "Hasabat senesi",
    "summary": "1. Umumy jemleme",
    "scope": "Gurshawy",
    "all_researchers": "Ahli gozlegcilerin maglumatlary",
    "researcher_scope": "Gozlegca degisli maglumatlar",
    "researcher": "Gozlegci",
    "total_records": "Jemi yazgylar",
    "age_range": "Yas aralygy",
    "avg_age": "Orta yas",
    "active_filters": "Isjen filtrler",
    "none": "Yok",
    "indicator": "Gorkeziji",
    "value": "Bahasy",
    "demographics": "2. Demografik infografikalar",
    "gender": "Jyns",
    "region": "Sebit",
    "visual_share": "Wizual ulus",
    "stats": "3. Awtomatik statistik analiz tablisalary",
    "z_group": "BMI Z-score topary",
    "groups": "4. Toparlar kesiminde analiz",
    "male_n": "Erkek N",
    "male_mean": "Erkek mean",
    "female_n": "Ayal N",
    "female_mean": "Ayal mean",
    "diff": "Tapawut",
    "share": "Ulus",
    "correlation": "5. Korrelýasiya we regressiya",
    "model": "Model",
    "not_enough": "Maglumat yeterlik dal",
    "equation": "Agram = {intercept} + {slope} x Boy",
    "note_title": "6. Ylmy bellik",
    "note": "Hasabat awtomatik sekillendirildi. Tablisalarda teswirleyji statistika, jynslar boyunca t-test, sebitler boyunca ANOVA, korrelýasiya matrisasy we boy-agram regressiya modeli berildi.",
    "years": "yas",
}

METRIC_LABELS["tm"] = {
    "chest_standing_height": "Boy (dik)",
    "weight": "Agram",
    "bmi": "BMI",
    "chest_circumference_pause": "Gursi aylawy",
    "waist_circumference": "Bil aylawy",
    "head_circumference": "Bas aylawy",
    "thigh_circumference": "Son aylawy",
    "calf_circumference": "Boldur aylawy",
    "dynamometry": "Dinamometriya",
}
SUMMARY_I18N["ru"] = {
    **SUMMARY_I18N["uz"],
    "title": "MORPHOCHECK НАУЧНО-СТАТИСТИЧЕСКИЙ ОТЧЕТ DOCX",
    "report_date": "Дата отчета",
    "summary": "1. Общая сводка",
    "scope": "Охват",
    "all_researchers": "Данные всех исследователей",
    "researcher_scope": "Данные, относящиеся к исследователю",
    "researcher": "Исследователь",
    "total_records": "Всего записей",
    "age_range": "Возрастной диапазон",
    "avg_age": "Средний возраст",
    "active_filters": "Активные фильтры",
    "none": "Нет",
    "indicator": "Показатель",
    "value": "Значение",
    "demographics": "2. Демографическая инфографика",
    "gender": "Пол",
    "region": "Регион",
    "visual_share": "Визуальная доля",
    "stats": "3. Таблицы автоматического статистического анализа",
    "z_group": "Группа BMI Z-score",
    "groups": "4. Анализ в разрезе групп",
    "male_n": "Мужской N",
    "male_mean": "Мужской mean",
    "female_n": "Женский N",
    "female_mean": "Женский mean",
    "diff": "Разница",
    "share": "Доля",
    "correlation": "5. Корреляция и регрессия",
    "model": "Модель",
    "not_enough": "Недостаточно данных",
    "equation": "Вес = {intercept} + {slope} x Рост",
    "note_title": "6. Научный комментарий",
    "note": "Отчет сформирован автоматически. В таблицах представлены описательная статистика, t-тест по полу, ANOVA по регионам, матрица корреляции и регрессионная модель рост-вес.",
    "years": "лет",
}

METRIC_LABELS["ru"] = {
    "chest_standing_height": "Рост (стоя)",
    "weight": "Вес",
    "bmi": "BMI",
    "chest_circumference_pause": "Окружность грудной клетки",
    "waist_circumference": "Окружность талии",
    "head_circumference": "Окружность головы",
    "thigh_circumference": "Окружность бедра",
    "calf_circumference": "Окружность голени",
    "dynamometry": "Динамометрия",
}

SUMMARY_I18N["en"] = {
    **SUMMARY_I18N["uz"],
    "title": "MORPHOCHECK SCIENTIFIC-STATISTICAL DOCX REPORT",
    "report_date": "Report date",
    "summary": "1. General summary",
    "scope": "Scope",
    "all_researchers": "All researchers data",
    "researcher_scope": "Data related to researcher",
    "researcher": "Researcher",
    "total_records": "Total records",
    "age_range": "Age range",
    "avg_age": "Average age",
    "active_filters": "Active filters",
    "none": "None",
    "indicator": "Indicator",
    "value": "Value",
    "demographics": "2. Demographic infographics",
    "gender": "Gender",
    "region": "Region",
    "visual_share": "Visual share",
    "stats": "3. Automatic statistical analysis tables",
    "z_group": "BMI Z-score group",
    "groups": "4. Analysis by groups",
    "male_n": "Male N",
    "male_mean": "Male mean",
    "female_n": "Female N",
    "female_mean": "Female mean",
    "diff": "Difference",
    "share": "Share",
    "correlation": "5. Correlation and regression",
    "model": "Model",
    "not_enough": "Not enough data",
    "equation": "Weight = {intercept} + {slope} x Height",
    "note_title": "6. Scientific comment",
    "note": "Report generated automatically. Tables present descriptive statistics, t-test by gender, ANOVA by regions, correlation matrix, and height-weight regression model.",
    "years": "years",
}

METRIC_LABELS["en"] = {
    "chest_standing_height": "Height (standing)",
    "weight": "Weight",
    "bmi": "BMI",
    "chest_circumference_pause": "Chest circumference",
    "waist_circumference": "Waist circumference",
    "head_circumference": "Head circumference",
    "thigh_circumference": "Thigh circumference",
    "calf_circumference": "Calf circumference",
    "dynamometry": "Dynamometry",
}


SUMMARY_I18N["tr"] = {
    **SUMMARY_I18N["en"],
    "title": "MORPHOCHECK BILIMSEL-ISTATISTIK DOCX RAPORU",
    "report_date": "Rapor tarihi",
    "summary": "1. Genel ozet",
    "scope": "Kapsam",
    "all_researchers": "Tum arastirmacilarin verileri",
    "researcher_scope": "Arastirmaciya ait veriler",
    "researcher": "Arastirmaci",
    "total_records": "Toplam kayit",
    "age_range": "Yas araligi",
    "avg_age": "Ortalama yas",
    "active_filters": "Aktif filtreler",
    "none": "Yok",
    "indicator": "Gosterge",
    "value": "Deger",
    "demographics": "2. Demografik infografikler",
    "gender": "Cinsiyet",
    "region": "Bolge",
    "visual_share": "Gorsel pay",
    "stats": "3. Otomatik istatistiksel analiz tablolari",
    "z_group": "BMI Z-score grubu",
    "groups": "4. Gruplara gore analiz",
    "male_n": "Erkek N",
    "male_mean": "Erkek mean",
    "female_n": "Kadin N",
    "female_mean": "Kadin mean",
    "diff": "Fark",
    "share": "Pay",
    "correlation": "5. Korelasyon ve regresyon",
    "model": "Model",
    "not_enough": "Yeterli veri yok",
    "equation": "Kilo = {intercept} + {slope} x Boy",
    "note_title": "6. Bilimsel not",
    "note": "Rapor otomatik olarak olusturuldu. Tablolarda tanimlayici istatistikler, cinsiyete gore t-test, bolgelere gore ANOVA, korelasyon matrisi ve boy-kilo regresyon modeli sunulur.",
    "years": "yil",
}

METRIC_LABELS["tr"] = {
    "chest_standing_height": "Boy (ayakta)",
    "weight": "Kilo",
    "bmi": "BMI",
    "chest_circumference_pause": "Gogus cevresi",
    "waist_circumference": "Bel cevresi",
    "head_circumference": "Bas cevresi",
    "thigh_circumference": "Uyluk cevresi",
    "calf_circumference": "Baldir cevresi",
    "dynamometry": "Dinamometri",
}

SUMMARY_I18N["kz"] = {
    **SUMMARY_I18N["uz"],
    "title": "MORPHOCHECK \u0492\u044b\u043b\u044b\u043c\u0438-\u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430\u043b\u044b\u049b DOCX \u0415\u0441\u0435\u0431\u0456",
    "report_date": "\u0415\u0441\u0435\u0431 \u043a\u04af\u043d\u0456",
    "summary": "1. \u0416\u0430\u043b\u043f\u044b \u0436\u0438\u044b\u043d\u0442\u044b\u049b",
    "scope": "\u049a\u0430\u043c\u0442\u0443",
    "all_researchers": "Bar\u043b\u044b\u049b \u0437\u0435\u0440\u0442\u0442\u0435\u0443\u0448\u0456\u043b\u0435\u0440\u0434\u0456\u04a3 \u0434\u0435\u0440\u0435\u043a\u0442\u0435\u0440\u0456",
    "researcher_scope": "\u0417\u0435\u0440\u0442\u0442\u0435\u0443\u0448\u0456\u0433\u0435 \u049b\u0430\u0442\u044b\u0441\u0442\u044b \u0434\u0435\u0440\u0435\u043a\u0442\u0435\u0440",
    "researcher": "\u0417\u0435\u0440\u0442\u0442\u0435\u0443\u0448\u0456",
    "total_records": "\u0416\u0430\u043b\u043f\u044b \u0436\u0430\u0437\u0431\u0430\u043b\u0430\u0440",
    "age_range": "\u0416\u0430\u0441 \u0430\u0440\u0430\u043b\u044b\u0493\u044b",
    "avg_age": "\u041e\u0440\u0442\u0430\u0448\u0430 \u0436\u0430\u0441",
    "active_filters": "\u0411\u0435\u043b\u0441\u0435\u043d\u0434\u0456 \u0441\u04af\u0437\u0433\u0456\u043b\u0435\u0440",
    "none": "\u0416\u043e\u049b",
    "indicator": "\u041a\u04e9\u0440\u0441\u0435\u0442\u043a\u0456\u0448",
    "value": "\u041c\u04d9\u043d",
    "demographics": "2. \u0414\u0435\u043c\u043e\u0433\u0440\u0430\u0444\u0438\u044f\u043b\u044b\u049b \u0438\u043d\u0444\u043e\u0433\u0440\u0430\u0444\u0438\u043a\u0430\u043b\u0430\u0440",
    "gender": "\u0416\u044b\u043d\u044b\u0441\u044b",
    "region": "\u0410\u0439\u043c\u0430\u049b",
    "visual_share": "\u0412\u0438\u0437\u0443\u0430\u043b\u0434\u044b \u04af\u043b\u0435\u0441",
    "stats": "3. \u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0442\u044b \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430\u043b\u044b\u049b \u0442\u0430\u043b\u0434\u0430\u0443 \u043a\u0435\u0441\u0442\u0435\u043b\u0435\u0440\u0456",
    "z_group": "BMI Z-score \u0442\u043e\u0431\u044b",
    "groups": "4. \u0422\u043e\u043f\u0442\u0430\u0440 \u0431\u04e9\u043b\u0456\u043d\u0456\u0441\u0456\u043d\u0434\u0435\u0433\u0456 \u0442\u0430\u043b\u0434\u0430\u0443",
    "male_n": "\u0415\u0440\u043b\u0435\u0440 N",
    "male_mean": "\u0415\u0440\u043b\u0435\u0440 mean",
    "female_n": "\u04d8\u0439\u0435\u043b\u0434\u0435\u0440 N",
    "female_mean": "\u04d8\u0439\u0435\u043b\u0434\u0435\u0440 mean",
    "diff": "\u0410\u0439\u044b\u0440\u043c\u0430\u0448\u044b\u043b\u044b\u049b",
    "share": "\u04af\u043b\u0435\u0441",
    "correlation": "5. \u041a\u043e\u0440\u0440\u0435\u043b\u044f\u0446\u0438\u044f \u0436\u04d9\u043d\u0435 \u0440\u0435\u0433\u0440\u0435\u0441\u0441\u0438\u044f",
    "model": "\u041c\u043e\u0434\u0435\u043b\u044c",
    "not_enough": "\u0414\u0435\u0440\u0435\u043a\u0442\u0435\u0440 \u0436\u0435\u0442\u043a\u0456\u043b\u0456\u0441\u0456\u0437",
    "equation": "\u0421\u0430\u043b\u043c\u0430\u049b = {intercept} + {slope} x \u0411\u043e\u0439",
    "note_title": "6. \u0492\u044b\u043b\u044b\u043c\u0438 \u0442\u04af\u0441\u0456\u043d\u0456\u043a\u0442\u0435\u043c\u0435",
    "note": "\u0415\u0441\u0435\u0431 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0442\u044b \u0442\u04af\u0440\u0434\u0435 \u0436\u0430\u0441\u0430\u043b\u0434\u044b. \u041a\u0435\u0441\u0442\u0435\u043b\u0435\u0440\u0434\u0435 \u0441\u0438\u043f\u0430\u0442\u0442\u0430\u043c\u0430\u043b\u044b\u049b \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430, \u0436\u044b\u043d\u044b\u0441\u0442\u0430\u0440 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 t-test, \u0430\u0439\u043c\u0430\u049b\u0442\u0430\u0440 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 ANOVA, \u043a\u043e\u0440\u0440\u0435\u043b\u044f\u0446\u0438\u044f \u043c\u0430\u0442\u0440\u0438\u0446\u0430\u0441\u044b \u0436\u04d9\u043d\u0435 \u0431\u043e\u0439-\u0441\u0430\u043b\u043c\u0430\u049b \u0440\u0435\u0433\u0440\u0435\u0441\u0441\u0438\u044f \u043c\u043e\u0434\u0435\u043b\u0456 \u0431\u0435\u0440\u0456\u043b\u0433\u0435\u043d.",
    "years": "\u0436\u0430\u0441",
}

METRIC_LABELS["kz"] = {
    "chest_standing_height": "\u0411\u043e\u0439 (\u0442\u0456\u043a)",
    "weight": "\u0421\u0430\u043b\u043c\u0430\u049b",
    "bmi": "BMI",
    "chest_circumference_pause": "\u041a\u0435\u0443\u0434\u0435 \u0430\u0439\u043d\u0430\u043b\u044b\u043c\u044b",
    "waist_circumference": "\u0411\u0435\u043b \u0430\u0439\u043d\u0430\u043b\u044b\u043c\u044b",
    "head_circumference": "\u0411\u0430\u0441 \u0430\u0439\u043d\u0430\u043b\u044b\u043c\u044b",
    "thigh_circumference": "\u0421\u0430\u043d \u0430\u0439\u043d\u0430\u043b\u044b\u043c\u044b",
    "calf_circumference": "\u0411\u0430\u043b\u0442\u044b\u0440 \u0430\u0439\u043d\u0430\u043b\u044b\u043c\u044b",
    "dynamometry": "\u0414\u0438\u043d\u0430\u043c\u043e\u043c\u0435\u0442\u0440\u0438\u044f",
}


def _tr(lang, key):
    return SUMMARY_I18N.get(lang, SUMMARY_I18N["uz"]).get(
        key, SUMMARY_I18N["uz"].get(key, key)
    )


def _metric_label(key, label, lang):
    return METRIC_LABELS.get(lang, {}).get(key, label)


def _fmt(value, digits=2):
    if value is None or not isinstance(value, (int, float)) or not math.isfinite(value):
        return "-"
    return f"{value:.{digits}f}"


def _num(value):
    try:
        n = float(value)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError):
        return None


def _mean(values):
    return sum(values) / len(values) if values else None


def _sd(values):
    if len(values) < 2:
        return 0
    avg = _mean(values)
    return math.sqrt(sum((v - avg) ** 2 for v in values) / (len(values) - 1))


def _percentile(values, p):
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * p
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)


def _gender_label(gender, lang="uz"):
    value = str(gender or "").lower()
    if "girl" in value or "ayol" in value or "qiz" in value or "female" in value:
        if lang == "tm":
            return "Gyz/Ayal"
        if lang == "tg":
            return "\u0414\u0443\u0445\u0442\u0430\u0440/\u0417\u0430\u043d"
        if lang == "ky":
            return "\u041a\u044b\u0437/\u0410\u044f\u043b"
        if lang in ("kz", "kk"):
            return "\u049a\u044b\u0437/\u04d8\u0439\u0435\u043b"
        if lang == "tr":
            return "K\u0131z/Kad\u0131n"
        if lang == "en":
            return "Girl/Female"
        return "Qiz/Ayol"
    if (
        "boy" in value
        or "erkak" in value
        or "o'g" in value
        or "og" in value
        or "male" in value
    ):
        if lang == "tm":
            return "Oglan/Erkek"
        if lang == "tg":
            return "\u041f\u0438\u0441\u0430\u0440/\u041c\u0430\u0440\u0434"
        if lang == "ky":
            return "\u042d\u0440\u043a\u0435\u043a/\u0411\u0430\u043b\u0430"
        if lang in ("kz", "kk"):
            return "\u0415\u0440\u043a\u0435\u043a/\u0411\u0430\u043b\u0430"
        if lang == "tr":
            return "Erkek"
        if lang == "en":
            return "Boy/Male"
        return "O'g'il/Erkak"
    if lang == "tm":
        return "Namalum"
    if lang == "tg":
        return "\u041d\u043e\u043c\u0430\u044a\u043b\u0443\u043c"
    if lang == "ky":
        return "\u0411\u0435\u043b\u0433\u0438\u0441\u0438\u0437"
    if lang in ("kz", "kk"):
        return "\u0411\u0435\u043b\u0433\u0456\u0441\u0456\u0437"
    if lang == "tr":
        return "Bilinmeyen"
    if lang == "en":
        return "Unknown"
    return "Noma'lum"


def _age(record):
    birth_date = getattr(record, "birth_date", None)
    if not birth_date:
        return None
    try:
        b_date = datetime.strptime(str(birth_date), "%Y-%m-%d")
        exam_raw = getattr(record, "examination_date", None) or datetime.now().strftime(
            "%Y-%m-%d"
        )
        e_date = datetime.strptime(str(exam_raw), "%Y-%m-%d")
        years = (e_date - b_date).days / 365.25
        return years if years >= 0 else None
    except (TypeError, ValueError):
        return None


def _metric_value(record, key):
    if key == "bmi":
        weight = _num(getattr(record, "weight", None))
        height = _num(getattr(record, "chest_standing_height", None))
        return weight / ((height / 100) ** 2) if weight and height else None
    if key == "age":
        return _age(record)
    return _num(getattr(record, key, None))


def _regularized_beta(x, a, b):
    if x <= 0:
        return 0
    if x >= 1:
        return 1

    def cont_fraction(xx, aa, bb):
        max_iter = 100
        eps = 1e-8
        fpmin = 1e-30
        qab = aa + bb
        qap = aa + 1
        qam = aa - 1
        c = 1
        d = 1 - qab * xx / qap
        if abs(d) < fpmin:
            d = fpmin
        d = 1 / d
        h = d
        for m in range(1, max_iter + 1):
            m2 = 2 * m
            val = m * (bb - m) * xx / ((qam + m2) * (aa + m2))
            d = 1 + val * d
            if abs(d) < fpmin:
                d = fpmin
            c = 1 + val / c
            if abs(c) < fpmin:
                c = fpmin
            d = 1 / d
            h *= d * c
            val = -(aa + m) * (qab + m) * xx / ((aa + m2) * (qap + m2))
            d = 1 + val * d
            if abs(d) < fpmin:
                d = fpmin
            c = 1 + val / c
            if abs(c) < fpmin:
                c = fpmin
            d = 1 / d
            delta = d * c
            h *= delta
            if abs(delta - 1) < eps:
                break
        return h

    bt = math.exp(
        math.lgamma(a + b)
        - math.lgamma(a)
        - math.lgamma(b)
        + a * math.log(x)
        + b * math.log(1 - x)
    )
    if x < (a + 1) / (a + b + 2):
        return bt * cont_fraction(x, a, b) / a
    return 1 - bt * cont_fraction(1 - x, b, a) / b


def _t_test_p_value(t_value, df):
    if t_value is None or not math.isfinite(t_value) or df <= 0:
        return None
    x = df / (df + t_value * t_value)
    return min(1, max(0, _regularized_beta(x, df / 2, 0.5)))


def _f_test_p_value(f_value, df1, df2):
    if (
        f_value is None
        or not math.isfinite(f_value)
        or f_value < 0
        or df1 <= 0
        or df2 <= 0
    ):
        return None
    x = (df1 * f_value) / (df1 * f_value + df2)
    return min(1, max(0, 1 - _regularized_beta(x, df1 / 2, df2 / 2)))


def _pearson(pairs):
    if len(pairs) < 3:
        return None
    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]
    mx = _mean(xs)
    my = _mean(ys)
    numerator = sum((x - mx) * (y - my) for x, y in pairs)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return numerator / (sx * sy) if sx and sy else None


def _build_stats(records, lang="uz"):
    descriptive = []
    for key, label, unit in METRICS:
        values = [_metric_value(record, key) for record in records]
        values = [v for v in values if v is not None]
        if not values:
            descriptive.append({"key": key, "label": label, "unit": unit, "n": 0})
            continue
        avg = _mean(values)
        sd = _sd(values)
        descriptive.append(
            {
                "key": key,
                "label": _metric_label(key, label, lang),
                "unit": unit,
                "n": len(values),
                "mean": avg,
                "sd": sd,
                "median": _percentile(values, 0.5),
                "min": min(values),
                "max": max(values),
                "p5": _percentile(values, 0.05),
                "p25": _percentile(values, 0.25),
                "p75": _percentile(values, 0.75),
                "p95": _percentile(values, 0.95),
                "z_low": len([v for v in values if sd and (v - avg) / sd < -2]),
                "z_normal": len(
                    [v for v in values if not sd or abs((v - avg) / sd) <= 2]
                ),
                "z_high": len([v for v in values if sd and (v - avg) / sd > 2]),
            }
        )

    gender = []
    for key, label, unit in ANALYSIS_METRICS:
        groups = defaultdict(list)
        for record in records:
            value = _metric_value(record, key)
            gender_name = _gender_label(getattr(record, "gender", None), lang)
            if value is not None and gender_name != _gender_label(None, lang):
                groups[gender_name].append(value)
        male_label = _gender_label("boy", lang)
        female_label = _gender_label("girl", lang)
        male = groups[male_label]
        female = groups[female_label]
        row = {
            "label": _metric_label(key, label, lang),
            "unit": unit,
            "male_n": len(male),
            "female_n": len(female),
        }
        if len(male) >= 2 and len(female) >= 2:
            m1 = _mean(male)
            m2 = _mean(female)
            sd1 = _sd(male)
            sd2 = _sd(female)
            pooled = math.sqrt(
                ((len(male) - 1) * sd1**2 + (len(female) - 1) * sd2**2)
                / (len(male) + len(female) - 2)
            )
            se = math.sqrt(sd1**2 / len(male) + sd2**2 / len(female))
            t_value = abs((m1 - m2) / se) if se else None
            row.update(
                {
                    "male_mean": m1,
                    "female_mean": m2,
                    "diff": m1 - m2,
                    "p": _t_test_p_value(t_value, len(male) + len(female) - 2),
                    "effect": (m1 - m2) / pooled if pooled else None,
                }
            )
        gender.append(row)

    region_groups = defaultdict(list)
    for record in records:
        name = (
            getattr(record, "settlement", None)
            or getattr(record, "birth_place", None)
            or (
                "Namalum"
                if lang == "tm"
                else ("Номаълум" if lang == "tg" else "Noma'lum")
            )
        )
        value = _metric_value(record, "bmi")
        if value is not None:
            region_groups[str(name).strip() or "Noma'lum"].append(value)
    eligible = sorted(
        [(name, values) for name, values in region_groups.items() if len(values) >= 2],
        key=lambda item: len(item[1]),
        reverse=True,
    )[:8]
    all_region_values = [value for _, values in eligible for value in values]
    region = {"groups": []}
    if len(eligible) >= 2 and len(all_region_values) >= 4:
        grand_mean = _mean(all_region_values)
        ss_between = sum(
            len(values) * (_mean(values) - grand_mean) ** 2 for _, values in eligible
        )
        ss_within = sum(
            sum((v - _mean(values)) ** 2 for v in values) for _, values in eligible
        )
        df_between = len(eligible) - 1
        df_within = len(all_region_values) - len(eligible)
        ms_within = ss_within / df_within if df_within else 0
        f_value = (ss_between / df_between) / ms_within if ms_within else None
        region.update(
            {
                "f": f_value,
                "p": _f_test_p_value(f_value, df_between, df_within),
                "eta_squared": ss_between / (ss_between + ss_within)
                if ss_between + ss_within
                else None,
                "df_between": df_between,
                "df_within": df_within,
            }
        )
    region["groups"] = [
        {"name": name, "n": len(values), "mean": _mean(values), "sd": _sd(values)}
        for name, values in eligible
    ]

    correlation = []
    for key_a, label_a, _ in ANALYSIS_METRICS:
        values = []
        for key_b, _, _ in ANALYSIS_METRICS:
            if key_a == key_b:
                values.append(1)
            else:
                pairs = [
                    (_metric_value(record, key_a), _metric_value(record, key_b))
                    for record in records
                ]
                values.append(
                    _pearson(
                        [(x, y) for x, y in pairs if x is not None and y is not None]
                    )
                )
        correlation.append({"label": label_a, "values": values})

    pairs = [
        (
            _metric_value(record, "chest_standing_height"),
            _metric_value(record, "weight"),
        )
        for record in records
    ]
    pairs = [
        (height, weight)
        for height, weight in pairs
        if height is not None and weight is not None
    ]
    regression = {"n": len(pairs)}
    if len(pairs) >= 3:
        xs = [p[0] for p in pairs]
        ys = [p[1] for p in pairs]
        mx = _mean(xs)
        my = _mean(ys)
        ssx = sum((x - mx) ** 2 for x in xs)
        slope = sum((x - mx) * (y - my) for x, y in pairs) / ssx if ssx else None
        intercept = my - slope * mx if slope is not None else None
        r_value = _pearson(pairs)
        t_value = (
            abs(r_value) * math.sqrt((len(pairs) - 2) / (1 - r_value**2))
            if r_value is not None and abs(r_value) < 1
            else None
        )
        regression.update(
            {
                "slope": slope,
                "intercept": intercept,
                "r": r_value,
                "r2": r_value**2 if r_value is not None else None,
                "p": _t_test_p_value(t_value, len(pairs) - 2),
            }
        )

    genders = Counter(
        _gender_label(getattr(record, "gender", None), lang) for record in records
    )
    settlements = Counter(
        str(
            getattr(record, "settlement", None)
            or getattr(record, "birth_place", None)
            or "Noma'lum"
        ).strip()
        or "Noma'lum"
        for record in records
    )
    schools = Counter(
        str(getattr(record, "school_name", None) or "Noma'lum").strip() or "Noma'lum"
        for record in records
    )
    ages = [_age(record) for record in records]
    ages = [value for value in ages if value is not None]

    return {
        "count": len(records),
        "descriptive": descriptive,
        "gender": gender,
        "region": region,
        "correlation": correlation,
        "regression": regression,
        "genders": genders,
        "settlements": settlements,
        "schools": schools,
        "ages": ages,
    }


def _set_cell_text(
    cell, text, bold=False, size=9, align=WD_ALIGN_PARAGRAPH.LEFT, fill=None, color=None
):
    paragraph = cell.paragraphs[0]
    paragraph.clear()
    paragraph.alignment = align
    run = paragraph.add_run(str(text))
    run.bold = bold
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor(*color)
    if fill:
        tc_pr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), fill)
        tc_pr.append(shd)


def _heading(doc, text, level=1):
    paragraph = doc.add_paragraph()
    paragraph.alignment = (
        WD_ALIGN_PARAGRAPH.CENTER if level == 1 else WD_ALIGN_PARAGRAPH.LEFT
    )
    run = paragraph.add_run(text)
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(15 if level == 1 else 11)
    run.font.color.rgb = RGBColor(25, 80, 140)
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(4)


def _table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    for index, header in enumerate(headers):
        _set_cell_text(
            table.cell(0, index),
            header,
            bold=True,
            size=8,
            align=WD_ALIGN_PARAGRAPH.CENTER,
            fill="1F4E79",
            color=(255, 255, 255),
        )
    for row in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row):
            _set_cell_text(
                cells[index],
                value,
                size=8,
                align=WD_ALIGN_PARAGRAPH.CENTER if index else WD_ALIGN_PARAGRAPH.LEFT,
            )
    if widths:
        for col_idx, width in enumerate(widths):
            for cell in table.columns[col_idx].cells:
                cell.width = Cm(width)
    return table


def _bar(value, total, width=24):
    if not total:
        return ""
    filled = max(0, min(width, round((value / total) * width)))
    return "#" * filled + "-" * (width - filled)


def _p_label(value):
    if value is None or not math.isfinite(value):
        return "-"
    return "<0.001" if value < 0.001 else f"{value:.3f}"


def generate_research_summary_docx(
    records, current_user=None, researcher=None, filters=None, lang="uz",
    privacy_redacted=False,
):
    stats = _build_stats(records, lang=lang)
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(1.2)
        section.bottom_margin = Cm(1.2)
        section.left_margin = Cm(1.4)
        section.right_margin = Cm(1.2)

    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(9)

    _heading(doc, _tr(lang, "title"), 1)
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run(
        f"{_tr(lang, 'report_date')}: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    ).font.size = Pt(9)

    owner_name = (
        getattr(researcher, "name", None) or getattr(current_user, "name", None) or "-"
    )
    owner_email = (
        getattr(researcher, "email", None)
        or getattr(current_user, "email", None)
        or "-"
    )
    scope = (
        _tr(lang, "all_researchers")
        if getattr(current_user, "role", "") == "superadmin" and researcher is None
        else _tr(lang, "researcher_scope")
    )

    _heading(doc, _tr(lang, "summary"), 2)
    ages = stats["ages"]
    summary_rows = [
        [_tr(lang, "scope"), scope],
        [_tr(lang, "researcher"), f"{owner_name} ({owner_email})"],
        [_tr(lang, "total_records"), stats["count"]],
        [
            _tr(lang, "age_range"),
            f"{_fmt(min(ages), 1)} - {_fmt(max(ages), 1)} {_tr(lang, 'years')}"
            if ages
            else "-",
        ],
        [
            _tr(lang, "avg_age"),
            f"{_fmt(_mean(ages), 1)} {_tr(lang, 'years')}" if ages else "-",
        ],
        [
            _tr(lang, "active_filters"),
            ", ".join(
                f"{k}={v}" for k, v in (filters or {}).items() if v not in (None, "")
            )
            or _tr(lang, "none"),
        ],
    ]
    _table(
        doc, [_tr(lang, "indicator"), _tr(lang, "value")], summary_rows, widths=[5, 11]
    )

    _heading(doc, _tr(lang, "demographics"), 2)
    total = max(stats["count"], 1)
    gender_rows = [
        [name, count, f"{count / total * 100:.1f}%", _bar(count, total)]
        for name, count in stats["genders"].most_common()
    ]
    _table(
        doc,
        [_tr(lang, "gender"), "N", "%", _tr(lang, "visual_share")],
        gender_rows or [["-", "-", "-", "-"]],
        widths=[4, 2, 2, 8],
    )

    if not privacy_redacted:
        settlement_rows = [
            [name, count, f"{count / total * 100:.1f}%", _bar(count, total)]
            for name, count in stats["settlements"].most_common(10)
        ]
        _table(
            doc,
            [_tr(lang, "region"), "N", "%", _tr(lang, "visual_share")],
            settlement_rows or [["-", "-", "-", "-"]],
            widths=[6, 2, 2, 7],
        )

    _heading(doc, _tr(lang, "stats"), 2)
    descriptive_rows = []
    for item in stats["descriptive"]:
        descriptive_rows.append(
            [
                item["label"],
                item["n"],
                f"{_fmt(item.get('mean'))} +/- {_fmt(item.get('sd'))}",
                _fmt(item.get("median")),
                f"{_fmt(item.get('min'))} - {_fmt(item.get('max'))}",
                f"{_fmt(item.get('p5'))} / {_fmt(item.get('p25'))} / {_fmt(item.get('p75'))} / {_fmt(item.get('p95'))}",
            ]
        )
    _table(
        doc,
        [
            _tr(lang, "indicator"),
            "N",
            "Mean +/- SD",
            "Median",
            "Min-Max",
            "P5/P25/P75/P95",
        ],
        descriptive_rows,
    )

    bmi = next((item for item in stats["descriptive"] if item["key"] == "bmi"), None)
    if bmi:
        z_rows = [
            [
                "Z < -2",
                bmi.get("z_low", 0),
                _bar(bmi.get("z_low", 0), max(bmi.get("n", 0), 1)),
            ],
            [
                "-2 <= Z <= 2",
                bmi.get("z_normal", 0),
                _bar(bmi.get("z_normal", 0), max(bmi.get("n", 0), 1)),
            ],
            [
                "Z > 2",
                bmi.get("z_high", 0),
                _bar(bmi.get("z_high", 0), max(bmi.get("n", 0), 1)),
            ],
        ]
        _table(
            doc, [_tr(lang, "z_group"), "N", "Infografika"], z_rows, widths=[5, 2, 9]
        )

    _heading(doc, _tr(lang, "groups"), 2)
    gender_analysis_rows = [
        [
            row["label"],
            row["male_n"],
            _fmt(row.get("male_mean")),
            row["female_n"],
            _fmt(row.get("female_mean")),
            _fmt(row.get("diff")),
            _p_label(row.get("p")),
            _fmt(row.get("effect")),
        ]
        for row in stats["gender"]
    ]
    _table(
        doc,
        [
            _tr(lang, "indicator"),
            _tr(lang, "male_n"),
            _tr(lang, "male_mean"),
            _tr(lang, "female_n"),
            _tr(lang, "female_mean"),
            _tr(lang, "diff"),
            "p",
            "Effect",
        ],
        gender_analysis_rows,
    )

    region = stats["region"]
    region_rows = [
        [
            row["name"],
            row["n"],
            _fmt(row["mean"]),
            _fmt(row["sd"]),
            _bar(row["n"], total),
        ]
        for row in region["groups"]
    ]
    _table(
        doc,
        [_tr(lang, "region"), "N", "BMI mean", "SD", _tr(lang, "share")],
        region_rows or [["-", "-", "-", "-", "-"]],
    )
    doc.add_paragraph(
        f"ANOVA: F={_fmt(region.get('f'))}; p={_p_label(region.get('p'))}; eta^2={_fmt(region.get('eta_squared'), 3)}"
    )

    _heading(doc, _tr(lang, "correlation"), 2)
    corr_headers = [""] + [metric[1] for metric in ANALYSIS_METRICS]
    corr_rows = [
        [row["label"]]
        + [_fmt(value, 2) if value is not None else "-" for value in row["values"]]
        for row in stats["correlation"]
    ]
    _table(doc, corr_headers, corr_rows)

    regression = stats["regression"]
    equation = (
        _tr(lang, "equation").format(
            intercept=_fmt(regression.get("intercept")),
            slope=_fmt(regression.get("slope"), 3),
        )
        if regression.get("intercept") is not None
        else _tr(lang, "not_enough")
    )
    _table(
        doc,
        [_tr(lang, "model"), "N", "R", "R2", "p"],
        [
            [
                equation,
                regression.get("n", 0),
                _fmt(regression.get("r"), 3),
                _fmt(regression.get("r2"), 3),
                _p_label(regression.get("p")),
            ]
        ],
        widths=[8, 2, 2, 2, 2],
    )

    _heading(doc, _tr(lang, "note_title"), 2)
    note = doc.add_paragraph()
    note.add_run(_tr(lang, "note"))

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
