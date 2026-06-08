import io
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def _set_cell_font(cell, text: str, bold: bool = False, size: float = 8, align=WD_ALIGN_PARAGRAPH.LEFT, underline: bool = False, color: str = None, shading: str = None):
    para = cell.paragraphs[0]
    para.alignment = align
    para.clear()
    run = para.add_run(str(text or ""))
    run.bold = bold
    run.underline = underline
    run.font.size = Pt(size)
    run.font.name = "Times New Roman"
    if color:
        from docx.shared import RGBColor
        # Accept simple hex colors for basic scientific look
        if color.lower() == "white":
            run.font.color.rgb = RGBColor(255, 255, 255)
    
    para.paragraph_format.line_spacing = 1.0
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    if shading:
        _set_cell_shading(cell, shading)

def _set_cell_shading(cell, fill_hex: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def _add_horizontal_line(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    
    pPr = p._element.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'auto')
    pBdr.append(bottom)
    pPr.append(pBdr)

def _remove_table_borders(table):
    tbl = table._element
    tblPr = tbl.find(qn('w:tblPr'))
    if tblPr is not None:
        tblBorders = tblPr.find(qn('w:tblBorders'))
        if tblBorders is None:
            tblBorders = OxmlElement('w:tblBorders')
            tblPr.append(tblBorders)
        for tag in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
            edge = tblBorders.find(qn(f'w:{tag}'))
            if edge is None:
                edge = OxmlElement(f'w:{tag}')
                tblBorders.append(edge)
            edge.set(qn('w:val'), 'none')
            edge.set(qn('w:sz'), '0')
            edge.set(qn('w:space'), '0')
            edge.set(qn('w:color'), 'auto')

def _format_date(date_str):
    if not date_str or not isinstance(date_str, str):
        return date_str
    parts = date_str.split('.')
    if len(parts) == 3 and len(parts[0]) == 4:
        return f"{parts[2]}.{parts[1]}.{parts[0]}"
    parts = date_str.split('-')
    if len(parts) == 3 and len(parts[0]) == 4:
        return f"{parts[2]}.{parts[1]}.{parts[0]}"
    return date_str

UZ_RU_MAP = {
    "o\'zbek": "узбек", "uzbek": "узбек", "o‘zbek": "узбек", "ўзбек": "узбек",
    "rus": "русский", "рус": "русский", "tojik": "таджик", "тожик": "таджик",
    "qozoq": "казах", "қозоқ": "казах", "qirg'iz": "киргиз", "қирғиз": "киргиз",
    "turkman": "туркмен", "туркман": "туркмен", "tatar": "татарин", "татар": "татарин",
    "koreys": "кореец", "корейс": "кореец", "uyg'ur": "уйгур", "уйғур": "уйгур",
    "ozarbayjon": "азербайджанец", "озарбайжон": "азербайджанец",
    "qoraqalpoq": "каракалпак", "қорақалпоқ": "каракалпак", "turk": "турок", "турк": "турок",
    "tabiiy": "естественное", "табиий": "естественное", "sun'iy": "искусственное", "сунъий": "искусственное",
    "aralash": "смешанное", "аралаш": "смешанное", "tabiiy emizish": "естественное вскармливание",
    "sun'iy emizish": "искусственное вскармливание", "ona suti": "материнское молоко",
    "yoshigacha": "до возраста", "yoshgacha": "лет", "yaqin qarindosh emas": "не близкородственный",
    "qarindosh emas": "не родственник", "yaqin qarindosh": "близкородственный",
    "uzoq qarindosh": "дальнородственный", "emas": "не", "ha": "да", "ҳа": "да", "yo'q": "нет", "йўқ": "нет",
    "sog'lom": "здоров(а)", "соғлом": "здоров(а)", "noma'lum": "неизвестно", "yaxshi": "хорошее",
    "yomon": "плохое", "o'rta": "среднее", "ўрта": "среднее", "o'rtacha": "удовлетворительное",
    "qoniqarli": "удовлетворительное", "yengil": "легкий", "og'ir": "тяжелый",
    "maktab": "школа", "мактаб": "школа", "maktabi": "школа",
    "umumiy o'rta ta'lim maktabi": "общеобразовательная средняя школа",
    "o'rta ta'lim maktabi": "средняя школа", "ixtisoslashtirilgan": "специализированная",
    "davlat": "государственная", "maktab-internati": "школа-интернат", "bog'cha": "детский сад",
    "litsey": "лицей", "kollej": "колледж", "universitet": "университет", "institut": "институт",
    "toshkent": "Ташкент", "chirchiq": "Чирчик", "viloyati": "область", "shahar": "город",
    "tumani": "район", "tuman": "район", "qishloq": "село", "mahalla": "махалля",
    "a'lo darajada": "на отличном уровне", "shaxsiy hovli": "частный двор",
    "barcha qulayliklar": "все удобства", "sharoitlar mavjud": "условия имеются",
    "tug'ilgandan buyon": "с рождения", "shu hududda": "в этой местности",
    "kunlik darslar": "ежедневные уроки", "sport to'garaklari": "спортивные секции",
    "gripp": "грипп", "qizamiq": "корь", "ko'k yo'tal": "коклюш", "mavsumiy": "сезонный",
    "surunkali": "хронические", "kasalliklari": "заболевания", "kasallik": "заболевание", "yilda": "в году"
}

def _lat_to_cyr(text: str) -> str:
    if not text or not isinstance(text, str): return text
    mapping_multi = {
        "sh": "ш", "Sh": "Ш", "ch": "ч", "Ch": "Ч", "ya": "я", "Ya": "Я",
        "yo": "ё", "Yo": "Ё", "yu": "ю", "Yu": "Ю", "ts": "ц", "Ts": "Ц",
        "o'": "ў", "O'": "Ў", "g'": "ғ", "G'": "Ғ"
    }
    for lat, cyr in mapping_multi.items(): text = text.replace(lat, cyr)
    mapping_single = {
        "a": "а", "b": "б", "d": "д", "e": "е", "f": "ф", "g": "г", "h": "ҳ",
        "i": "и", "j": "ж", "k": "к", "l": "л", "m": "м", "n": "н", "o": "о",
        "p": "п", "q": "қ", "r": "р", "s": "с", "t": "т", "u": "у", "v": "в",
        "x": "х", "y": "й", "z": "з", "'": "ъ"
    }
    res = [mapping_single.get(c.lower(), c) for c in text]
    return "".join(res)

def _cyr_to_lat(text: str) -> str:
    if not text or not isinstance(text, str): return text
    mapping = {
        "Шч": "Shch", "шч": "shch", "Щ": "Shch", "щ": "shch",
        "Ш": "Sh", "ш": "sh", "Ч": "Ch", "ч": "ch",
        "Я": "Ya", "я": "ya", "Ё": "Yo", "ё": "yo",
        "Ю": "Yu", "ю": "yu", "Ц": "Ts", "ц": "ts",
        "Ў": "O'", "ў": "o'", "Ғ": "G'", "ғ": "g'",
        "Қ": "Q", "қ": "q", "Ҳ": "H", "ҳ": "h",
        "А": "A", "а": "a", "Б": "B", "б": "b", "В": "V", "в": "v",
        "Г": "G", "г": "g", "Д": "D", "д": "d", "Е": "E", "е": "e",
        "Ж": "J", "ж": "j", "З": "Z", "з": "z", "И": "I", "и": "i",
        "Й": "Y", "й": "y", "К": "K", "к": "k", "Л": "L", "л": "l",
        "М": "M", "м": "m", "Н": "N", "н": "n", "О": "O", "о": "o",
        "П": "P", "п": "p", "Р": "R", "р": "r", "С": "S", "с": "s",
        "Т": "T", "т": "t", "У": "U", "у": "u", "Ф": "F", "ф": "f",
        "Х": "X", "х": "x", "Э": "E", "э": "e", "ъ": "'", "Ъ": "'", "ь": "", "Ь": ""
    }
    res = text
    for cyr, lat in mapping.items():
        res = res.replace(cyr, lat)
    return res

def _capitalize_name(text: str) -> str:
    if not text: return text
    return " ".join(word.capitalize() for word in str(text).split())

def _translate_uz_to_ru(text: str) -> str:
    if not text or not isinstance(text, str): return text
    import re
    text = text.replace('‘', "'").replace('’', "'").replace('`', "'")
    sorted_keys = sorted([k for k in UZ_RU_MAP.keys() if ' ' in k], key=len, reverse=True)
    for key in sorted_keys:
        if key.lower() in text.lower():
            text = re.sub(re.escape(key), UZ_RU_MAP[key], text, flags=re.IGNORECASE)
    def replace_word(match):
        word = match.group(0).lower()
        return UZ_RU_MAP.get(word, match.group(0))
    return re.sub(r"[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ']+", replace_word, text)

LABELS = {
    "ru": {
        "title": "Карта исследования",
        "fio": "Ф.И.О", "school": "Наименование школы (дед. сад.)", "settlement": "Населенный пункт",
        "birth_place": "Место рождения (город, область)", "birth_date": "Год, месяц и число рождения",
        "father_nat": "Национальность отца", "mother_nat": "матери",
        "living_since": "С какого времени обследуемый проживает в данной местности", "enrolled": "Когда зачислен в школу (дед сад)",
        "living_cond": "Бытовые условия", "labor_regime": "Режим труда",
        "past_illnesses": "Перенесенные заболевания", "children_count": "Сколько всего детей в семье",
        "child_order": "Какой по счёту ребенок", "feeding_a": "Находится на: а) естественном",
        "feeding_b": "б) искусственном вскармливании", "marriage_a": "Брак родственность: а) близкородственный",
        "marriage_b": "б) дальнородственный", "mother_health": "Со слов матери (здорова или)",
        "measure_results": "Результаты измерения", "date_col": "Дата", "indicator": "Показатель",
        "gender": "Пол ребенка",
        "cat_phys": "I. Показатели физического развития", "lower_leg": "1. Нижняя конечность",
        "lower_leg_len": "Длина нижней конечности", 
        "spina": "а. Точка верхней передней оси подвздошной кости",
        "symph": "б. Точка на верхнем крае лобкового сочленения", 
        "tibiale_title": "2.",
        "tibiale": "а. Верхней точки на середине, над мыщелка большеберцовой кости",
        "pelvic": "3. Ширина таза", "thigh_l": "4. Длина бедра", "thigh_c": "5. Обхват бедра",
        "calf_l": "6. Длина голени", "calf_c": "7. Обхват голени", "foot_l": "8. Длина стопы",
        "teeth": "9. Кол-во зубов", "menstr": "10. Начало менструации",
        "cat_skull": "II. Определения формы черепа", "skull_long": "1. Продольный диаметр",
        "skull_trans": "2. Поперечный размер", "head_circ": "3. Обхват головы",
        "forehead": "4. Поперечный размер лба", "skull_height": "5. Высотный или вертикальный диаметр",
        "skull_base_title": "Определения размера основания черепа", "skull_base_l": "1. Длина основания черепа", "skull_base_w": "2. Ширина основания черепа",
        "cat_face": "Лицо", "face_biz": "1. Скуловой диаметр", "face_big": "2. Нижнечелюстной диаметр",
        "face_morph": "3. Морфологическая высота лица", "face_phys": "4. Физиономическая высота лица",
        "nose_h": "5. Высота носа", "nose_w": "6. Ширина носа", "outer_oc": "7. Наружно глазничная ширина",
        "inner_oc": "8. Меж глазничная ширина", "lips_h": "9. Высота слизистой части обеих губ", "mouth_w": "10. Ширина рта",
        "cat_chest": "Грудь", "height_body": "1. Длина тела", "height_stand": "1. Рост стоя", "height_sit": "2. рост сидя",
        "weight": "2. Вес тела", "trunk_l": "3. Длина туловища", "torso_l": "4. Длина корпуса",
        "chest_p": "5. Окружность груди в паузе", "chest_i": "- при полном вдохе", "chest_e": "- при полном выдохе",
        "waist": "6. Обхват талии", "abd_c": "7. Окружность живота", "upper_s": "8. Длина верхнего отрезка",
        "chest_td": "9. Поперечный диаметр груди", "chest_ad": "10. Переднее-задний диаметр",
        "chest_h": "11. Высота грудной клетки", "cat_arm": "Верхняя конечность",
        "arm_l": "1. Длина верхней конечности", "shoulder_l": "2. Длина плеча", "shoulder_w": "3. Ширина плеч",
        "arm_circ": "4. Обхват плеча", "arm_circ_rest": "а) при спокойном состоянии", "arm_circ_flex": "б) при напряженном состоянии",
        "forearm_l": "5. Длина предплечья", "hand_l": "6. Длина кисти", "dynamo": "7. Динамометрия",
        "fat_title": "8. Толщина подкожно-жировой клетчатки", 
        "fat_tri": "а. над трехглавой мышцей", "fat_bi": "б. над двухглавой мышцей",
        "fat_sub": "в. под нижним углом лопатки", "fat_iliac": "г. над гребнем подвздошной кости", "fat_pop": "д. в подколенной ямке"
    },
    "uz": {
        "title": "Tadqiqot kartasi",
        "fio": "F.I.SH", "school": "Muassasa nomi (maktab, bog'cha)", "settlement": "Aholi punkti",
        "birth_place": "Tug'ilgan joyi (shahar, viloyat)", "birth_date": "Tug'ilgan yili, oyi va kuni",
        "father_nat": "Otasi millati", "mother_nat": "onasi",
        "living_since": "Tekshiriluvchi ushbu hududda qancha vaqtdan beri yashaydi", "enrolled": "Maktabga (bog'chaga) qabul qilingan sana",
        "living_cond": "Maishiy sharoitlar", "labor_regime": "Mehnat rejimi",
        "past_illnesses": "O'tkazilgan kasalliklar", "children_count": "Oilada jami nechta bola",
        "child_order": "Farzand nechanchi", "feeding_a": "Bo'lgan: a) tabiiy",
        "feeding_b": "b) sun'iy emizishda", "marriage_a": "Nikoh qarindoshligi: a) yaqin qarindosh",
        "marriage_b": "b) uzoq qarindosh", "mother_health": "Onasining so'zlariga ko'ra (sog'lom yoki)",
        "measure_results": "O'lchov natijalari", "date_col": "Sana", "indicator": "Ko'rsatkich",
        "gender": "Bolaning jinsi",
        "cat_phys": "I. Jismoniy rivojlanish ko'rsatkichlari", "lower_leg": "1. Pastki oyoq-qo'l",
        "lower_leg_len": "Pastki oyoq-qo'l uzunligi", 
        "spina": "a. Yonbosh suyagining yuqori oldingi o'simtasi nuqtasi",
        "symph": "b. Qov suyagi birikmasining yuqori qirrasi nuqtasi", 
        "tibiale_title": "2.",
        "tibiale": "a. Boldir suyagi do'ngligi ustidagi o'rta yuqori nuqtasi",
        "pelvic": "3. Chanoq kengligi", "thigh_l": "4. Son uzunligi", "thigh_c": "5. Son aylanasi",
        "calf_l": "6. Boldir uzunligi", "calf_c": "7. Boldir aylanasi", "foot_l": "8. Panja uzunligi",
        "teeth": "9. Tishlar soni", "menstr": "10. Hayz ko'rishning boshlanishi",
        "cat_skull": "II. Bosh suyagi shaklini aniqlash", "skull_long": "1. Uzunlamasiga diametr",
        "skull_trans": "2. Ko'ndalang o'lcham", "head_circ": "3. Bosh aylanasi",
        "forehead": "4. Peshonaning ko'ndalang o'lchami", "skull_height": "5. Balandlik yoki vertikal diametr",
        "skull_base_title": "Bosh suyagi asosi o'lchamini aniqlash", "skull_base_l": "1. Bosh suyagi asosi uzunligi", "skull_base_w": "2. Bosh suyagi asosi kengligi",
        "cat_face": "Yuz", "face_biz": "1. Yanoq diametri", "face_big": "2. Pastki jag' diametri",
        "face_morph": "3. Yuzning morfologik balandligi", "face_phys": "4. Yuzning fizionomik balandligi",
        "nose_h": "5. Burun balandligi", "nose_w": "6. Burun kengligi", "outer_oc": "7. Tashqi ko'z burchaklari kengligi",
        "inner_oc": "8. Ichki ko'z burchaklari kengligi", "lips_h": "9. Ikkala labning shilliq qismi balandligi", "mouth_w": "10. Og'iz kengligi",
        "cat_chest": "Ko'krak qafasi", "height_body": "1. Tana uzunligi", "height_stand": "1. Bo'yi tik", "height_sit": "2. bo'yi o'tirib",
        "weight": "2. Vazni", "trunk_l": "3. Gavda uzunligi", "torso_l": "4. Tana (korpus) uzunligi",
        "chest_p": "5. Ko'krak aylanasi (pauza)", "chest_i": "- to'liq nafas olganda", "chest_e": "- to'liq nafas chiqarganda",
        "waist": "6. Bel aylanasi", "abd_c": "7. Qorin aylanasi", "upper_s": "8. Yuqori segment uzunligi",
        "chest_td": "9. Ko'krakning ko'ndalang diametri", "chest_ad": "10. Old-orqa diametr",
        "chest_h": "11. Ko'krak qafasi balandligi", "cat_arm": "Yuqori oyoq-qo'l",
        "arm_l": "1. Yuqori oyoq-qo'l uzunligi", "shoulder_l": "2. Yelka uzunligi", "shoulder_w": "3. Yelka kengligi",
        "arm_circ": "4. Yelka aylanasi", "arm_circ_rest": "a) tinch holatda", "arm_circ_flex": "b) tarang holatda",
        "forearm_l": "5. Bilak uzunligi", "hand_l": "6. Panja uzunligi", "dynamo": "7. Dinamometriya",
        "fat_title": "8. Teri osti yog' qatlami qalinligi", 
        "fat_tri": "a. uch boshli mushak ustida", "fat_bi": "b. ikki boshli mushak ustida",
        "fat_sub": "v. kurakning pastki burchagi ostida", "fat_iliac": "g. yonbosh suyagi qirrasi ustida", "fat_pop": "d. tizza osti chuqurchasida"
    }
}

LABELS["ky"] = {
    **LABELS["uz"],
    "title": "Изилдөө картасы",
    "fio": "Аты-жөнү",
    "school": "Мекеме аталышы (мектеп, бакча)",
    "settlement": "Калктуу конуш",
    "birth_place": "Туулган жери (шаар, облус)",
    "birth_date": "Туулган жылы, айы жана күнү",
    "father_nat": "Атасынын улуту",
    "mother_nat": "энеси",
    "living_since": "Текшерилүүчү бул аймакта качантан бери жашайт",
    "enrolled": "Мектепке (бакчага) кабыл алынган күн",
    "living_cond": "Турмуш шарттары",
    "labor_regime": "Эмгек режими",
    "past_illnesses": "Өткөргөн оорулар",
    "children_count": "Үй-бүлөдө жалпы канча бала",
    "child_order": "Бала неченчи",
    "feeding_b": "б) жасалма эмизүүдө",
    "marriage_b": "б) алыс тууган",
    "mother_health": "Энесинин айтымында (ден соолугу)",
    "measure_results": "Өлчөө жыйынтыктары",
    "date_col": "Дата",
    "indicator": "Көрсөткүч",
    "gender": "Баланын жынысы",
    "cat_phys": "I. Физикалык өнүгүү көрсөткүчтөрү",
    "lower_leg": "1. Төмөнкү бут-кол",
    "lower_leg_len": "Төмөнкү бут-кол узундугу",
    "pelvic": "3. Жамбаш кеңдиги",
    "thigh_l": "4. Сан узундугу",
    "thigh_c": "5. Сан айланасы",
    "calf_l": "6. Балтыр узундугу",
    "calf_c": "7. Балтыр айланасы",
    "foot_l": "8. Таман узундугу",
    "teeth": "9. Тиштер саны",
    "menstr": "10. Этек кирдин башталышы",
    "cat_skull": "II. Баш сөөгүнүн формасын аныктоо",
    "skull_long": "1. Узунунан диаметр",
    "skull_trans": "2. Көлдөнөң өлчөм",
    "head_circ": "3. Баш айланасы",
    "forehead": "4. Маңдайдын көлдөнөң өлчөмү",
    "cat_face": "Бет",
    "face_biz": "1. Жаак диаметри",
    "face_big": "2. Төмөнкү жаак диаметри",
    "nose_h": "5. Мурун бийиктиги",
    "nose_w": "6. Мурун кеңдиги",
    "mouth_w": "10. Ооз кеңдиги",
    "cat_chest": "Көкүрөк кутусу",
    "height_stand": "1. Бою тик",
    "height_sit": "2. бою отуруп",
    "weight": "2. Салмагы",
    "trunk_l": "3. Дене узундугу",
    "chest_p": "5. Көкүрөк айланасы (пауза)",
    "chest_i": "- толук дем алганда",
    "chest_e": "- толук дем чыгарганда",
    "waist": "6. Бел айланасы",
    "cat_arm": "Жогорку бут-кол",
    "shoulder_l": "2. Ийин узундугу",
    "shoulder_w": "3. Ийин кеңдиги",
    "arm_circ": "4. Ийин айланасы",
    "forearm_l": "5. Билек узундугу",
    "hand_l": "6. Кол манжа узундугу",
    "dynamo": "7. Динамометрия",
    "fat_title": "8. Тери астындагы май катмарынын калыңдыгы",
}
LABELS["tg"] = {
    **LABELS["uz"],
    "title": "Корти таҳқиқот",
    "fio": "Ному насаб",
    "school": "Номи муассиса (мактаб, боғча)",
    "settlement": "Маҳалли аҳолинишин",
    "birth_place": "Ҷои таваллуд (шаҳр, вилоят)",
    "birth_date": "Соли, моҳ ва рӯзи таваллуд",
    "father_nat": "Миллати падар",
    "mother_nat": "модар",
    "living_since": "Аз кай дар ин маҳал зиндагӣ мекунад",
    "enrolled": "Санаи қабул ба мактаб (боғча)",
    "living_cond": "Шароити маишӣ",
    "labor_regime": "Режими меҳнат",
    "past_illnesses": "Бемориҳои гузашта",
    "children_count": "Шумораи умумии фарзандон дар оила",
    "child_order": "Кӯдак чандумин фарзанд аст",
    "feeding_a": "Дар ғизодиҳии: а) табиӣ",
    "feeding_b": "б) сунъӣ",
    "marriage_a": "Хешутабории волидон: а) хеши наздик",
    "marriage_b": "б) хеши дур",
    "mother_health": "Аз гуфтаи модар (саломатӣ)",
    "measure_results": "Натиҷаҳои ченкунӣ",
    "date_col": "Сана",
    "indicator": "Нишондиҳанда",
    "gender": "Ҷинси кӯдак",
    "cat_phys": "I. Нишондиҳандаҳои рушди ҷисмонӣ",
    "lower_leg": "1. Пойи поёнӣ",
    "lower_leg_len": "Дарозии пойи поёнӣ",
    "spina": "а. Нуқтаи spina iliaca anterior superior",
    "symph": "б. Нуқтаи канори болоии symphysion",
    "tibiale_title": "2.",
    "tibiale": "а. Нуқтаи болоӣ дар миёна, болои condylus tibiale",
    "pelvic": "3. Паҳнои кос",
    "thigh_l": "4. Дарозии рон",
    "thigh_c": "5. Даври рон",
    "calf_l": "6. Дарозии соқ",
    "calf_c": "7. Даври соқ",
    "foot_l": "8. Дарозии пойпанҷа",
    "teeth": "9. Шумораи дандонҳо",
    "menstr": "10. Оғози ҳайз",
    "cat_skull": "II. Муайян кардани шакли косахонаи сар",
    "skull_long": "1. Диаметри тӯлонӣ",
    "skull_trans": "2. Андозаи кӯндаланг",
    "head_circ": "3. Даври сар",
    "forehead": "4. Андозаи кӯндаланги пешонӣ",
    "skull_height": "5. Диаметри баландӣ ё амудӣ",
    "skull_base_title": "Муайян кардани андозаи асоси косахонаи сар",
    "skull_base_l": "1. Дарозии асоси косахонаи сар",
    "skull_base_w": "2. Паҳнои асоси косахонаи сар",
    "cat_face": "Рӯй",
    "face_biz": "1. Диаметри рухсора",
    "face_big": "2. Диаметри ҷоғи поён",
    "face_morph": "3. Баландии морфологии рӯй",
    "face_phys": "4. Баландии физиогномикии рӯй",
    "nose_h": "5. Баландии бинӣ",
    "nose_w": "6. Паҳнои бинӣ",
    "outer_oc": "7. Паҳнои кунҷҳои берунии чашм",
    "inner_oc": "8. Паҳнои кунҷҳои дохилии чашм",
    "lips_h": "9. Баландии қисми луобии лабҳо",
    "mouth_w": "10. Паҳнои даҳон",
    "cat_chest": "Қафаси сина",
    "height_body": "1. Дарозии бадан",
    "height_stand": "1. Қад рост",
    "height_sit": "2. Қад нишаста",
    "weight": "2. Вазн",
    "trunk_l": "3. Дарозии тана",
    "torso_l": "4. Дарозии корпус",
    "chest_p": "5. Даври сина (пауза)",
    "chest_i": "- ҳангоми нафаскашии пурра",
    "chest_e": "- ҳангоми нафасбарории пурра",
    "waist": "6. Даври миён",
    "abd_c": "7. Даври шикам",
    "upper_s": "8. Дарозии сегменти болоӣ",
    "chest_td": "9. Диаметри кӯндаланги сина",
    "chest_ad": "10. Диаметри пешу қафо",
    "chest_h": "11. Баландии қафаси сина",
    "cat_arm": "Даст",
    "arm_l": "1. Дарозии даст",
    "shoulder_l": "2. Дарозии китф",
    "shoulder_w": "3. Паҳнои китф",
    "arm_circ": "4. Даври китф",
    "arm_circ_rest": "а) дар ҳолати ором",
    "arm_circ_flex": "б) дар ҳолати кашида",
    "forearm_l": "5. Дарозии бозу",
    "hand_l": "6. Дарозии панҷа",
    "dynamo": "7. Динамометрия",
    "fat_title": "8. Ғафсии қабати равғани зери пӯст",
    "fat_tri": "а. болои мушаки се-сар",
    "fat_bi": "б. болои мушаки ду-сар",
    "fat_sub": "в. зери кунҷи поёнии шона",
    "fat_iliac": "г. болои канори устухони кос",
    "fat_pop": "д. дар чуқурии зери зону",
}


LABELS["tm"] = {
    **LABELS.get("uz", LABELS["ru"]),
    "title": "Gozleg kartasy",
    "fio": "Doly ady",
    "school": "Mekdep (bagca) ady",
    "settlement": "Ilat nokady",
    "birth_place": "Doglan yeri",
    "birth_date": "Doglan senesi",
    "father_nat": "Atasynyn milleti",
    "mother_nat": "Enesinin milleti",
    "living_since": "Bu sebitde yasap baslan wagty",
    "enrolled": "Mekdebe (bagca) kabul edilen wagty",
    "living_cond": "Durmus sertleri",
    "labor_regime": "Zahmet rezimi",
    "past_illnesses": "Geciren keselleri",
    "children_count": "Masgaladaky cagalar sany",
    "child_order": "Caganyn tertibi",
    "feeding_b": "Iymitlendirme gornusi",
    "marriage_b": "Ene-ata garyndaşlygy",
    "mother_health": "Enesinin saglyk yagdayy",
    "measure_results": "Olceg netijeleri",
    "date_col": "Sene",
    "indicator": "Gorkeziji",
    "gender": "Caganyn jynsy",
    "cat_phys": "I. Fiziki osus gorkezijileri",
    "lower_leg": "1. Asaky el-ayak bolumi",
    "lower_leg_len": "Asaky el-ayak uzynlygy",
    "pelvic": "3. Canak inligi",
    "thigh_l": "4. Son uzynlygy",
    "thigh_c": "5. Son aylawy",
    "calf_l": "6. Boldur uzynlygy",
    "calf_c": "7. Boldur aylawy",
    "foot_l": "8. Ayak dabanynyn uzynlygy",
    "teeth": "9. Dis sany",
    "menstr": "10. Hayzyn baslanysy",
    "cat_skull": "II. Bas suyegi sekilini anyklamak",
    "skull_long": "1. Uzynlygyna diametr",
    "skull_trans": "2. Keseligine diametr",
    "head_circ": "3. Bas aylawy",
    "forehead": "4. Manlay keseligine olcegi",
    "cat_face": "Yuz",
    "cat_chest": "Gursi",
    "height_stand": "1. Boy (dik)",
    "height_sit": "2. Boy (oturan)",
    "weight": "2. Agram",
    "trunk_l": "3. Beden uzynlygy",
    "chest_p": "5. Gursi aylawy (pauza)",
    "waist": "6. Bil aylawy",
    "cat_arm": "Yokarky el-ayak bolumi",
    "arm_l": "1. El uzynlygy",
    "shoulder_l": "2. Yelka uzynlygy",
    "shoulder_w": "3. Yelka inligi",
    "arm_circ": "4. Yelka aylawy",
    "forearm_l": "5. Bilek uzynlygy",
    "hand_l": "6. Penje uzynlygy",
    "dynamo": "7. Dinamometriya",
}
def generate_researcher_docx(data: dict, lang: str = "ru") -> io.BytesIO:
    if lang not in LABELS: lang = "ru"
    L = LABELS[lang]
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(0.5); section.bottom_margin = Cm(0.5)
        section.left_margin = Cm(1.0); section.right_margin = Cm(0.8)
        section.page_height = Cm(29.7); section.page_width = Cm(21.0)
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(L["title"].upper())
    run.bold = True
    run.font.size = Pt(14)
    run.font.name = "Times New Roman"
    title.paragraph_format.space_after = Pt(0)
    _add_horizontal_line(doc)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    master_table = doc.add_table(rows=1, cols=2)
    _remove_table_borders(master_table)
    master_table.width = Cm(19)
    master_table.columns[0].width = Cm(8.5); master_table.columns[1].width = Cm(8.5)
    left_cell, right_cell = master_table.rows[0].cells[0], master_table.rows[0].cells[1]
    def add_demo(cell, label, val, underline=False, bold_label=True):
        p = cell.add_paragraph()
        p.paragraph_format.space_after = Pt(1); p.paragraph_format.line_spacing = 1.0
        run_l = p.add_run(label + ": ")
        run_l.bold = bold_label
        run_l.font.size = Pt(8.5); run_l.font.name = "Times New Roman"
        if val:
            run_v = p.add_run(str(val))
            run_v.underline = underline; run_v.font.size = Pt(8.5); run_v.font.name = "Times New Roman"
    def T(val, capitalize=False):
        if not val: return val
        res = str(val)
        
        # Gender translation logic
        v_low = res.lower()
        if v_low in ["boy", "erkak"]:
            res = "O'g'il bola" if lang == "uz" else ("Эркек бала" if lang == "ky" else ("Писарбача" if lang == "tg" else "Мальчик"))
        elif v_low in ["girl", "ayol"]:
            res = "Qiz bola" if lang == "uz" else ("Кыз бала" if lang == "ky" else ("Духтарча" if lang == "tg" else "Девочка"))
        
        import re
        if lang == "ru":
            res = _translate_uz_to_ru(res)
            if re.search(r'[a-zA-Z]', res): res = _lat_to_cyr(res)
        elif lang == "tg":
            pass
        else:
            if re.search(r'[а-яА-ЯёЁўЎқҚғҒҳҲ]', res):
                res = _cyr_to_lat(res)
        if capitalize:
            res = _capitalize_name(res)
        return res
    left_cell.paragraphs[0].clear(); right_cell.paragraphs[0].clear()
    add_demo(left_cell, L["fio"], T(data.get("full_name"), capitalize=True))
    add_demo(left_cell, L["school"], T(data.get("school_name")))
    add_demo(left_cell, L["settlement"], T(data.get("settlement")))
    add_demo(left_cell, L["birth_place"], T(data.get("birth_place")))
    add_demo(left_cell, L["birth_date"], _format_date(data.get("birth_date")))
    add_demo(left_cell, L["gender"], T(data.get("gender")))
    nat_p = left_cell.add_paragraph()
    nat_p.paragraph_format.space_after = Pt(0); nat_p.paragraph_format.line_spacing = 1.0
    r1 = nat_p.add_run(L["father_nat"]+": "); r1.bold = True; r1.font.size = Pt(8.5); r1.font.name = "Times New Roman"
    r2 = nat_p.add_run(T(data.get("father_nationality")) or ""); r2.underline=False; r2.font.size=Pt(8.5); r2.font.name="Times New Roman"
    r3 = nat_p.add_run(" " + L["mother_nat"]+": "); r3.bold = True; r3.font.size = Pt(8.5); r3.font.name = "Times New Roman"
    r4 = nat_p.add_run(T(data.get("mother_nationality")) or ""); r4.underline=False; r4.font.size=Pt(8.5); r4.font.name="Times New Roman"
    add_demo(left_cell, L["living_since"], T(data.get("living_since")))
    add_demo(left_cell, L["enrolled"], _format_date(data.get("enrolled_date")))
    add_demo(left_cell, L["living_cond"], T(data.get("living_conditions")))
    add_demo(left_cell, L["labor_regime"], T(data.get("labor_regime")))
    add_demo(left_cell, L["past_illnesses"], T(data.get("past_illnesses")))
    fam_p = left_cell.add_paragraph()
    fam_p.paragraph_format.space_after = Pt(0); fam_p.paragraph_format.line_spacing = 1.0
    fr1 = fam_p.add_run(L["children_count"]+": "); fr1.bold = True; fr2 = fam_p.add_run(str(data.get("children_count") or "")); fr2.underline=False
    fr3 = fam_p.add_run(" " + L["child_order"]+": "); fr3.bold = True; fr4 = fam_p.add_run(str(data.get("child_order") or "")); fr4.underline=False
    for r in [fr1,fr2,fr3,fr4]: r.font.size=Pt(8.5); r.font.name = "Times New Roman"
    add_demo(left_cell, L["feeding_b"], T(data.get("feeding_type")))
    add_demo(left_cell, L["marriage_b"], T(data.get("parents_marriage")))
    add_demo(left_cell, L["mother_health"], T(data.get("mother_health_status")))
    res_title = left_cell.add_paragraph()
    res_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    res_run = res_title.add_run(L["measure_results"].upper())
    res_run.bold = True
    res_run.font.size = Pt(9)
    res_run.font.name = "Times New Roman"
    res_title.paragraph_format.space_before = Pt(4)
    res_title.paragraph_format.space_after = Pt(2)
    l_table = left_cell.add_table(rows=1, cols=5)
    l_table.style = 'Table Grid'; l_table.autofit = False; l_table.width = Cm(6.9)
    l_table.columns[0].width = Cm(0.3); l_table.columns[1].width = Cm(4.2)
    l_table.columns[2].width = Cm(0.8); l_table.columns[3].width = Cm(0.8); l_table.columns[4].width = Cm(0.8)
    hdr = l_table.rows[0].cells
    for i in [2,3,4]:
        _set_cell_font(hdr[i], L["date_col"], size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    _set_cell_font(hdr[0], "№", size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    _set_cell_font(hdr[1], L["indicator"] if "indicator" in L else "Показатель", size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    
    def add_l_row(idx, label, val, bold=False, is_cat=False):
        row = l_table.add_row().cells
        bg = "F2F2F2" if is_cat else None
        _set_cell_font(row[0], str(idx), size=7, bold=bold or is_cat, shading=bg, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(row[1], label, size=7, bold=bold or is_cat, shading=bg)
        for i in [2,3,4]:
            text_val = str(T(val)) if (val is not None and i == 2) else ""
            _set_cell_font(row[i], text_val, size=7, align=WD_ALIGN_PARAGRAPH.CENTER, shading=bg)

    add_l_row("I", L["cat_phys"], "", is_cat=True)
    add_l_row("1", L["lower_leg"], data.get('lower_leg_total') or data.get('lower_leg_spina_iliaca'), bold=True)
    add_l_row("", L["lower_leg_len"], data.get('lower_leg_length') or data.get('lower_leg_symphysion'))
    add_l_row("a", L["spina"], data.get('lower_leg_spina_iliaca'))
    add_l_row("b", L["symph"], data.get('lower_leg_symphysion'))
    add_l_row("2.a", L["tibiale"], data.get('tibiale_height'))
    add_l_row("3", L["pelvic"], data.get('pelvic_width'))
    add_l_row("4", L["thigh_l"], data.get('thigh_length'))
    add_l_row("5", L["thigh_c"], data.get('thigh_circumference'))
    add_l_row("6", L["calf_l"], data.get('calf_length'))
    add_l_row("7", L["calf_c"], data.get('calf_circumference'))
    add_l_row("8", L["foot_l"], data.get('foot_length'))
    add_l_row("9", L["teeth"], data.get('teeth_count'))
    
    # Show menstruation only for females
    gender_val = str(data.get('gender', '')).lower()
    if any(g in gender_val for g in ['ayol', 'girl', 'qiz', 'жен']):
        add_l_row("10", L["menstr"], data.get('menstruation_start'))

    add_l_row("II", L["cat_skull"], "", is_cat=True)
    add_l_row("1", L["skull_long"], data.get('skull_longitudinal'))
    add_l_row("2", L["skull_trans"], data.get('skull_transverse'))
    add_l_row("3", L["head_circ"], data.get('head_circumference'))
    add_l_row("4", L["forehead"], data.get('forehead_transverse'))
    add_l_row("5", L["skull_height"], data.get('skull_height'))
    # Right cell table starts directly at the top
    r_table = right_cell.add_table(rows=1, cols=5)
    r_table.style = 'Table Grid'; r_table.autofit = False; r_table.width = Cm(6.9)
    r_table.columns[0].width = Cm(0.3); r_table.columns[1].width = Cm(4.2)
    for i in range(2,5): r_table.columns[i].width = Cm(0.8)
    hdr_r = r_table.rows[0].cells
    _set_cell_font(hdr_r[0], "№", size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    _set_cell_font(hdr_r[1], L["indicator"] if "indicator" in L else "Показатель", size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    for i in range(2,5): _set_cell_font(hdr_r[i], L["date_col"], size=7, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, shading="E7E6E6")
    
    def add_r_row(idx, label, val, bold=False, is_cat=False):
        row = r_table.add_row().cells
        bg = "F2F2F2" if is_cat else None
        _set_cell_font(row[0], str(idx), size=7, bold=bold or is_cat, shading=bg, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(row[1], label, size=7, bold=bold or is_cat, shading=bg)
        for i in [2,3,4]:
            text_val = str(T(val)) if (val is not None and i == 2) else ""
            _set_cell_font(row[i], text_val, size=7, align=WD_ALIGN_PARAGRAPH.CENTER, shading=bg)
    
    add_r_row("", L["skull_base_title"], "", is_cat=True)
    add_r_row("1", L["skull_base_l"], data.get('skull_base_length'))
    add_r_row("2", L["skull_base_w"], data.get('skull_base_width'))
    add_r_row("", L["cat_face"], "", is_cat=True)
    add_r_row("1", L["face_biz"], data.get('face_bizygomatic'))
    add_r_row("2", L["face_big"], data.get('face_bigonial'))
    add_r_row("3", L["face_morph"], data.get('face_morphological_height'))
    add_r_row("4", L["face_phys"], data.get('face_physiognomic_height'))
    add_r_row("5", L["nose_h"], data.get('nose_height'))
    add_r_row("6", L["nose_w"], data.get('nose_width'))
    add_r_row("7", L["outer_oc"], data.get('outer_canthal_width'))
    add_r_row("8", L["inner_oc"], data.get('inner_canthal_width'))
    add_r_row("9", L["lips_h"], data.get('lips_mucosa_height'))
    add_r_row("10", L["mouth_w"], data.get('mouth_width'))
    add_r_row("", L["cat_chest"], "", is_cat=True)
    add_r_row("1", L["height_stand"], data.get('chest_standing_height'))
    add_r_row("", L["height_sit"], data.get('chest_sitting_height'))
    add_r_row("2", L["weight"], data.get('weight'))
    add_r_row("3", L["trunk_l"], data.get('trunk_length'))
    add_r_row("4", L["torso_l"], data.get('torso_length'))
    add_r_row("5", L["chest_p"], data.get('chest_circumference_pause'))
    add_r_row("", L["chest_i"], data.get('chest_circumference_inhale'))
    add_r_row("", L["chest_e"], data.get('chest_circumference_exhale'))
    add_r_row("6", L["waist"], data.get('waist_circumference'))
    add_r_row("7", L["abd_c"], data.get('abdomen_circumference'))
    add_r_row("8", L["upper_s"], data.get('upper_segment_length'))
    add_r_row("9", L["chest_td"], data.get('chest_transverse_diameter'))
    add_r_row("10", L["chest_ad"], data.get('chest_anteroposterior_diameter'))
    add_r_row("11", L["chest_h"], data.get('chest_height'))
    add_r_row("", L["cat_arm"], "", is_cat=True)
    add_r_row("1", L["arm_l"], data.get('arm_length'))
    add_r_row("2", L["shoulder_l"], data.get('shoulder_length'))
    add_r_row("3", L["shoulder_w"], data.get('shoulder_width'))
    add_r_row("4", L["arm_circ"], data.get('arm_circumference_total') or data.get('shoulder_circumference_rest'))
    add_r_row("a", L["arm_circ_rest"], data.get('shoulder_circumference_rest'))
    add_r_row("b", L["arm_circ_flex"], data.get('shoulder_circumference_flexed'))
    add_r_row("5", L["forearm_l"], data.get('forearm_length'))
    add_r_row("6", L["hand_l"], data.get('hand_length'))
    add_r_row("7", L["dynamo"], data.get('dynamometry'))
    add_r_row("8", L["fat_title"], "", is_cat=True)
    add_r_row("a", L["fat_tri"], data.get('fat_triceps'))
    add_r_row("б", L["fat_bi"], data.get('fat_biceps'))
    add_r_row("в", L["fat_sub"], data.get('fat_subscapular'))
    add_r_row("г", L["fat_iliac"], data.get('fat_iliac'))
    add_r_row("д", L["fat_pop"], data.get('fat_popliteal'))

    
    # Signature block at the bottom
    doc.add_paragraph().paragraph_format.space_before = Pt(10)
    sig_table = doc.add_table(rows=1, cols=2)
    _remove_table_borders(sig_table)
    sig_table.width = Cm(19)
    
    c1, c2 = sig_table.rows[0].cells
    _set_cell_font(c1, "", size=9)
    _set_cell_font(c2, T(L["date_col"] + ": " + _format_date(data.get("examination_date"))), size=9, align=WD_ALIGN_PARAGRAPH.RIGHT)
    
    buf = io.BytesIO(); doc.save(buf); buf.seek(0)
    return buf
