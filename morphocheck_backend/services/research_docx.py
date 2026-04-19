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
        "fio": "Ф.И.О", "school": "Наименование школы", "settlement": "Населенный пункт",
        "birth_place": "Место рождения", "birth_date": "Дата рождения",
        "father_nat": "Национальность отца", "mother_nat": "матери",
        "living_since": "Срок проживания в местности", "enrolled": "Дата зачисления",
        "living_cond": "Бытовые условия", "labor_regime": "Режим труда",
        "past_illnesses": "Перенесенные заболевания", "children_count": "Кол-во детей",
        "child_order": "Ребенок №", "feeding_a": "Находится на: а) естественном",
        "feeding_b": "б) искусственном вскармливании", "marriage_a": "Брак: а) близкородственный",
        "marriage_b": "б) дальнородственный", "mother_health": "Здоровье матери",
        "measure_results": "Результаты измерения", "date_col": "Дата",
        "cat_phys": "I. Физическое развитие", "lower_leg": "1. Нижняя конечность",
        "lower_leg_len": "Длина ниж. кон.", "spina": "а. Ость подвзд. кости",
        "symph": "б. Лобковое сочленение", "tibiale": "2.а. Мыщелок большеб. кости",
        "pelvic": "3. Ширина таза", "thigh_l": "4. Длина бедра", "thigh_c": "5. Обхват бедра",
        "calf_l": "6. Длина голени", "calf_c": "7. Обхват голени", "foot_l": "8. Длина стопы",
        "teeth": "9. Кол-во зубов", "menstr": "10. Менструация",
        "cat_skull": "II. Форма черепа", "skull_long": "1. Продольный диам.",
        "skull_trans": "2. Поперечный разм.", "head_circ": "3. Обхват головы",
        "forehead": "4. Разм. лба", "skull_height": "5. Высотный диам.",
        "skull_base_title": "Основание черепа", "skull_base_l": "1. Длина", "skull_base_w": "2. Ширина",
        "cat_face": "Лицо", "face_biz": "1. Скуловой диам.", "face_big": "2. Нижнечел. диам.",
        "face_morph": "3. Морфол. высота", "face_phys": "4. Физионом. высота",
        "nose_h": "5. Высота носа", "nose_w": "6. Ширина носа", "outer_oc": "7. Наружная ширина глаз",
        "inner_oc": "8. Межглаз. ширина", "lips_h": "9. Высота губ", "mouth_w": "10. Ширина рта",
        "cat_chest": "Грудь", "height_stand": "1. Рост стоя", "height_sit": "2. Рост сидя",
        "weight": "2. Вес тела", "trunk_l": "3. Длина туловища", "torso_l": "4. Длина корпуса",
        "chest_p": "5. Окр. груди (пауза)", "chest_i": "-вдох", "chest_e": "-выдох",
        "waist": "6. Обхват талии", "abd_c": "7. Окр. живота", "upper_s": "8. Верхний отрезок",
        "chest_td": "9. Поперечный диам.", "chest_ad": "10. Передне-задний диам.",
        "chest_h": "11. Высота груди", "cat_arm": "Верхняя конечность",
        "arm_l": "1. Длина верх. кон.", "shoulder_l": "2. Длина плеча", "shoulder_w": "3. Ширина плеч",
        "arm_circ": "4. Обхват плеча", "arm_circ_rest": "а) спокойное", "arm_circ_flex": "б) напряженное",
        "forearm_l": "5. Длина предплечья", "hand_l": "6. Длина кисти", "dynamo": "7. Динамометрия",
        "fat_title": "8. Жировая клетчатка", "fat_tri": "а. трицепс", "fat_bi": "б. бицепс",
        "fat_sub": "в. лопатка", "fat_iliac": "г. подвздох", "fat_pop": "д. подколено"
    },
    "uz": {
        "title": "Tadqiqot kartasi",
        "fio": "F.I.SH", "school": "Muassasa nomi", "settlement": "Aholi punkti",
        "birth_place": "Tug'ilgan joyi", "birth_date": "Tug'ilgan sanasi",
        "father_nat": "Otasi millati", "mother_nat": "onasi",
        "living_since": "Yashash muddati", "enrolled": "Qabul sanasi",
        "living_cond": "Maishiy sharoitlar", "labor_regime": "Mehnat rejimi",
        "past_illnesses": "Kasalliklar", "children_count": "Bolalar soni",
        "child_order": "Farzand №", "feeding_a": "Bo'lgan: a) tabiiy",
        "feeding_b": "b) sun'iy emizishda", "marriage_a": "Nikoh: a) yaqin qarindosh",
        "marriage_b": "b) uzoq qarindosh", "mother_health": "Onasi salomatligi",
        "measure_results": "O'lchov natijalari", "date_col": "Sana",
        "cat_phys": "I. Jismoniy rivojlanish", "lower_leg": "1. Pastki oyoq-qo'l",
        "lower_leg_len": "Oyoq uzunligi", "spina": "a. Yonbosh o'qi",
        "symph": "b. Qov suyagi", "tibiale": "2.a. Boldir do'ngligi",
        "pelvic": "3. Chanoq kengligi", "thigh_l": "4. Son uzunligi", "thigh_c": "5. Son aylanasi",
        "calf_l": "6. Boldir uzunligi", "calf_c": "7. Boldir aylanasi", "foot_l": "8. Panja uzunligi",
        "teeth": "9. Tishlar soni", "menstr": "10. Menstruatsiya",
        "cat_skull": "II. Bosh suyagi shakli", "skull_long": "1. Uzun. diametr",
        "skull_trans": "2. Ko'ndalang o'lcham", "head_circ": "3. Bosh aylanasi",
        "forehead": "4. Peshona o'lchami", "skull_height": "5. Vertikal diametr",
        "skull_base_title": "Bosh asosi", "skull_base_l": "1. Uzunligi", "skull_base_w": "2. Kengligi",
        "cat_face": "Yuz", "face_biz": "1. Yanoq diametri", "face_big": "2. Jag' diametri",
        "face_morph": "3. Morfologik balandlik", "face_phys": "4. Fizionomik balandlik",
        "nose_h": "5. Burun balandligi", "nose_w": "6. Burun kengligi", "outer_oc": "7. Tashqi ko'z orasida",
        "inner_oc": "8. Ichki ko'z orasida", "lips_h": "9. Lab balandligi", "mouth_w": "10. Og'iz kengligi",
        "cat_chest": "Ko'krak qafasi", "height_stand": "1. Bo'yi tik", "height_sit": "2. Bo'yi o'tirib",
        "weight": "2. Vazni", "trunk_l": "3. Tana uzunligi", "torso_l": "4. Korpus uzunligi",
        "chest_p": "5. Ko'krak aylanasi", "chest_i": "-nafas olganda", "chest_e": "-nafas chiqarganda",
        "waist": "6. Bel aylanasi", "abd_c": "7. Qorin aylanasi", "upper_s": "8. Yuqori segment",
        "chest_td": "9. Ko'ndalang diametr", "chest_ad": "10. Old-orqa diametr",
        "chest_h": "11. Ko'krak balandligi", "cat_arm": "Yuqori oyoq-qo'l",
        "arm_l": "1. Qo'l uzunligi", "shoulder_l": "2. Yelka uzunligi", "shoulder_w": "3. Yelka kengligi",
        "arm_circ": "4. Yelka aylanasi", "arm_circ_rest": "a) tinch", "arm_circ_flex": "b) tarang",
        "forearm_l": "5. Bilak uzunligi", "hand_l": "6. Panja uzunligi", "dynamo": "7. Dinamometriya",
        "fat_title": "8. Yog' qatlami", "fat_tri": "a. uch boshli", "fat_bi": "b. ikki boshli",
        "fat_sub": "v. kurak osti", "fat_iliac": "g. yonbosh qirrasi", "fat_pop": "d. tizza orqasi"
    }
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
        import re
        if lang == "ru":
            res = _translate_uz_to_ru(res)
            if re.search(r'[a-zA-Z]', res): res = _lat_to_cyr(res)
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
    for k,v in [("1",L["lower_leg"]),("",L["lower_leg_len"]),("a",L["spina"]),("б",L["symph"]),("a",L["tibiale"]),("3",L["pelvic"]),("4",L["thigh_l"]),("5",L["thigh_c"]),("6",L["calf_l"]),("7",L["calf_c"]),("8",L["foot_l"]),("9",L["teeth"]),("10",L["menstr"])]:
        add_l_row(k, v, data.get(k) if isinstance(k,int) else None)
    # Manual data mapping for specific keys
    add_l_row("a", L["spina"], data.get('lower_leg_spina_iliaca'))
    add_l_row("б", L["symph"], data.get('lower_leg_symphysion'))
    add_l_row("a", L["tibiale"], data.get('tibiale_height'))
    add_l_row("3", L["pelvic"], data.get('pelvic_width'))
    add_l_row("4", L["thigh_l"], data.get('thigh_length'))
    add_l_row("5", L["thigh_c"], data.get('thigh_circumference'))
    add_l_row("6", L["calf_l"], data.get('calf_length'))
    add_l_row("7", L["calf_c"], data.get('calf_circumference'))
    add_l_row("8", L["foot_l"], data.get('foot_length'))
    add_l_row("9", L["teeth"], data.get('teeth_count'))
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
    add_r_row("4", L["arm_circ"], "")
    add_r_row("", L["arm_circ_rest"], data.get('shoulder_circumference_rest'))
    add_r_row("", L["arm_circ_flex"], data.get('shoulder_circumference_flexed'))
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
