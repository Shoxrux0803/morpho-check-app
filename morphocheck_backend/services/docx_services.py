"""
DOCX hisobot generatsiyasi — "Мактабгача таълим ёшидаги болалар учун
биоимпеданс + антропометрик текширув анкетаси" шаблонига mos.
Барча матнлар кирилл харфларида берилади.

Ключ нормализация: camelCase ва snake_case иккаласини ҳам қабул қилади.
"""

import re
from copy import deepcopy
from io import BytesIO

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

from services.body_composition_service import (
    estimate_phase_angle_from_anthropometry,
    estimate_segmental_composition,
)
from services.ky_localization import ky_text, report_text
from utils.translit import lat2cyr

__all__ = ["generate_docx_report"]


# ---------------------------------------------------------------------------
# Ko'p tilli yorliqlar (DOCX labels)
# ---------------------------------------------------------------------------
DOCX_LABELS = {
    "uz": {
        "title_child": "МАКТАБГАЧА ТАЪЛИМ ЁШИДАГИ БОЛАЛАР УЧУН БИОИМПЕДАНС +\nАНТРОПОМЕТРИК ТЕКШИРУВ АНКЕТАСИ",
        "title_pupil": "МАКТАБ ЁШИДАГИ БОЛАЛАР ВА ЎСМИРЛАР УЧУН БИОИМПЕДАНС +\nАНТРОПОМЕТРИК ТЕКШИРУВ АНКЕТАСИ",
        "title_adult": "АНТРОПОМЕТРИК ТЕКШИРУВ ВА БИОИМПЕДАНС ТАҲЛИЛ АНКЕТАСИ",
        "section_1": "I. Умумий маълумотлар",
        "no": "№",
        "indicator": "Кўрсаткич",
        "data_col": "Маълумот",
        "name_label_child": "Исми ва фамилияси (боланинг)",
        "name_label_adult": "Исми ва фамилияси (беморнинг)",
        "id_code": "ID код",
        "exam_date": "Текширув санаси",
        "age_label_child": "Ёши (боланинг)",
        "age_label_adult": "Ёши (беморнинг)",
        "age_suffix": "йил",
        "age_months": "ой",
        "age_days": "кун",
        "gender": "Жинси",
        "male": "Ўғил",
        "female": "Қиз",
        "birth_date": "Туғилган санаси",
        "area_type": "Ҳудуд тури",
        "city": "Шаҳар",
        "village": "Қишлоқ",
        "institution": "Муассаса (мактаб/боғча)",
        "address": "Яшаш манзили",
        "parents_phone": "Ота-она телефони",
        "section_2": "II. Асосий антропометрик кўрсаткичлар (ЖССТ стандартлари)",
        "unit": "Ўл.б.",
        "value": "Қийм.",
        "height": "Бўй узунлиги",
        "weight": "Тана вазни",
        "head": "Бош айланаси",
        "chest": "Кўкрак айланаси",
        "waist": "Бел айланаси",
        "sh_len": "Елка узунлиги",
        "sh_br": "Елка кенглиги",
        "sh_circ": "Елка айланаси",
        "arm_elb": "Билак/тирсак узунлиги",
        "hand": "Қўл панжа узунлиги",
        "thigh_len": "Сон узунлиги",
        "thigh_circ": "Сон айланаси",
        "calf_len": "Болдир узунлиги",
        "calf_circ": "Болдир айланаси",
        "foot": "Оёқ панжа узунлиги",
        "body_len": "Тана узунлиги",
        "section_3": "III. Ҳисобланган антропометрик индекслар",
        "eval": "Баҳолаш",
        "bmi_label": "ТВИ (кг/м²)",
        "height_age_z": "Бўй-ёш Z-score",
        "weight_age_z": "Вазн-ёш Z-score",
        "bmi_age_z": "ТВИ-ёш Z-score",
        "centile": "Центил интервали",
        "corridor": "Соғломлик йўлаги",
        "hmai_label": "HMAI (мослашув)",
        "mii_label": "MII (интеграция)",
        "adi_label": "ADI (номутаносиблик)",
        "mcri_label": "MCRI (Риск индекси)",
        "body_len_z": "Тана уз. Z-score",
        "section_4": "IV. Биоимпеданс таҳлили натижалари",
        "norm": "Меъёр",
        "tbw": "Умумий сув (TBW)",
        "fm_p": "Ёғ тўқимаси (%)",
        "fm_kg": "Ёғ массаси (кг)",
        "muscle": "Мушак массаси",
        "bone": "Суяк массаси",
        "acm": "Фаол ҳужайра массаси (ACM)",
        "visceral": "Висцерал ёғ даражаси",
        "section_5": "V. Морфологик ва биологик баҳолаш",
        "dev_level": "Жисмоний ривожланиш даражаси",
        "age_matches": "Ёшига мос",
        "behind": "Орқада қолган",
        "ahead": "Олдинда",
        "morph_type": "Морфологик типи",
        "bio_age_match": "Биологик ёшига мослиги",
        "secular": "Секуляр тренд белгилари",
        "section_6": "VI. Этик розилик ва имзолар:",
        "parent": "Ота-она (ёки васий)",
        "nurse": "Тиббий ҳамшира (муассаса)",
        "specialists": "Мутахассис 1 / Мутахассис 2",
        "consultant": "Консультант",
        "sig_date": "Имзо / Сана",
        "doctor_parent": "Мутахассис / Ота-она",
        "astenik": "Астеник",
        "normostenik": "Нормостеник",
        "giperstenik": "Гиперстеник",
        "mos": "Мос",
        "mos_emas": "Мос эмас",
        "mavjud": "Мавжуд",
        "yoq": "Йўқ",
        "cm": "см",
        "kg": "кг",
    },
    "ru": {
        "title_child": "АНКЕТА БИОИМПЕДАНСНОГО + АНТРОПОМЕТРИЧЕСКОГО\nОБСЛЕДОВАНИЯ ДЛЯ ДЕТЕЙ ДОШКОЛЬНОГО ВОЗРАСТА",
        "title_pupil": "АНКЕТА БИОИМПЕДАНСНОГО + АНТРОПОМЕТРИЧЕСКОГО\nОБСЛЕДОВАНИЯ ДЛЯ ШКОЛЬНИКОВ И ПОДРОСТКОВ",
        "title_adult": "АНКЕТА АНТРОПОМЕТРИЧЕСКОГО ОБСЛЕДОВАНИЯ И БИОИМПЕДАНСНОГО АНАЛИЗА",
        "section_1": "I. Общие сведения",
        "no": "№",
        "indicator": "Показатель",
        "data_col": "Данные",
        "name_label_child": "Имя и фамилия (ребенка)",
        "name_label_adult": "Имя и фамилия (пациента)",
        "id_code": "ID код",
        "exam_date": "Дата обследования",
        "age_label_child": "Возраст (ребенка)",
        "age_label_adult": "Возраст (пациента)",
        "age_suffix": "лет",
        "age_months": "мес",
        "age_days": "дн",
        "gender": "Пол",
        "male": "Мужской",
        "female": "Женский",
        "birth_date": "Дата рождения",
        "area_type": "Тип местности",
        "city": "Город",
        "village": "Село",
        "institution": "Учреждение (школа/сад)",
        "address": "Адрес проживания",
        "parents_phone": "Телефон родителей",
        "section_2": "II. Основные антропометрические показатели (стандарты ВОЗ)",
        "unit": "Ед.",
        "value": "Знач.",
        "height": "Длина тела (рост)",
        "weight": "Масса тела",
        "head": "Окружность головы",
        "chest": "Окружность груди",
        "waist": "Окружность талии",
        "sh_len": "Длина плеча",
        "sh_br": "Ширина плеч",
        "sh_circ": "Окружность плеча",
        "arm_elb": "Длина предплечья",
        "hand": "Длина кисти",
        "thigh_len": "Длина бедра",
        "thigh_circ": "Окружность бедра",
        "calf_len": "Длина голени",
        "calf_circ": "Окружность голени",
        "foot": "Длина стопы",
        "body_len": "Длина туловища",
        "section_3": "III. Расчетные антропометрические индексы",
        "eval": "Оценка",
        "bmi_label": "ИМТ (кг/м²)",
        "height_age_z": "Рост-возраст Z-score",
        "weight_age_z": "Вес-возраст Z-score",
        "bmi_age_z": "ИМТ-возраст Z-score",
        "centile": "Центильный интервал",
        "corridor": "Коридор здоровья",
        "hmai_label": "HMAI (адаптация)",
        "mii_label": "MII (интеграция)",
        "adi_label": "ADI (диспропорция)",
        "mcri_label": "MCRI (Риск индекс)",
        "body_len_z": "Длина тул. Z-score",
        "section_4": "IV. Результаты биоимпедансного анализа",
        "norm": "Норма",
        "tbw": "Общая вода (TBW)",
        "fm_p": "Жировая ткань (%)",
        "fm_kg": "Жировая масса (кг)",
        "muscle": "Мышечная масса",
        "bone": "Костная масса",
        "acm": "Активная клеточная масса (ACM)",
        "visceral": "Уровень висцерального жира",
        "section_5": "V. Морфологическая и биологическая оценка",
        "dev_level": "Уровень физического развития",
        "age_matches": "Соответствует возрасту",
        "behind": "Отстает",
        "ahead": "Опережает",
        "morph_type": "Морфологический тип",
        "bio_age_match": "Соотв. биол. возрасту",
        "secular": "Признаки секулярного тренда",
        "section_6": "VI. Этическое согласие и подписи:",
        "parent": "Родитель (опекун)",
        "nurse": "Медсестра (учреждение)",
        "specialists": "Специалист 1 / Специалист 2",
        "consultant": "Консультант",
        "sig_date": "Подпись / Дата",
        "doctor_parent": "Специалист / Родитель",
        "astenik": "Астеник",
        "normostenik": "Нормостеник",
        "giperstenik": "Гиперстеник",
        "mos": "Соответствует",
        "mos_emas": "Не соответствует",
        "mavjud": "Есть",
        "yoq": "Нет",
        "cm": "см",
        "kg": "кг",
    },
    "tg": {
        "title_child": "АНКЕТАИ МУОИНАИ БИОИМПЕДАНСӢ ВА + АНТРОПОМЕТРИИ\nКӮДАКОНИ СИННИ ТОМАКТАБӢ",
        "title_pupil": "АНКЕТАИ МУОИНАИ БИОИМПЕДАНСӢ ВА + АНТРОПОМЕТРИИ\nКӮДАКОНИ СИННИ МАКТАБӢ ВА НАВРАСОН",
        "title_adult": "АНКЕТАИ МУОИНАИ АНТРОПОМЕТРӢ ВА ТАҲЛИЛИ БИОИМПЕДАНСӢ",
        "section_1": "I. Маълумоти умумӣ",
        "no": "№",
        "indicator": "Нишондиҳанда",
        "data_col": "Маълумот",
        "name_label_child": "Ном ва насаб (кӯдак)",
        "name_label_adult": "Ном ва насаб (бемор)",
        "id_code": "Рамзи ID",
        "exam_date": "Санаи муоина",
        "age_label_child": "Синну сол (кӯдак)",
        "age_label_adult": "Синну сол (бемор)",
        "age_suffix": "сол",
        "age_months": "моҳ",
        "age_days": "рӯз",
        "gender": "Ҷинс",
        "male": "Писар",
        "female": "Духтар",
        "birth_date": "Санаи таваллуд",
        "area_type": "Навъи ҳудуд",
        "city": "Шаҳр",
        "village": "Деҳа",
        "institution": "Муассиса (мактаб/кӯдакистон)",
        "address": "Суроғаи зист",
        "parents_phone": "Телефони волидон",
        "section_2": "II. Нишондиҳандаҳои асосии антропометрӣ (Стандартҳои ТУТ)",
        "unit": "В.ч.",
        "value": "Қимат",
        "height": "Қад (дарозии бадан)",
        "weight": "Вазни бадан",
        "head": "Даври сар",
        "chest": "Даври қафаси сина",
        "waist": "Даври камар",
        "sh_len": "Дарозии китф",
        "sh_br": "Бари китф",
        "sh_circ": "Даври китф",
        "arm_elb": "Дарозии бозу",
        "hand": "Дарозии панҷаи даст",
        "thigh_len": "Дарозии рон",
        "thigh_circ": "Даври рон",
        "calf_len": "Дарозии соқ",
        "calf_circ": "Даври соқ",
        "foot": "Дарозии панҷаи пой",
        "body_len": "Дарозии тана",
        "section_3": "III. Индексҳои ҳисобшудаи антропометрӣ",
        "eval": "Баҳодиҳӣ",
        "bmi_label": "ИМБ (кг/м²)",
        "height_age_z": "Қад-синну сол Z-score",
        "weight_age_z": "Вазн-синну сол Z-score",
        "bmi_age_z": "ИМБ-синну сол Z-score",
        "centile": "Интервали сентилӣ",
        "corridor": "Роҳрави саломатӣ",
        "hmai_label": "HMAI (мутобиқшавӣ)",
        "mii_label": "MII (интегратсия)",
        "adi_label": "ADI (номутаносибӣ)",
        "mcri_label": "MCRI (Индекси хавф)",
        "body_len_z": "Дарозии тана Z-score",
        "section_4": "IV. Натиҷаҳои таҳлили биоимпедансӣ",
        "norm": "Меъёр",
        "tbw": "Оби умумӣ (TBW)",
        "fm_p": "Бофтаи чарб (%)",
        "fm_kg": "Массаи чарб (кг)",
        "muscle": "Массаи мушак",
        "bone": "Массаи устухон",
        "acm": "Массаи фаъоли ҳуҷайравӣ (ACM)",
        "visceral": "Сатҳи чарби витсералӣ",
        "section_5": "V. Баҳодиҳии морфологӣ ва биологӣ",
        "dev_level": "Сатҳи рушди ҷисмонӣ",
        "age_matches": "Ба синну сол мувофиқ",
        "behind": "Ақибмонда",
        "ahead": "Пешрафта",
        "morph_type": "Навъи морфологӣ",
        "bio_age_match": "Мувофиқат ба синни биологӣ",
        "secular": "Нишонаҳои тамоюли секулярӣ",
        "section_6": "VI. Розигии этикӣ ва имзоҳо:",
        "parent": "Волидайн (ё васӣ)",
        "nurse": "Ҳамшираи тиббӣ (муассиса)",
        "specialists": "Мутахассис 1 / Мутахассис 2",
        "consultant": "Мушовир",
        "sig_date": "Имзо / Сана",
        "doctor_parent": "Мутахассис / Волидайн",
        "astenik": "Астеник",
        "normostenik": "Нормостеник",
        "giperstenik": "Гиперстеник",
        "mos": "Мувофиқ",
        "mos_emas": "Номувофиқ",
        "cm": "см",
        "kg": "кг",
    },
    "en": {
        "title_child": "BIOIMPEDANCE + ANTHROPOMETRIC EXAMINATION FORM\nFOR PRE-SCHOOL CHILDREN",
        "title_pupil": "BIOIMPEDANCE + ANTHROPOMETRIC EXAMINATION FORM\nFOR SCHOOLCHILDREN AND ADOLESCENTS",
        "title_adult": "ANTHROPOMETRIC EXAMINATION AND BIOIMPEDANCE ANALYSIS FORM",
        "section_1": "I. General Information",
        "no": "№",
        "indicator": "Indicator",
        "data_col": "Data",
        "name_label_child": "Name and Surname (child)",
        "name_label_adult": "Name and Surname (patient)",
        "id_code": "ID Code",
        "exam_date": "Examination Date",
        "age_label_child": "Age (child)",
        "age_label_adult": "Age (patient)",
        "age_suffix": "years",
        "age_months": "mo",
        "age_days": "days",
        "gender": "Gender",
        "male": "Male",
        "female": "Female",
        "birth_date": "Date of Birth",
        "area_type": "Area Type",
        "city": "City",
        "village": "Village",
        "institution": "Institution (school/nursery)",
        "address": "Residential Address",
        "parents_phone": "Parents' phone",
        "section_2": "II. Basic Anthropometric Indicators (WHO Standards)",
        "unit": "Unit",
        "value": "Value",
        "height": "Height",
        "weight": "Body Weight",
        "head": "Head Circumference",
        "chest": "Chest Circumference",
        "waist": "Waist Circumference",
        "sh_len": "Shoulder Length",
        "sh_br": "Shoulder Breadth",
        "sh_circ": "Shoulder Circumference",
        "arm_elb": "Forearm Length",
        "hand": "Hand Length",
        "thigh_len": "Thigh Length",
        "thigh_circ": "Thigh Circumference",
        "calf_len": "Calf Length",
        "calf_circ": "Calf Circumference",
        "foot": "Foot Length",
        "body_len": "Trunk Length",
        "section_3": "III. Calculated Anthropometric Indices",
        "eval": "Evaluation",
        "bmi_label": "BMI (kg/m²)",
        "height_age_z": "Height-for-age Z-score",
        "weight_age_z": "Weight-for-age Z-score",
        "bmi_age_z": "BMI-for-age Z-score",
        "centile": "Centile Interval",
        "corridor": "Health Corridor",
        "hmai_label": "HMAI (adaptation)",
        "mii_label": "MII (integration)",
        "adi_label": "ADI (disharmony)",
        "mcri_label": "MCRI (Risk index)",
        "body_len_z": "Trunk-len. Z-score",
        "section_4": "IV. Bioimpedance Analysis Results",
        "norm": "Normal Range",
        "tbw": "Total Body Water (TBW)",
        "fm_p": "Fat Mass (%)",
        "fm_kg": "Fat Mass (kg)",
        "muscle": "Muscle Mass",
        "bone": "Bone Mass",
        "acm": "Active Cell Mass (ACM)",
        "visceral": "Visceral Fat Level",
        "section_5": "V. Morphological and Biological Assessment",
        "dev_level": "Level of Physical Development",
        "age_matches": "Age-appropriate",
        "behind": "Behind",
        "ahead": "Ahead",
        "morph_type": "Morphological Type",
        "bio_age_match": "Biological Age Match",
        "secular": "Secular Trend Signs",
        "section_6": "VI. Ethical Consent and Signatures:",
        "parent": "Parent (guardian)",
        "nurse": "Nurse (institution)",
        "specialists": "Specialist 1 / Specialist 2",
        "consultant": "Consultant",
        "sig_date": "Signature / Date",
        "doctor_parent": "Specialist / Parent",
        "astenik": "Asthenic",
        "normostenik": "Normosthenic",
        "giperstenik": "Hypersthenic",
        "mos": "Matches",
        "mos_emas": "Does not match",
        "mavjud": "Present",
        "yoq": "Absent",
        "cm": "sm",
        "kg": "kg",
    },
    "kz": {
        "title_child": "МЕКТЕПКЕ ДЕЙІНГІ ЖАСТАҒЫ БАЛАЛАРҒА АРНАЛҒАН\nБИОИМПЕДАНС + АНТРОПОМЕТРИЯЛЫҚ ТЕКСЕРУ АНКЕТАСЫ",
        "title_pupil": "МЕКТЕП ЖАСТАҒЫ БАЛАЛАР МЕН ЖАСӨСПІРІМДЕРГЕ АРНАЛҒАН\nБИОИМПЕДАНС + АНТРОПОМЕТРИЯЛЫҚ ТЕКСЕРУ АНКЕТАСЫ",
        "title_adult": "АНТРОПОМЕТРИЯЛЫҚ ТЕКСЕРУ ЖӘНЕ БИОИМПЕДАНС ТАЛДАУ АНКЕТАСЫ",
        "section_1": "I. Жалпы мәліметтер",
        "no": "№",
        "indicator": "Көрсеткіш",
        "data_col": "Мәлімет",
        "name_label_child": "Аты-жөні (баланың)",
        "name_label_adult": "Аты-жөні (науқастың)",
        "id_code": "ID код",
        "exam_date": "Тексеру күні",
        "age_label_child": "Жасы (баланың)",
        "age_label_adult": "Жасы (науқастың)",
        "age_suffix": "жас",
        "age_months": "ай",
        "age_days": "күн",
        "gender": "Жынысы",
        "male": "Ер",
        "female": "Қыз",
        "birth_date": "Туған күні",
        "area_type": "Аймақ түрі",
        "city": "Қала",
        "village": "Ауыл",
        "institution": "Мекеме (мектеп/бақша)",
        "address": "Тұрғылықты мекен-жайы",
        "parents_phone": "Ата-ана телефоны",
        "section_2": "II. Негізгі антропометриялық көрсеткіштер (ДДСҰ стандарттары)",
        "unit": "Өлш.б.",
        "value": "Мән",
        "height": "Бой ұзындығы",
        "weight": "Дене салмағы",
        "head": "Бас айналымы",
        "chest": "Кеуде айналымы",
        "waist": "Бел айналымы",
        "sh_len": "Иық ұзындығы",
        "sh_br": "Иық ені",
        "sh_circ": "Иық айналымы",
        "arm_elb": "Білек ұзындығы",
        "hand": "Қол басының ұзындығы",
        "thigh_len": "Сан ұзындығы",
        "thigh_circ": "Сан айналымы",
        "calf_len": "Балтыр ұзындығы",
        "calf_circ": "Балтыр айналымы",
        "foot": "Аяқ басының ұзындығы",
        "body_len": "Дене ұзындығы",
        "section_3": "III. Есептелген антропометриялық индекстер",
        "eval": "Бағалау",
        "bmi_label": "ДМИ (кг/м²)",
        "height_age_z": "Бой-жас Z-score",
        "weight_age_z": "Салмақ-жас Z-score",
        "bmi_age_z": "ДМИ-жас Z-score",
        "centile": "Центильдік интервал",
        "corridor": "Денсаулық дәлізі",
        "hmai_label": "HMAI (бейімделу)",
        "mii_label": "MII (интеграция)",
        "adi_label": "ADI (үйлесімсіздік)",
        "mcri_label": "MCRI (Қауіп индексі)",
        "body_len_z": "Дене ұз. Z-score",
        "section_4": "IV. Биоимпеданс талдауының нәтижелері",
        "norm": "Норма",
        "tbw": "Жалпы су (TBW)",
        "fm_p": "Май тіні (%)",
        "fm_kg": "Май массасы (кг)",
        "muscle": "Бұлшық ет массасы",
        "bone": "Сүйек массасы",
        "acm": "Белсенді жасуша массасы (ACM)",
        "visceral": "Висцеральды май деңгейі",
        "section_5": "V. Морфологиялық және биологиялық бағалау",
        "dev_level": "Дене дамуының деңгейі",
        "age_matches": "Жасына сәйкес",
        "behind": "Қалып қойған",
        "ahead": "Озық",
        "morph_type": "Морфологиялық типі",
        "bio_age_match": "Биол. жасқа сәйкестігі",
        "secular": "Секулярлы тренд белгілері",
        "astenik": "Астеник",
        "normostenik": "Нормостеник",
        "giperstenik": "Гиперстеник",
        "mos": "Сәйкес",
        "mos_emas": "Сәйкес емес",
        "mavjud": "Бар",
        "yoq": "Жоқ",
        "section_6": "VI. Этикалық келісім және қолтаңбалар:",
        "parent": "Ата-ана (немесе қамқоршы)",
        "nurse": "Медбике (мекеме)",
        "specialists": "Маман 1 / Маман 2",
        "consultant": "Консультант",
        "sig_date": "Қолтаңба / Күні",
        "doctor_parent": "Маман / Ата-ана",
    },
}


# ---------------------------------------------------------------------------
# Kalit nomi normalizator (camelCase → snake_case)
# ---------------------------------------------------------------------------


def _to_snake(name: str) -> str:
    """'examinationDate' → 'examination_date'"""
    s = re.sub(r"([A-Z])", r"_\1", name).lower().lstrip("_")
    return s


def _normalize_data(raw: dict) -> dict:
    """
    Barcha camelCase kalitlarni snake_case ga o'tkazadi va ikkala versiyani
    saqlaydi, shu tariqa har qanday tartibdan kelgan ma'lumotni qabul qiladi.
    """
    result = {}
    for k, v in raw.items():
        result[k] = v  # original (camelCase yoki snake_case)
        snake = _to_snake(k)
        if snake != k:
            result[snake] = v  # snake_case varianti ham qo'shiladi
    return result


def _val(data: dict, snake_key: str, default: str = "") -> str:
    """snake_key bo'yicha qiymat olади (camelCase fallback bilan)."""
    # 1) Snake_case
    if snake_key in data and data[snake_key] not in (None, ""):
        return str(data[snake_key])
    # 2) Oddiy lookup (allaqachon normalize bo'lgan bo'lishi mumkin)
    if default != "":
        return str(data.get(snake_key, default))
    return str(data.get(snake_key, ""))


# ---------------------------------------------------------------------------
# Centil va sog'lomlik yo'lagi hisoblash
# ---------------------------------------------------------------------------

# Soddalashtirilgan BMI-for-age referans jadvali (WHO, bolalar uchun)
# Format: age (yil) → [P3, P15, P50, P85, P97]  erkak uchun (qizlar uchun ≈ bir xil)
_BMI_CENTILE_BOYS = {
    2: [13.4, 14.4, 16.0, 17.8, 19.7],
    3: [13.1, 14.0, 15.5, 17.2, 18.9],
    4: [12.8, 13.7, 15.2, 16.8, 18.5],
    5: [12.7, 13.6, 15.1, 16.8, 18.6],
    6: [12.7, 13.6, 15.2, 17.0, 19.1],
    7: [12.7, 13.7, 15.4, 17.4, 19.8],
    8: [12.8, 13.9, 15.7, 17.9, 20.6],
    9: [13.0, 14.1, 16.1, 18.5, 21.5],
    10: [13.2, 14.4, 16.5, 19.1, 22.4],
    11: [13.5, 14.8, 17.1, 19.8, 23.3],
    12: [13.9, 15.2, 17.7, 20.5, 24.1],
    13: [14.3, 15.7, 18.2, 21.1, 24.8],
    14: [14.8, 16.2, 18.8, 21.8, 25.4],
    15: [15.3, 16.7, 19.2, 22.4, 26.0],
    16: [15.7, 17.2, 19.7, 22.9, 26.5],
    17: [16.1, 17.6, 20.1, 23.3, 26.9],
    18: [16.4, 17.9, 20.5, 23.7, 27.3],
}

_BMI_CENTILE_GIRLS = {
    2: [13.3, 14.2, 15.7, 17.4, 19.2],
    3: [13.0, 13.9, 15.4, 17.1, 18.9],
    4: [12.7, 13.6, 15.2, 16.9, 18.8],
    5: [12.6, 13.6, 15.2, 17.0, 19.1],
    6: [12.6, 13.6, 15.3, 17.3, 19.6],
    7: [12.7, 13.7, 15.5, 17.7, 20.2],
    8: [12.8, 13.9, 15.8, 18.2, 20.9],
    9: [13.0, 14.2, 16.2, 18.7, 21.6],
    10: [13.2, 14.5, 16.6, 19.3, 22.3],
    11: [13.5, 14.9, 17.1, 19.9, 23.0],
    12: [13.9, 15.3, 17.6, 20.5, 23.8],
    13: [14.3, 15.8, 18.1, 21.1, 24.5],
    14: [14.7, 16.2, 18.6, 21.7, 25.1],
    15: [15.1, 16.7, 19.1, 22.2, 25.6],
    16: [15.5, 17.1, 19.5, 22.6, 26.1],
    17: [15.9, 17.5, 19.9, 23.0, 26.5],
    18: [16.2, 17.8, 20.2, 23.4, 26.9],
}


def _calc_centile(bmi: float, age: int, gender: str) -> str:
    """BMI, yosh va jinsga qarab sentil intervalini hisoblaydi."""
    if not bmi or age < 2 or age > 18:
        return ""
    gender = (gender or "").lower()
    table = (
        _BMI_CENTILE_GIRLS
        if ("ayol" in gender or "qiz" in gender or "girl" in gender)
        else _BMI_CENTILE_BOYS
    )
    age_key = min(max(age, 2), 18)
    refs = table.get(
        age_key, table.get(min(table.keys(), key=lambda x: abs(x - age_key)))
    )
    if not refs:
        return ""
    p3, p15, p50, p85, p97 = refs
    if bmi < p3:
        return "< 3"
    elif bmi < p15:
        return "3 – 15"
    elif bmi < p50:
        return "15 – 50"
    elif bmi < p85:
        return "50 – 85"
    elif bmi < p97:
        return "85 – 97"
    else:
        return "> 97"


def _calc_health_corridor(bmi: float, age: int, gender: str) -> str:
    """Sog'lomlik yo'lagini aniqlaydi."""
    if not bmi or age < 2 or age > 18:
        return ""
    gender = (gender or "").lower()
    table = (
        _BMI_CENTILE_GIRLS
        if ("ayol" in gender or "qiz" in gender)
        else _BMI_CENTILE_BOYS
    )
    age_key = min(max(age, 2), 18)
    refs = table.get(
        age_key, table.get(min(table.keys(), key=lambda x: abs(x - age_key)))
    )
    if not refs:
        return ""
    p3, p15, p50, p85, p97 = refs
    if bmi < p3:
        return "Жуда кам вазн (< 3-sentil)"
    elif bmi < p15:
        return "Кам вазн (3–15-sentil)"
    elif bmi < p85:
        return "Меъёр (15–85-sentil)"
    elif bmi < p97:
        return "Ортиқча вазн (85–97-sentil)"
    else:
        return "Семизлик (> 97-sentil)"


def _dev_level(z_score_raw) -> tuple:
    """
    Z-score asosida jismoniy rivojlanish darajasini aniqlaydi.
    Qaytaradi: (yoshga_mos: bool, orqada: bool, oldinda: bool)
    """
    try:
        z = float(z_score_raw)
    except (TypeError, ValueError):
        return (True, False, False)  # default: yoshga mos

    if z < -2.0:
        return (False, True, False)  # Orqada qolgan
    elif z > 2.0:
        return (False, False, True)  # Oldinda
    else:
        return (True, False, False)  # Yoshga mos


# ---------------------------------------------------------------------------
# Z-score baholash matni (4 tilda)
# ---------------------------------------------------------------------------

DOCX_LABELS["ky"] = {
    **DOCX_LABELS["uz"],
    "title_child": "МЕКТЕПКЕ ЧЕЙИНКИ ЖАШТАГЫ БАЛДАР ҮЧҮН БИОИМПЕДАНС +\nАНТРОПОМЕТРИЯЛЫК ТЕКШЕРҮҮ АНКЕТАСЫ",
    "title_pupil": "МЕКТЕП ЖАШЫНДАГЫ БАЛДАР ЖАНА ӨСПҮРҮМДӨР ҮЧҮН БИОИМПЕДАНС +\nАНТРОПОМЕТРИЯЛЫК ТЕКШЕРҮҮ АНКЕТАСЫ",
    "title_adult": "АНТРОПОМЕТРИЯЛЫК ТЕКШЕРҮҮ ЖАНА БИОИМПЕДАНС ТАЛДОО АНКЕТАСЫ",
    "section_1": "I. Жалпы маалыматтар",
    "indicator": "Көрсөткүч",
    "data_col": "Маалымат",
    "name_label_child": "Аты-жөнү (баланын)",
    "name_label_adult": "Аты-жөнү (бейтаптын)",
    "exam_date": "Текшерүү күнү",
    "age_label_child": "Жашы (баланын)",
    "age_label_adult": "Жашы (бейтаптын)",
    "age_suffix": "жаш",
    "age_months": "ай",
    "age_days": "күн",
    "gender": "Жынысы",
    "male": "Эркек",
    "female": "Аял",
    "birth_date": "Туулган күнү",
    "city": "Шаар",
    "village": "Айыл",
    "institution": "Мекеме (мектеп/бакча)",
    "address": "Жашаган дареги",
    "parents_phone": "Ата-эне телефону",
    "section_2": "II. Негизги антропометриялык көрсөткүчтөр (ДССУ стандарттары)",
    "unit": "Бирдик",
    "value": "Маани",
    "height": "Бой узундугу",
    "weight": "Дене салмагы",
    "head": "Баш айланасы",
    "chest": "Көкүрөк айланасы",
    "waist": "Бел айланасы",
    "sh_len": "Ийин узундугу",
    "sh_br": "Ийин кеңдиги",
    "sh_circ": "Ийин айланасы",
    "arm_elb": "Билек узундугу",
    "hand": "Кол манжа узундугу",
    "thigh_len": "Сан узундугу",
    "thigh_circ": "Сан айланасы",
    "calf_len": "Балтыр узундугу",
    "calf_circ": "Балтыр айланасы",
    "foot": "Таман узундугу",
    "body_len": "Дене узундугу",
    "section_3": "III. Эсептелген антропометриялык индекстер",
    "eval": "Баалоо",
    "bmi_label": "BMI (кг/м²)",
    "height_age_z": "Бой-жаш Z-score",
    "weight_age_z": "Салмак-жаш Z-score",
    "bmi_age_z": "BMI-жаш Z-score",
    "centile": "Центиль аралыгы",
    "corridor": "Ден соолук коридору",
    "hmai_label": "HMAI (ыңгайлашуу)",
    "adi_label": "ADI (дисбаланс)",
    "mcri_label": "MCRI (коркунуч индекси)",
    "body_len_z": "Дене уз. Z-score",
    "section_4": "IV. Биоимпеданс талдоосунун жыйынтыктары",
    "norm": "Норма",
    "tbw": "Жалпы суу (TBW)",
    "fm_p": "Май тканы (%)",
    "fm_kg": "Май массасы (кг)",
    "muscle": "Булчуң массасы",
    "bone": "Сөөк массасы",
    "acm": "Активдүү клетка массасы (ACM)",
    "visceral": "Висцералдык май деңгээли",
    "section_5": "V. Морфологиялык жана биологиялык баалоо",
    "dev_level": "Физикалык өнүгүү деңгээли",
    "age_matches": "Жашына туура келет",
    "behind": "Артта калган",
    "ahead": "Алдыда",
    "morph_type": "Морфологиялык тиби",
    "bio_age_match": "Биологиялык жашына туура келиши",
    "secular": "Секулярдык тренд белгилери",
    "astenik": "Астеник",
    "normostenik": "Нормостеник",
    "giperstenik": "Гиперстеник",
    "mos": "Туура келет",
    "mos_emas": "Туура келбейт",
    "mavjud": "Бар",
    "yoq": "Жок",
    "section_6": "VI. Этикалык макулдук жана колдор:",
    "parent": "Ата-эне (камкорчу)",
    "nurse": "Медайым (мекеме)",
    "specialists": "Адис 1 / Адис 2",
    "sig_date": "Кол / дата",
    "doctor_parent": "Адис / ата-эне",
    "cm": "см",
    "kg": "кг",
    "no": "Катар №",
    "id_code": "ID код",
    "area_type": "Аймак түрү",
    "mii_label": "MII (интеграция индекси)",
    "consultant": "Кеңешчи",
}
DOCX_LABELS["tg"] = {
    **DOCX_LABELS["uz"],
    "title_child": "ШАКЛИ МУОИНАИ БИОИМПЕДАНС +\nАНТРОПОМЕТРӢ БАРОИ КӮДАКОНИ СИННИ ТОМАКТАБӢ",
    "title_pupil": "ШАКЛИ МУОИНАИ БИОИМПЕДАНС +\nАНТРОПОМЕТРӢ БАРОИ МАКТАББАЧАГОН ВА НАВРАСОН",
    "title_adult": "ШАКЛИ МУОИНАИ АНТРОПОМЕТРӢ ВА ТАҲЛИЛИ БИОИМПЕДАНС",
    "section_1": "I. Маълумоти умумӣ",
    "no": "№",
    "indicator": "Нишондиҳанда",
    "data_col": "Маълумот",
    "name_label_child": "Ному насаб (кӯдак)",
    "name_label_adult": "Ному насаб (бемор)",
    "id_code": "ID код",
    "exam_date": "Санаи муоина",
    "age_label_child": "Синну сол (кӯдак)",
    "age_label_adult": "Синну сол (бемор)",
    "age_suffix": "сол",
    "age_months": "моҳ",
    "age_days": "рӯз",
    "gender": "Ҷинс",
    "male": "Писар",
    "female": "Духтар",
    "birth_date": "Санаи таваллуд",
    "area_type": "Навъи ҳудуд",
    "city": "Шаҳр",
    "village": "Деҳа",
    "institution": "Муассиса (мактаб/боғча)",
    "address": "Суроғаи истиқомат",
    "parents_phone": "Телефони волидон",
    "section_2": "II. Нишондиҳандаҳои асосии антропометрӣ (стандартҳои ТУТ)",
    "unit": "Воҳид",
    "value": "Қимат",
    "height": "Дарозии бадан (қад)",
    "weight": "Вазни бадан",
    "head": "Даври сар",
    "chest": "Даври қафаси сина",
    "waist": "Даври миён",
    "sh_len": "Дарозии китф",
    "sh_br": "Паҳнои китф",
    "sh_circ": "Даври китф",
    "arm_elb": "Дарозии бозу",
    "hand": "Дарозии панҷа",
    "thigh_len": "Дарозии рон",
    "thigh_circ": "Даври рон",
    "calf_len": "Дарозии соқ",
    "calf_circ": "Даври соқ",
    "foot": "Дарозии пойпанҷа",
    "body_len": "Дарозии бадан",
    "section_3": "III. Индексҳои ҳисобшудаи антропометрӣ",
    "eval": "Арзёбӣ",
    "bmi_label": "BMI (кг/м²)",
    "height_age_z": "Қад-синну сол Z-score",
    "weight_age_z": "Вазн-синну сол Z-score",
    "bmi_age_z": "BMI-синну сол Z-score",
    "centile": "Интервали сентилӣ",
    "corridor": "Коридори саломатӣ",
    "hmai_label": "HMAI (мутобиқшавӣ)",
    "mii_label": "MII (интегратсия)",
    "adi_label": "ADI (номувофиқатӣ)",
    "mcri_label": "MCRI (индекси хавф)",
    "body_len_z": "Дарозии бадан Z-score",
    "section_4": "IV. Натиҷаҳои таҳлили биоимпеданс",
    "norm": "Меъёр",
    "tbw": "Оби умумии бадан (TBW)",
    "fm_p": "Массаи равған (%)",
    "fm_kg": "Массаи равған (кг)",
    "muscle": "Массаи мушак",
    "bone": "Массаи устухон",
    "acm": "Массаи ҳуҷайраи фаъол (ACM)",
    "visceral": "Сатҳи равғани виссералӣ",
    "section_5": "V. Арзёбии морфологӣ ва биологӣ",
    "dev_level": "Сатҳи рушди ҷисмонӣ",
    "age_matches": "Ба синну сол мувофиқ",
    "behind": "Қафомонда",
    "ahead": "Пешрафта",
    "morph_type": "Навъи морфологӣ",
    "bio_age_match": "Мувофиқати синни биологӣ",
    "secular": "Аломатҳои тренди секулярӣ",
    "section_6": "VI. Розигии этикӣ ва имзоҳо:",
    "parent": "Волид (ё васӣ)",
    "nurse": "Ҳамшираи тиббӣ (муассиса)",
    "specialists": "Мутахассис 1 / Мутахассис 2",
    "consultant": "Мушовир",
    "sig_date": "Имзо / Сана",
    "doctor_parent": "Мутахассис / Волид",
    "astenik": "Астеник",
    "normostenik": "Нормостеник",
    "giperstenik": "Гиперстеник",
    "mos": "Мувофиқ",
    "mos_emas": "Мувофиқ нест",
    "mavjud": "Мавҷуд",
    "yoq": "Нест",
    "cm": "см",
    "kg": "кг",
}

DOCX_LABELS["tr"] = {
    **DOCX_LABELS["en"],
    "title_child": "OKUL ONCESI COCUKLAR ICIN BIOEMPEDANS +\nANTROPOMETRIK MUAYENE FORMU",
    "title_pupil": "OKUL CAGI COCUKLAR VE ERGENLER ICIN BIOEMPEDANS +\nANTROPOMETRIK MUAYENE FORMU",
    "title_adult": "ANTROPOMETRIK MUAYENE VE BIOEMPEDANS ANALIZ FORMU",
    "section_1": "I. Genel bilgiler",
    "no": "No",
    "indicator": "Gosterge",
    "data_col": "Veri",
    "name_label_child": "Ad ve Soyad (cocugun)",
    "name_label_adult": "Ad ve Soyad (hastanin)",
    "id_code": "ID kodu",
    "exam_date": "Muayene tarihi",
    "age_label_child": "Yas (cocugun)",
    "age_label_adult": "Yas (hastanin)",
    "age_suffix": "yil",
    "age_months": "ay",
    "age_days": "gun",
    "gender": "Cinsiyet",
    "male": "Erkek",
    "female": "Kiz",
    "birth_date": "Dogum tarihi",
    "area_type": "Bolge turu",
    "city": "Sehir",
    "village": "Koy",
    "institution": "Kurum (okul/anaokulu)",
    "address": "Ikamet adresi",
    "parents_phone": "Ebeveyn telefonu",
    "section_2": "II. Temel antropometrik gostergeler (DSO standartlari)",
    "unit": "Birim",
    "value": "Deger",
    "height": "Boy uzunlugu",
    "weight": "Vucut agirligi",
    "head": "Bas cevresi",
    "chest": "Gogus cevresi",
    "waist": "Bel cevresi",
    "sh_len": "Omuz uzunlugu",
    "sh_br": "Omuz genisligi",
    "sh_circ": "Omuz cevresi",
    "arm_elb": "On kol uzunlugu",
    "hand": "El uzunlugu",
    "thigh_len": "Uyluk uzunlugu",
    "thigh_circ": "Uyluk cevresi",
    "calf_len": "Baldir uzunlugu",
    "calf_circ": "Baldir cevresi",
    "foot": "Ayak uzunlugu",
    "body_len": "Govde uzunlugu",
    "section_3": "III. Hesaplanan antropometrik indeksler",
    "eval": "Degerlendirme",
    "bmi_label": "VKI (kg/m²)",
    "height_age_z": "Boy-yas Z-skoru",
    "weight_age_z": "Agirlik-yas Z-skoru",
    "bmi_age_z": "VKI-yas Z-skoru",
    "centile": "Santil araligi",
    "corridor": "Saglik koridoru",
    "hmai_label": "HMAI (uyum)",
    "mii_label": "MII (entegrasyon)",
    "adi_label": "ADI (uyumsuzluk)",
    "mcri_label": "MCRI (Risk indeksi)",
    "body_len_z": "Govde uzunlugu Z-skoru",
    "section_4": "IV. Bioempedans analiz sonuclari",
    "norm": "Normal aralik",
    "tbw": "Toplam vucut suyu (TBW)",
    "fm_p": "Yag dokusu (%)",
    "fm_kg": "Yag kutlesi (kg)",
    "muscle": "Kas kutlesi",
    "bone": "Kemik kutlesi",
    "acm": "Aktif hucre kutlesi (ACM)",
    "visceral": "Visseral yag duzeyi",
    "section_5": "V. Morfolojik ve biyolojik degerlendirme",
    "dev_level": "Fiziksel gelisim duzeyi",
    "age_matches": "Yasa uygun",
    "behind": "Geride",
    "ahead": "Ileride",
    "morph_type": "Morfolojik tip",
    "bio_age_match": "Biyolojik yasa uygunluk",
    "secular": "Sekuler trend isaretleri",
    "section_6": "VI. Etik onay ve imzalar:",
    "parent": "Ebeveyn (veli)",
    "nurse": "Hemsire (kurum)",
    "specialists": "Uzman 1 / Uzman 2",
    "consultant": "Danisман",
    "sig_date": "Imza / Tarih",
    "doctor_parent": "Uzman / Ebeveyn",
    "astenik": "Astenik",
    "normostenik": "Normostenik",
    "giperstenik": "Hiperstenik",
    "mos": "Uygun",
    "mos_emas": "Uygun degil",
    "mavjud": "Var",
    "yoq": "Yok",
    "cm": "cm",
    "kg": "kg",
}


_Z_EVAL_LABELS = {
    "uz": {
        "very_low": "Жуда паст (< -2 SD)",
        "low": "Паст (-2 … -1 SD)",
        "normal": "Меъёрда (-1 … +1 SD)",
        "high": "Юқори (+1 … +2 SD)",
        "very_high": "Жуда юқори (> +2 SD)",
    },
    "ru": {
        "very_low": "Очень низкий (< -2 SD)",
        "low": "Низкий (-2 … -1 SD)",
        "normal": "Норма (-1 … +1 SD)",
        "high": "Высокий (+1 … +2 SD)",
        "very_high": "Очень высокий (> +2 SD)",
    },
    "en": {
        "very_low": "Very low (< -2 SD)",
        "low": "Low (-2 … -1 SD)",
        "normal": "Normal (-1 … +1 SD)",
        "high": "High (+1 … +2 SD)",
        "very_high": "Very high (> +2 SD)",
    },
    "kz": {
        "very_low": "Өте төмен (< -2 SD)",
        "low": "Төмен (-2 … -1 SD)",
        "normal": "Норма (-1 … +1 SD)",
        "high": "Жоғары (+1 … +2 SD)",
        "very_high": "Өте жоғары (> +2 SD)",
    },
    "ky": {
        "very_low": "Өтө төмөн (< -2 SD)",
        "low": "Төмөн (-2 … -1 SD)",
        "normal": "Нормада (-1 … +1 SD)",
        "high": "Жогору (+1 … +2 SD)",
        "very_high": "Өтө жогору (> +2 SD)",
    },
    "tg": {
        "very_low": "Хеле паст (< -2 SD)",
        "low": "Паст (-2 … -1 SD)",
        "normal": "Меъёр (-1 … +1 SD)",
        "high": "Баланд (+1 … +2 SD)",
        "very_high": "Хеле баланд (> +2 SD)",
    },
    "tr": {
        "very_low": "Cok dusuk (< -2 SD)",
        "low": "Dusuk (-2 … -1 SD)",
        "normal": "Normal (-1 … +1 SD)",
        "high": "Yuksek (+1 … +2 SD)",
        "very_high": "Cok yuksek (> +2 SD)",
    },
    "tm": {
        "very_low": "Gaty pes (< -2 SD)",
        "low": "Pes (-2 … -1 SD)",
        "normal": "Kada (-1 … +1 SD)",
        "high": "Yokary (+1 … +2 SD)",
        "very_high": "Gaty yokary (> +2 SD)",
    },
}


def _z_eval(z_raw, lang: str = "uz") -> str:
    """Z-score qiymatiga qarab baholash matnini qaytaradi."""
    labels = _Z_EVAL_LABELS.get(lang, _Z_EVAL_LABELS["uz"])
    if z_raw in (None, ""):
        return ""
    try:
        z = float(z_raw)
    except (TypeError, ValueError):
        return ""
    if z < -2.0:
        return labels["very_low"]
    elif z < -1.0:
        return labels["low"]
    elif z <= 1.0:
        return labels["normal"]
    elif z <= 2.0:
        return labels["high"]
    else:
        return labels["very_high"]


_CENTILE_EVAL = {
    "uz": {
        "< 3": "Жуда паст (< 3-сентил)",
        "3 - 15": "Паст (3–15-сентил)",
        "15 - 85": "Меъёр (15–85-сентил)",
        "85 - 97": "Юқори (85–97-сентил)",
        "> 97": "Жуда юқори (> 97-сентил)",
    },
    "ru": {
        "< 3": "Очень низкий (< 3-го центиля)",
        "3 - 15": "Низкий (3–15-й центиль)",
        "15 - 85": "Норма (15–85-й центиль)",
        "85 - 97": "Высокий (85–97-й центиль)",
        "> 97": "Очень высокий (> 97-го центиля)",
    },
    "en": {
        "< 3": "Very low (< 3rd centile)",
        "3 - 15": "Low (3rd–15th centile)",
        "15 - 85": "Normal (15th–85th centile)",
        "85 - 97": "High (85th–97th centile)",
        "> 97": "Very high (> 97th centile)",
    },
    "kz": {
        "< 3": "Өте төмен (< 3-центиль)",
        "3 - 15": "Төмен (3–15-центиль)",
        "15 - 85": "Норма (15–85-центиль)",
        "85 - 97": "Жоғары (85–97-центиль)",
        "> 97": "Өте жоғары (> 97-центиль)",
    },
    "ky": {
        "< 3": "Өтө төмөн (< 3-сентиль)",
        "3 - 15": "Төмөн (3-15-сентиль)",
        "15 - 85": "Норма (15-85-сентиль)",
        "85 - 97": "Жогору (85-97-сентиль)",
        "> 97": "Өтө жогору (> 97-сентиль)",
    },
    "tg": {
        "< 3": "Хеле паст (< 3-сентил)",
        "3 - 15": "Паст (3-15-сентил)",
        "15 - 85": "Меъёр (15-85-сентил)",
        "85 - 97": "Баланд (85-97-сентил)",
        "> 97": "Хеле баланд (> 97-сентил)",
    },
    "tr": {
        "< 3": "Cok dusuk (< 3. santil)",
        "3 - 15": "Dusuk (3-15. santil)",
        "15 - 85": "Normal (15-85. santil)",
        "85 - 97": "Yuksek (85-97. santil)",
        "> 97": "Cok yuksek (> 97. santil)",
    },
    "tm": {
        "< 3": "Gaty pes (< 3-sentil)",
        "3 - 15": "Pes (3-15-sentil)",
        "15 - 85": "Kada (15-85-sentil)",
        "85 - 97": "Yokary (85-97-sentil)",
        "> 97": "Gaty yokary (> 97-sentil)",
    },
}


def _centile_eval(centile_str: str, lang: str = "uz") -> str:
    """Centil intervaliga mos baholash matnini qaytaradi."""
    if not centile_str:
        return ""
    table = _CENTILE_EVAL.get(lang, _CENTILE_EVAL["uz"])
    key = centile_str.strip()
    return table.get(key, centile_str)


# ---------------------------------------------------------------------------
# Word formatlashtirish yordamchi funksiyalari
# ---------------------------------------------------------------------------

REPORT_HEADER_FILL = "4AACC0"
REPORT_INDEX_FILL = "46A6BA"
REPORT_ROW_FILL_A = "B7DDE8"
REPORT_ROW_FILL_B = "DDEFF4"
REPORT_BORDER = "FFFFFF"
REPORT_HEADER_TEXT = "FFFFFF"
REPORT_BODY_TEXT = "111111"


def _set_cell_font(
    cell,
    text: str,
    bold: bool = False,
    size: int = 8,
    align=WD_ALIGN_PARAGRAPH.LEFT,
    color: str = REPORT_BODY_TEXT,
):
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    para = cell.paragraphs[0]
    para.alignment = align
    para.clear()
    run = para.add_run("" if text is None else str(text))
    run.bold = bold
    run.font.size = Pt(min(size, 7.5))
    run.font.name = "Times New Roman"
    run.font.color.rgb = _hex_to_rgb(color)
    # Layout optimization: reduce line spacing within cells
    para.paragraph_format.line_spacing = 1.0
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)


def _set_col_width(table, col_idx: int, width_cm: float):
    for cell in table.columns[col_idx].cells:
        cell.width = Cm(width_cm)


def _shade_cell(cell, fill_hex: str = "D9D9D9"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    for existing in tcPr.findall(qn("w:shd")):
        tcPr.remove(existing)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill_hex)
    tcPr.append(shd)


def _hex_to_rgb(hex_color: str):
    from docx.shared import RGBColor

    hex_color = (hex_color or REPORT_BODY_TEXT).lstrip("#")
    return RGBColor(
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
    )


def _set_cell_borders(cell, color: str = REPORT_BORDER, size: str = "6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def _set_cell_margins(
    cell, top: int = 10, start: int = 45, bottom: int = 10, end: int = 45
):
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for margin, value in (
        ("top", top),
        ("start", start),
        ("bottom", bottom),
        ("end", end),
    ):
        element = margins.find(qn(f"w:{margin}"))
        if element is None:
            element = OxmlElement(f"w:{margin}")
            margins.append(element)
        element.set(qn("w:w"), str(value))
        element.set(qn("w:type"), "dxa")


def _set_cell_text_color(cell, color: str, bold=None):
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.color.rgb = _hex_to_rgb(color)
            if bold is not None:
                run.bold = bold


def _style_report_table(table, number_cols=(0,), header_rows: int = 1):
    for row_idx, row in enumerate(table.rows):
        row.height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
        row.height = Cm(0.27)
        for col_idx, cell in enumerate(row.cells):
            _set_cell_borders(cell)
            _set_cell_margins(cell)
            if row_idx < header_rows:
                _shade_cell(cell, REPORT_HEADER_FILL)
                _set_cell_text_color(cell, REPORT_HEADER_TEXT, bold=True)
                continue
            if col_idx in number_cols:
                _shade_cell(cell, REPORT_INDEX_FILL)
                _set_cell_text_color(cell, REPORT_HEADER_TEXT)
            else:
                _shade_cell(
                    cell, REPORT_ROW_FILL_A if row_idx % 2 else REPORT_ROW_FILL_B
                )
                _set_cell_text_color(cell, REPORT_BODY_TEXT)


def _set_table_full_width(table):
    table.autofit = True
    tblPr = table._element.xpath("w:tblPr")
    if tblPr:
        tblW = tblPr[0].xpath("w:tblW")
        if not tblW:
            tblW = OxmlElement("w:tblW")
            tblPr[0].append(tblW)
        else:
            tblW = tblW[0]
        tblW.set(qn("w:w"), "5000")
        tblW.set(qn("w:type"), "pct")


def _add_bold_centered_title(doc, text: str, size: int = 11) -> None:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(min(size, 9.5))
    run.font.name = "Times New Roman"


def _section_head_paragraph(doc, text: str) -> None:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(8)
    run.font.name = "Times New Roman"
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)


def _checkbox(checked: bool) -> str:
    return "☑" if checked else "☐"


def _fmt(val, suffix: str = "") -> str:
    """Qiymatni formatlaydi: 0 yoki bo'sh bo'lsa '' qaytaradi."""
    if val in (None, "", 0, 0.0, "0", "0.0"):
        return ""
    try:
        f = float(val)
        if f == 0:
            return ""
        return f"{f:g}{suffix}"
    except (TypeError, ValueError):
        s = str(val).strip()
        return s if s not in ("0", "0.0") else ""


def _bia_metric_value(metric) -> str:
    """Return a compact display value from a canonical BIA metric."""
    if not isinstance(metric, dict):
        return "—"
    value = metric.get("used_value")
    if value is None:
        value = metric.get("value")
    if value is None:
        return "—"
    prefix = "~" if (
        metric.get("estimated")
        or str(metric.get("source") or "").startswith("estimated")
    ) else ""
    if isinstance(value, float):
        return f"{prefix}{value:.2f}"
    return f"{prefix}{value}"


def _bia_metric_number(metric):
    """Return the numeric payload used by a canonical BIA metric."""
    if not isinstance(metric, dict):
        return None
    value = metric.get("used_value")
    return metric.get("value") if value is None else value


def _bia_segment_part_value(segment, key: str, lang: str = "uz") -> str:
    """Format one segment for a dedicated, readable segmental table."""
    if not isinstance(segment, dict):
        return "—"
    value = segment.get(key)
    if value is None:
        return "—"
    if isinstance(value, float):
        value = f"{value:.2f}".rstrip("0").rstrip(".")
    unit = segment.get("unit") or "kg"
    if lang == "uz" and str(unit).lower() == "kg":
        unit = "кг"
    prefix = "~" if segment.get("estimated") else ""
    return f"{prefix}{value} {unit}"


# ---------------------------------------------------------------------------
# Asosiy generatsiya funksiyasi
# ---------------------------------------------------------------------------

DOCX_LABELS["tm"] = {
    **DOCX_LABELS["uz"],
    "title_child": "MEKDEBE CENLI CAGALAR UCIN BIOIMPEDANS + ANTROPOMETRIK BARLAG ANKETASY",
    "title_pupil": "MEKDEP YASY CAGALAR WE OSMURLER UCIN BIOIMPEDANS + ANTROPOMETRIK BARLAG ANKETASY",
    "title_adult": "ANTROPOMETRIK BARLAG WE BIOIMPEDANS ANALIZ ANKETASY",
    "section_1": "I. Umumy maglumatlar",
    "indicator": "Gorkeziji",
    "data_col": "Maglumat",
    "name_label_child": "Caganyn ady we familiyasy",
    "name_label_adult": "Hastanyn ady we familiyasy",
    "exam_date": "Barlag senesi",
    "age_label_child": "Caganyn yasy",
    "age_label_adult": "Hastanyn yasy",
    "age_suffix": "yas",
    "age_months": "ay",
    "age_days": "gun",
    "gender": "Jynsy",
    "male": "Oglan/Erkek",
    "female": "Gyz/Ayal",
    "birth_date": "Doglan senesi",
    "area_type": "Yasayys sebiti",
    "city": "Saher",
    "village": "Oba",
    "institution": "Edara (mekdep/bagca)",
    "address": "Yasayys salgysy",
    "parents_phone": "Ene-ata telefony",
    "section_2": "II. Esasy antropometrik gorkezijiler (WHO standartlary)",
    "unit": "Birl.",
    "value": "Baha",
    "height": "Boy uzynlygy",
    "weight": "Beden agramy",
    "head": "Bas aylawy",
    "chest": "Gursi aylawy",
    "waist": "Bil aylawy",
    "id_code": "ID kod",
    "no": "No",
    "sh_len": "Yelka uzynlygy",
    "sh_br": "Yelka inligi",
    "sh_circ": "Yelka aylawy",
    "arm_elb": "Bilek uzynlygy",
    "hand": "Penje uzynlygy",
    "thigh_len": "Son uzynlygy",
    "thigh_circ": "Son aylawy",
    "calf_len": "Boldur uzynlygy",
    "calf_circ": "Boldur aylawy",
    "foot": "Ayak dabanynyn uzynlygy",
    "body_len": "Beden uzynlygy",
    "section_3": "III. Hasaplanan antropometrik indeksler",
    "eval": "Baha",
    "bmi_label": "BMI (kg/m2)",
    "height_age_z": "Boy-yas Z-score",
    "weight_age_z": "Agram-yas Z-score",
    "bmi_age_z": "BMI-yas Z-score",
    "centile": "Sentil aralygy",
    "corridor": "Saglyk koridory",
    "hmai_label": "HMAI (uygunlasma)",
    "mii_label": "MII (integrasiya)",
    "adi_label": "ADI (nomutanosiplik)",
    "mcri_label": "MCRI (howp indeksi)",
    "body_len_z": "Beden uzynlygy Z-score",
    "section_4": "IV. Bioimpedans analiz netijeleri",
    "norm": "Kada",
    "tbw": "Umumy beden suwy (TBW)",
    "fm_p": "Yag massasy (%)",
    "fm_kg": "Yag massasy (kg)",
    "muscle": "Muskul massasy",
    "bone": "Suyek massasy",
    "acm": "Isjen hujayra massasy (ACM)",
    "visceral": "Visseral yag derejesi",
    "section_5": "V. Morfologik we biologik baha",
    "dev_level": "Fiziki osus derejesi",
    "age_matches": "Yasyna gabat gelyar",
    "behind": "Yza galan",
    "ahead": "Onde",
    "morph_type": "Morfologik tip",
    "bio_age_match": "Biologik yasyna gabat gelisi",
    "secular": "Sekulyar trend alamatlary",
    "astenik": "Astenik",
    "normostenik": "Normostenik",
    "giperstenik": "Giperstenik",
    "mos": "Gabat gelyar",
    "mos_emas": "Gabat gelenok",
    "mavjud": "Bar",
    "yoq": "Yok",
    "section_6": "VI. Etiki razylyk we gollar:",
    "parent": "Ene-ata (howandar)",
    "nurse": "Lukman hamshiresi (edara)",
    "specialists": "Hunarment 1 / Hunarment 2",
    "consultant": "Maslahatcy",
    "sig_date": "Gol / Sene",
    "doctor_parent": "Hunarment / Ene-ata",
    "cm": "sm",
    "kg": "kg",
}


DOCX_LABELS["tr"] = {
    **DOCX_LABELS["en"],
    "title_child": "OKUL ONCESI COCUKLAR ICIN BIOIMPEDANS +\nANTROPOMETRIK MUAYENE FORMU",
    "title_pupil": "OKUL CAGI COCUKLARI VE ERGENLER ICIN BIOIMPEDANS +\nANTROPOMETRIK MUAYENE FORMU",
    "title_adult": "ANTROPOMETRIK MUAYENE VE BIOIMPEDANS ANALIZ FORMU",
    "section_1": "I. Genel bilgiler",
    "no": "No",
    "indicator": "Gosterge",
    "data_col": "Veri",
    "name_label_child": "Ad ve soyad (cocuk)",
    "name_label_adult": "Ad ve soyad (hasta)",
    "id_code": "ID kod",
    "exam_date": "Muayene tarihi",
    "age_label_child": "Yas (cocuk)",
    "age_label_adult": "Yas (hasta)",
    "age_suffix": "yil",
    "age_months": "ay",
    "age_days": "gun",
    "gender": "Cinsiyet",
    "male": "Erkek",
    "female": "Kadin",
    "birth_date": "Dogum tarihi",
    "area_type": "Yerlesim turu",
    "city": "Sehir",
    "village": "Koy",
    "institution": "Kurum (okul/anaokulu)",
    "address": "Yasam adresi",
    "parents_phone": "Ebeveyn telefonu",
    "section_2": "II. Temel antropometrik gostergeler (WHO standartlari)",
    "unit": "Birim",
    "value": "Deger",
    "height": "Vucut uzunlugu (boy)",
    "weight": "Vucut agirligi",
    "head": "Bas cevresi",
    "chest": "Gogus cevresi",
    "waist": "Bel cevresi",
    "sh_len": "Omuz uzunlugu",
    "sh_br": "Omuz genisligi",
    "sh_circ": "Omuz cevresi",
    "arm_elb": "On kol/dirsek uzunlugu",
    "hand": "El uzunlugu",
    "thigh_len": "Uyluk uzunlugu",
    "thigh_circ": "Uyluk cevresi",
    "calf_len": "Baldir uzunlugu",
    "calf_circ": "Baldir cevresi",
    "foot": "Ayak uzunlugu",
    "body_len": "Vucut uzunlugu",
    "section_3": "III. Hesaplanan antropometrik indeksler",
    "eval": "Degerlendirme",
    "bmi_label": "BMI (kg/m2)",
    "height_age_z": "Boy-yas Z-score",
    "weight_age_z": "Kilo-yas Z-score",
    "bmi_age_z": "BMI-yas Z-score",
    "centile": "Persentil araligi",
    "corridor": "Saglik koridoru",
    "hmai_label": "HMAI (uyum)",
    "mii_label": "MII (entegrasyon)",
    "adi_label": "ADI (uyumsuzluk)",
    "mcri_label": "MCRI (risk indeksi)",
    "body_len_z": "Vucut uzunlugu Z-score",
    "section_4": "IV. Bioimpedans analiz sonuclari",
    "norm": "Norm",
    "tbw": "Toplam vucut suyu (TBW)",
    "fm_p": "Yag kutlesi (%)",
    "fm_kg": "Yag kutlesi (kg)",
    "muscle": "Kas kutlesi",
    "bone": "Kemik kutlesi",
    "acm": "Aktif hucre kutlesi (ACM)",
    "visceral": "Visseral yag duzeyi",
    "section_5": "V. Morfolojik ve biyolojik degerlendirme",
    "dev_level": "Fiziksel gelisim duzeyi",
    "age_matches": "Yasa uygun",
    "behind": "Geride",
    "ahead": "Ileride",
    "morph_type": "Morfolojik tip",
    "bio_age_match": "Biyolojik yasa uygunluk",
    "secular": "Sekuler trend belirtileri",
    "section_6": "VI. Etik onam ve imzalar:",
    "parent": "Ebeveyn (vasi)",
    "nurse": "Hemsire (kurum)",
    "specialists": "Uzman 1 / Uzman 2",
    "consultant": "Danisman",
    "sig_date": "Imza / Tarih",
    "doctor_parent": "Uzman / Ebeveyn",
    "astenik": "Astenik",
    "normostenik": "Normostenik",
    "giperstenik": "Hiperstenik",
    "mos": "Uygun",
    "mos_emas": "Uygun degil",
    "mavjud": "Var",
    "yoq": "Yok",
    "cm": "cm",
    "kg": "kg",
}


def generate_docx_file(raw_data: dict, lang: str = "uz") -> BytesIO:
    # Barcha kalitlarni normallashtirish (camelCase → snake_case ham qo'shiladi)
    data = _normalize_data(raw_data)
    labels = DOCX_LABELS.get(lang, DOCX_LABELS["uz"])

    def LP(text):
        """Transliteratsiya kirill yozuvidagi hisobotlar uchun kerak bo'lsa."""
        localized = report_text(text, lang)
        if lang in ("uz", "ru", "ky"):
            return lat2cyr(localized)
        return localized

    def L(key):
        return labels.get(key, key)

    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(0.45)
        section.bottom_margin = Cm(0.45)
        section.left_margin = Cm(0.8)
        section.right_margin = Cm(0.6)

    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(8)

    # O'zgaruvchilar - Common fields extraction moved here to avoid NameError
    exam_date = _val(data, "examination_date")
    birth_date = _val(data, "birth_date")
    age_val = _val(data, "age")
    age_m = _val(data, "age_months", "0")
    age_d = _val(data, "age_days", "0")
    gender_raw = _val(data, "gender").lower()
    preschool = LP(_val(data, "preschool_institution"))
    region_raw = _val(data, "region").lower()
    district_s = _val(data, "district").lower()
    mahalla_s = _val(data, "mahalla").lower()
    address_s = _val(data, "address").lower()
    parents_phone = _val(data, "parents_phone")

    region_val = LP(_val(data, "region"))
    district_val = LP(_val(data, "district"))
    mahalla_val = LP(_val(data, "mahalla"))
    address_val = LP(_val(data, "address"))
    full_address = ", ".join(
        filter(None, [region_val, district_val, mahalla_val, address_val])
    )

    # SARLAVHA
    age_val_int = 0
    try:
        age_val_int = int(float(age_val or 0))
    except (TypeError, ValueError):
        pass

    if age_val_int < 7:
        title_text = L("title_child")
    elif age_val_int < 21:
        title_text = L("title_pupil")
    else:
        title_text = L("title_adult")

    _add_bold_centered_title(
        doc,
        title_text,
        size=10,
    )

    # -----------------------------------------------------------------------
    # I. УМУМИЙ МАЪЛУМОТЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, L("section_1"))

    # Жинси checkbox
    is_boy = any(
        k in gender_raw for k in ("erkak", "o'g'il", "ogil", "ўғил", "male", "ер")
    )
    boy_box = _checkbox(is_boy)
    girl_box = _checkbox(not is_boy)

    # Яшаш ҳудуди checkbox
    combined = f"{region_raw} {district_s} {mahalla_s} {address_s}"
    is_city = any(
        k in combined for k in ("shahar", "shahri", "шаҳар", "city", "қала", "город")
    )
    city_box = _checkbox(is_city)
    village_box = _checkbox(not is_city)

    # Age string
    age_str = f"{age_val} {L('age_suffix')}" if age_val else ""
    if age_m != "0" or age_d != "0":
        age_str += f", {age_m} {L('age_months')}, {age_d} {L('age_days')}"

    full_name_raw = (
        _val(data, "full_name")
        or data.get("name")
        or f"{_val(data, 'first_name')} {_val(data, 'last_name')}".strip()
    )
    full_name_val = LP(str(full_name_raw)) if full_name_raw else ""
    id_code_val = _val(data, "id_code")

    name_label = L("name_label_child") if age_val_int < 21 else L("name_label_adult")
    age_label = L("age_label_child") if age_val_int < 21 else L("age_label_adult")

    rows_i = [
        ("1", name_label, full_name_val),
        ("2", L("id_code"), id_code_val),
        ("3", L("exam_date"), exam_date),
        ("4", age_label, age_str),
        ("5", L("gender"), f"{boy_box} {L('male')}    {girl_box} {L('female')}"),
        ("6", L("birth_date"), birth_date),
        (
            "7",
            L("area_type"),
            f"{city_box} {L('city')}    {village_box} {L('village')}",
        ),
        ("8", L("institution"), LP(preschool)),
        ("9", L("address"), full_address),
        ("10", L("parents_phone"), parents_phone),
    ]
    if data.get("privacy_redacted"):
        private_labels = {
            name_label,
            L("institution"),
        }
        rows_i = [row for row in rows_i if row[1] not in private_labels]

    t1 = doc.add_table(rows=len(rows_i) + 1, cols=3)
    t1.style = "Table Grid"
    _set_table_full_width(t1)
    _set_cell_font(
        t1.cell(0, 0), L("no"), bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
    )
    _set_cell_font(
        t1.cell(0, 1), L("indicator"), bold=True, size=9,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    _set_cell_font(
        t1.cell(0, 2), L("data_col"), bold=True, size=9,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    for c in range(3):
        _shade_cell(t1.cell(0, c))

    for i, (_, label, val) in enumerate(rows_i, start=1):
        _set_cell_font(t1.cell(i, 0), str(i), size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t1.cell(i, 1), label, size=9)
        _set_cell_font(t1.cell(i, 2), val, size=9)

    _set_col_width(t1, 0, 1.0)
    _set_col_width(t1, 1, 6.5)
    _set_col_width(t1, 2, 8.5)
    _style_report_table(t1)

    # -----------------------------------------------------------------------
    # II. АСОСИЙ АНТРОПОМЕТРИК КЎРСАТКИЧЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, L("section_2"))

    metric_specs = [
        ("height", L("height"), L("cm")),
        ("weight", L("weight"), L("kg")),
        ("head", L("head"), L("cm")),
        ("chest", L("chest"), L("cm")),
        ("waist", L("waist"), L("cm")),
        ("shoulder_length", L("sh_len"), L("cm")),
        ("shoulder_breadth", L("sh_br"), L("cm")),
        ("shoulder_circumference", L("sh_circ"), L("cm")),
        ("arm_elbow_length", L("arm_elb"), L("cm")),
        ("hand_length", L("hand"), L("cm")),
        ("thigh_length", L("thigh_len"), L("cm")),
        ("thigh_circumference", L("thigh_circ"), L("cm")),
        ("calf_length", L("calf_len"), L("cm")),
        ("calf_circumference", L("calf_circ"), L("cm")),
        ("foot_length", L("foot"), L("cm")),
        ("body_length", L("body_len"), L("cm")),
    ]
    always_metric_keys = {"height", "weight", "head", "chest", "waist"}
    visible_metrics = [
        (key, label, unit, _fmt(_val(data, key)))
        for key, label, unit in metric_specs
        if key in always_metric_keys or key in data
    ]

    use_compact_metrics_table = len(visible_metrics) <= 8
    if use_compact_metrics_table:
        t2 = doc.add_table(rows=1, cols=4)
        t2.style = "Table Grid"
        _set_table_full_width(t2)
        headers2 = [L("no"), L("indicator"), L("unit"), L("value")]
        for c, h in enumerate(headers2):
            _set_cell_font(
                t2.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
            )
            _shade_cell(t2.cell(0, c))

        for i, (_key, label, unit, qiymat) in enumerate(visible_metrics, start=1):
            row = t2.add_row()
            _set_cell_font(row.cells[0], str(i), size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(row.cells[1], label, size=9)
            _set_cell_font(row.cells[2], unit, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(row.cells[3], qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

        _set_col_width(t2, 0, 0.8)
        _set_col_width(t2, 1, 8.0)
        _set_col_width(t2, 2, 1.0)
        _set_col_width(t2, 3, 3.0)
    else:
        t2 = doc.add_table(rows=1, cols=7)
        t2.style = "Table Grid"
        _set_table_full_width(t2)
        headers2 = [
            L("no"),
            L("indicator"),
            L("unit"),
            L("value"),
            L("indicator"),
            L("unit"),
            L("value"),
        ]
        for c, h in enumerate(headers2):
            _set_cell_font(
                t2.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
            )
            _shade_cell(t2.cell(0, c))

        split_at = (len(visible_metrics) + 1) // 2
        left_metrics = [
            (str(i + 1), label, unit, value)
            for i, (_key, label, unit, value) in enumerate(visible_metrics[:split_at])
        ]
        right_metrics = [
            (label, unit, value) for _key, label, unit, value in visible_metrics[split_at:]
        ]
        row_count = max(len(left_metrics), len(right_metrics))
        for _ in range(row_count):
            t2.add_row()

        for i, (num, label, unit, qiymat) in enumerate(left_metrics, start=1):
            _set_cell_font(t2.cell(i, 0), num, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t2.cell(i, 1), label, size=9)
            _set_cell_font(t2.cell(i, 2), unit, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t2.cell(i, 3), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

        for i, (label, unit, qiymat) in enumerate(right_metrics, start=1):
            _set_cell_font(t2.cell(i, 4), label, size=9)
            _set_cell_font(t2.cell(i, 5), unit, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t2.cell(i, 6), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

        _set_col_width(t2, 0, 0.8)
        _set_col_width(t2, 1, 4.2)
        _set_col_width(t2, 2, 0.8)
        _set_col_width(t2, 3, 2.0)
        _set_col_width(t2, 4, 4.2)
        _set_col_width(t2, 5, 0.8)
        _set_col_width(t2, 6, 2.0)

    _style_report_table(t2)

    # -----------------------------------------------------------------------
    # III. ҲИСОБЛАНГАН АНТРОПОМЕТРИК ИНДЕКСЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, L("section_3"))

    analysis = data.get("analysis", {}) or {}
    try:
        bmi_f = float(analysis.get("bmi", 0) or 0)
    except (TypeError, ValueError):
        bmi_f = 0.0
    try:
        z_val = float(analysis.get("z_score", 0) or 0)
    except (TypeError, ValueError):
        z_val = 0.0
    bmi_str = f"{bmi_f:.1f}" if bmi_f else ""
    bmi_cat = LP(ky_text(analysis.get("bmi_category", "") or "", lang))

    detailed = analysis.get("indices", {})

    # Centil va sog'lomlik yo'lagini indices orqali olamiz
    centil_str = detailed.get("centile", "")
    corridor = LP(ky_text(detailed.get("corridor", ""), lang))

    z_h_str = f"{detailed.get('z_h', 0):.2f}"
    z_w_str = f"{detailed.get('z_w', 0):.2f}"
    z_bmi_str = f"{detailed.get('z_bmi', 0):.2f}"

    z_body_length_str = (
        f"{detailed.get('z_body_length', 0):.2f}"
        if detailed.get("z_body_length") is not None
        else ""
    )

    hmai_val = format(detailed["hmai"], ".2f") if detailed.get("hmai") is not None else "?"
    hmai_desc = LP(ky_text(detailed.get("hmai_desc", ""), lang))

    mii_val = format(detailed["mii"], ".2f") if detailed.get("mii") is not None else "?"
    mii_desc = LP(ky_text(detailed.get("mii_desc", ""), lang))

    adi_val = format(detailed["adi"], ".2f") if detailed.get("adi") is not None else "?"
    adi_desc = LP(ky_text(detailed.get("adi_desc", ""), lang))

    mcri_val = format(detailed["mcri"], ".2f") if detailed.get("mcri") is not None else "?"
    mcri_desc = LP(ky_text(detailed.get("mcri_desc", ""), lang))

    t3 = doc.add_table(rows=1, cols=4)
    t3.style = "Table Grid"
    _set_table_full_width(t3)

    headers3 = [L("no"), L("indicator"), L("value"), L("eval")]
    for c, h in enumerate(headers3):
        _set_cell_font(
            t3.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
        )
        _shade_cell(t3.cell(0, c))

    indices = [
        ("1", L("bmi_label"), bmi_str, bmi_cat),
        ("2", L("height_age_z"), z_h_str, _z_eval(z_h_str, lang)),
        ("3", L("weight_age_z"), z_w_str, _z_eval(z_w_str, lang)),
        ("4", L("bmi_age_z"), z_bmi_str, _z_eval(z_bmi_str, lang)),
        (
            "5",
            L("body_len_z"),
            z_body_length_str,
            _z_eval(z_body_length_str, lang) if z_body_length_str else "",
        ),
        ("6", L("centile"), centil_str, _centile_eval(centil_str, lang)),
        ("7", L("corridor"), corridor, ""),
        ("8", L("hmai_label"), f"{hmai_val}", hmai_desc),
        ("9", L("mii_label"), f"{mii_val}", mii_desc),
        ("10", L("adi_label"), f"{adi_val}", adi_desc),
        ("11", L("mcri_label"), f"{mcri_val}", mcri_desc),
    ]

    optional_index_keys = {
        L("body_len_z"): "z_body_length",
        L("hmai_label"): "hmai",
        L("mii_label"): "mii",
        L("adi_label"): "adi",
        L("mcri_label"): "mcri",
    }
    filtered_indices = []
    for row in indices:
        required_key = optional_index_keys.get(row[1])
        if required_key and required_key not in detailed:
            continue
        filtered_indices.append(row)
    while len(filtered_indices) > len(t3.rows) - 1:
        t3.add_row()

    for i, (num, label, m_val, baholash) in enumerate(filtered_indices, start=1):
        _set_cell_font(t3.cell(i, 0), num, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t3.cell(i, 1), label, size=9)
        _set_cell_font(t3.cell(i, 2), m_val, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t3.cell(i, 3), baholash, size=9)

    _set_col_width(t3, 0, 0.8)
    _set_col_width(t3, 1, 7.0)
    _set_col_width(t3, 2, 2.0)
    _set_col_width(t3, 3, 5.2)
    _style_report_table(t3)

    # -----------------------------------------------------------------------
    # IV. БИОИМПЕДАНС ТАҲЛИЛИ НАТИЖАЛАРИ
    # -----------------------------------------------------------------------
    canonical_bia = deepcopy(data.get("body_composition") or {})
    bio_results = analysis.get("indices", {})
    has_bio_section = any(
        key in bio_results
        for key in (
            "tbw_percent", "fm_percent", "fm", "muscle_mass", "bone_mass",
            "acm_percent", "visceral_fat",
        )
    )

    if canonical_bia:
        age_months_total = 0
        try:
            age_months_total = int(float(age_val or 0)) * 12 + int(float(age_m or 0))
        except (TypeError, ValueError):
            pass

        phase_metric = canonical_bia.get("phase_angle_deg") or {}
        if _bia_metric_number(phase_metric) is None:
            phase_estimate = estimate_phase_angle_from_anthropometry(
                age_months=age_months_total,
                sex=gender_raw,
                bmi=bmi_f,
            )
            if phase_estimate is not None:
                canonical_bia["phase_angle_deg"] = {
                    "value": phase_estimate,
                    "source": "estimated_from_anthropometry",
                    "estimated": True,
                    "status": "estimated",
                }

        segment_estimates = estimate_segmental_composition(
            ffm_kg=_bia_metric_number(canonical_bia.get("ffm_kg")),
            fat_mass_kg=_bia_metric_number(canonical_bia.get("fat_mass_kg")),
            age_months=age_months_total,
            sex=gender_raw,
        )
        segment_keys = (
            "right_arm", "left_arm", "trunk", "right_leg", "left_leg"
        )
        for segment_name in ("segmental_lean_mass", "segmental_fat_mass"):
            segment = canonical_bia.get(segment_name)
            has_segment_values = isinstance(segment, dict) and any(
                segment.get(key) is not None for key in segment_keys
            )
            if not has_segment_values and segment_estimates.get(segment_name):
                canonical_bia[segment_name] = segment_estimates[segment_name]

        _section_head_paragraph(doc, L("section_4"))
        labels_uz = [
            "PBF / Ёғ (%)",
            "Fat mass / Ёғ (кг)",
            "FFM / Ёғсиз масса (кг)",
            "SMM / Скелет мушак массаси (кг)",
            "Visceral Fat / Висцерал ёғ",
            "Phase Angle / Фаза бурчаги (°)",
            "Segmental Lean Mass / Сегментал ёғсиз масса",
            "Segmental Fat Mass / Сегментал ёғ массаси",
            "BMR (ккал/кун)",
            "Mineral/Bone mass / Суяк массаси (кг)",
        ]
        labels_en = [
            "PBF / Fat (%)",
            "Fat mass (kg)",
            "FFM / Fat-free mass (kg)",
            "SMM / Skeletal muscle mass (kg)",
            "Visceral Fat",
            "Phase Angle (°)",
            "Segmental Lean Mass",
            "Segmental Fat Mass",
            "BMR (kcal/day)",
            "Mineral/Bone mass (kg)",
        ]
        bia_labels = labels_uz if lang == "uz" else labels_en
        metrics = [
            ("1", bia_labels[0], _bia_metric_value(canonical_bia.get("pbf_percent"))),
            ("2", bia_labels[1], _bia_metric_value(canonical_bia.get("fat_mass_kg"))),
            ("3", bia_labels[2], _bia_metric_value(canonical_bia.get("ffm_kg"))),
            ("4", bia_labels[3], _bia_metric_value(canonical_bia.get("smm_kg"))),
            ("5", bia_labels[4], _bia_metric_value(canonical_bia.get("visceral_fat"))),
            ("6", bia_labels[5], _bia_metric_value(canonical_bia.get("phase_angle_deg"))),
            ("9", bia_labels[8], _bia_metric_value(canonical_bia.get("bmr_kcal_day"))),
            ("10", bia_labels[9], _bia_metric_value(canonical_bia.get("mineral_bone_mass_kg"))),
        ]
        pairs = [
            (metrics[0], metrics[1]),
            (metrics[2], metrics[3]),
            (metrics[4], metrics[5]),
            (metrics[6], metrics[7]),
        ]
        t4 = doc.add_table(rows=len(pairs) + 1, cols=6)
        t4.style = "Table Grid"
        _set_table_full_width(t4)
        compact_headers = [L("no"), L("indicator"), L("value")] * 2
        for c, header in enumerate(compact_headers):
            _set_cell_font(t4.cell(0, c), header, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _shade_cell(t4.cell(0, c))
        for row_idx, (left, right) in enumerate(pairs, start=1):
            _set_cell_font(t4.cell(row_idx, 0), left[0], size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(row_idx, 1), left[1], size=9)
            _set_cell_font(t4.cell(row_idx, 2), left[2], size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(row_idx, 3), right[0], size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(row_idx, 4), right[1], size=9)
            _set_cell_font(t4.cell(row_idx, 5), right[2], size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        for col, width in enumerate((0.65, 5.0, 2.1, 0.65, 5.0, 2.1)):
            _set_col_width(t4, col, width)
        _style_report_table(t4, number_cols=(0, 3))

        segment_headers = {
            "uz": [L("no"), L("indicator"), "Ўнг қўл", "Чап қўл", "Тана", "Ўнг оёқ", "Чап оёқ"],
            "en": [L("no"), L("indicator"), "Right arm", "Left arm", "Trunk", "Right leg", "Left leg"],
        }.get(lang, [L("no"), L("indicator"), "Right arm", "Left arm", "Trunk", "Right leg", "Left leg"])
        segment_rows = [
            ("7", bia_labels[6], canonical_bia.get("segmental_lean_mass") or {}),
            ("8", bia_labels[7], canonical_bia.get("segmental_fat_mass") or {}),
        ]
        t4_segments = doc.add_table(rows=3, cols=7)
        t4_segments.style = "Table Grid"
        _set_table_full_width(t4_segments)
        for col_idx, header in enumerate(segment_headers):
            _set_cell_font(
                t4_segments.cell(0, col_idx), header, bold=True, size=9,
                align=WD_ALIGN_PARAGRAPH.CENTER,
            )
            _shade_cell(t4_segments.cell(0, col_idx))
        for row_idx, (number, label, segment) in enumerate(segment_rows, start=1):
            _set_cell_font(t4_segments.cell(row_idx, 0), number, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4_segments.cell(row_idx, 1), label, size=9)
            for col_idx, key in enumerate(segment_keys, start=2):
                _set_cell_font(
                    t4_segments.cell(row_idx, col_idx),
                    _bia_segment_part_value(segment, key, lang),
                    size=9,
                    align=WD_ALIGN_PARAGRAPH.CENTER,
                )
        for col, width in enumerate((0.6, 5.4, 1.9, 1.9, 1.9, 1.9, 1.9)):
            _set_col_width(t4_segments, col, width)
        _style_report_table(t4_segments, number_cols=(0,))

    elif has_bio_section:
        _section_head_paragraph(doc, L("section_4"))

        t4 = doc.add_table(rows=8, cols=5)
        t4.style = "Table Grid"
        _set_table_full_width(t4)

        headers4 = [L("no"), L("indicator"), L("unit"), L("value"), L("norm")]
        for c, h in enumerate(headers4):
            _set_cell_font(
                t4.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
            )
            _shade_cell(t4.cell(0, c))

        bio_results = analysis.get("indices", {})

        bio_rows = [
            (
                "1",
                L("tbw"),
                "%",
                f"{bio_results.get('tbw_percent', '')}",
                f"{bio_results.get('tbw_norm', '')}",
            ),
            (
                "2",
                L("fm_p"),
                "%",
                f"{bio_results.get('fm_percent', '')}",
                f"{bio_results.get('fm_norm', '')}",
            ),
            (
                "3",
                L("fm_kg"),
                L("kg"),
                f"{bio_results.get('fm', '')}",
                f"{bio_results.get('fm_kg_norm', '')}",
            ),
            (
                "4",
                L("muscle"),
                L("kg"),
                f"{bio_results.get('muscle_mass', '')}",
                f"{bio_results.get('muscle_norm', '')}",
            ),
            (
                "5",
                L("bone"),
                L("kg"),
                f"{bio_results.get('bone_mass', '')}",
                f"{bio_results.get('bone_norm', '')}",
            ),
            (
                "6",
                L("acm"),
                "%",
                f"{bio_results.get('acm_percent', '')}",
                f"{bio_results.get('acm_norm', '')}",
            ),
            (
                "7",
                L("visceral"),
                "—",
                f"{bio_results.get('visceral_fat', '')}",
                f"{bio_results.get('visceral_norm', '')}",
            ),
        ]

        for i, (num, label, unit, qiymat, norma) in enumerate(bio_rows, start=1):
            _set_cell_font(t4.cell(i, 0), num, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(i, 1), label, size=9)
            _set_cell_font(t4.cell(i, 2), unit, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(i, 3), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_font(t4.cell(i, 4), norma, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

        _set_col_width(t4, 0, 0.8)
        _set_col_width(t4, 1, 6.0)
        _set_col_width(t4, 2, 1.2)
        _set_col_width(t4, 3, 3.5)
        _set_col_width(t4, 4, 3.5)
        _style_report_table(t4)

    # -----------------------------------------------------------------------
    # V. МОРФОЛОГИК ВА БИОЛОГИК БАҲОЛАШ
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, L("section_5"))

    # Z-score asosida rivojlanish darajasi checkboxini aniqlash
    dev_mos, dev_orqada, dev_oldinda = _dev_level(z_val)

    t5 = doc.add_table(rows=5, cols=3)
    t5.style = "Table Grid"
    _set_table_full_width(t5)

    headers5 = [L("no"), L("indicator"), L("value")]
    for c, h in enumerate(headers5):
        _set_cell_font(
            t5.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
        )
        _shade_cell(t5.cell(0, c))

    dev_text = (
        f"{_checkbox(dev_mos)} {L('age_matches')}  "
        f"{_checkbox(dev_orqada)} {L('behind')}  "
        f"{_checkbox(dev_oldinda)} {L('ahead')}"
    )

    # Morphological assessment data
    m_type_key = bio_results.get("morphological_type_key", "")
    b_age_key = bio_results.get("biological_age_status_key", "")
    s_trend_key = bio_results.get("secular_trend_key", "")

    morph_type_text = (
        f"{_checkbox(m_type_key == 'astenik')} {LP(L('astenik'))}  "
        f"{_checkbox(m_type_key == 'normostenik')} {LP(L('normostenik'))}  "
        f"{_checkbox(m_type_key == 'giperstenik')} {LP(L('giperstenik'))}"
    )
    bio_age_text = (
        f"{_checkbox(b_age_key == 'mos')} {LP(L('mos'))}  "
        f"{_checkbox(b_age_key == 'mos_emas')} {LP(L('mos_emas'))}"
    )
    secular_trend_text = (
        f"{_checkbox(s_trend_key == 'mavjud')} {LP(L('mavjud'))}  "
        f"{_checkbox(s_trend_key == 'yoq')} {LP(L('yoq'))}"
    )

    morph_rows = [
        ("1", L("dev_level"), dev_text),
        ("2", L("morph_type"), morph_type_text),
        ("3", L("bio_age_match"), bio_age_text),
        ("4", L("secular"), secular_trend_text),
    ]

    for i, (num, label, result) in enumerate(morph_rows, start=1):
        _set_cell_font(t5.cell(i, 0), num, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t5.cell(i, 1), label, size=9)
        _set_cell_font(t5.cell(i, 2), result, size=9)

    _set_col_width(t5, 0, 0.8)
    _set_col_width(t5, 1, 7.0)
    _set_col_width(t5, 2, 7.2)
    _style_report_table(t5)

    # -----------------------------------------------------------------------
    # VI. ЭТИК РОЗИЛИК ВА ИМЗОЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, L("section_6"))

    t7 = doc.add_table(rows=5, cols=2)
    t7.style = "Table Grid"
    _set_table_full_width(t7)

    headers7 = [L("doctor_parent"), L("sig_date")]
    for c, h in enumerate(headers7):
        _set_cell_font(
            t7.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER
        )
        _shade_cell(t7.cell(0, c))

    for i, label in enumerate(
        [L("parent"), L("nurse"), L("specialists"), L("consultant")],
        start=1,
    ):
        _set_cell_font(t7.cell(i, 0), label, size=9)
        _set_cell_font(t7.cell(i, 1), "", size=9)

    _set_col_width(t7, 0, 9.5)
    _set_col_width(t7, 1, 5.5)
    _style_report_table(t7, number_cols=())

    # -----------------------------------------------------------------------
    # Bufferga saqlash
    # -----------------------------------------------------------------------
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def generate_docx_report(data: dict, lang: str = "uz") -> BytesIO:
    """Asosiy chaqiruv funksiyasi."""
    return generate_docx_file(data, lang=lang)
