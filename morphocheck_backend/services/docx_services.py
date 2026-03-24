"""
DOCX hisobot generatsiyasi — "Мактабгача таълим ёшидаги болалар учун
биоимпеданс + антропометрик текширув анкетаси" шаблонига mos.
Барча матнлар кирилл харфларида берилади.

Ключ нормализация: camelCase ва snake_case иккаласини ҳам қабул қилади.
"""

import re
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from io import BytesIO
from utils.translit import lat2cyr

__all__ = ["generate_docx_report"]


# ---------------------------------------------------------------------------
# Kalit nomi normalizator (camelCase → snake_case)
# ---------------------------------------------------------------------------

def _to_snake(name: str) -> str:
    """'examinationDate' → 'examination_date'"""
    s = re.sub(r'([A-Z])', r'_\1', name).lower().lstrip('_')
    return s


def _normalize_data(raw: dict) -> dict:
    """
    Barcha camelCase kalitlarni snake_case ga o'tkazadi va ikkala versiyani
    saqlaydi, shu tariqa har qanday tartibdan kelgan ma'lumotni qabul qiladi.
    """
    result = {}
    for k, v in raw.items():
        result[k] = v                   # original (camelCase yoki snake_case)
        snake = _to_snake(k)
        if snake != k:
            result[snake] = v           # snake_case varianti ham qo'shiladi
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
    2:  [13.4, 14.4, 16.0, 17.8, 19.7],
    3:  [13.1, 14.0, 15.5, 17.2, 18.9],
    4:  [12.8, 13.7, 15.2, 16.8, 18.5],
    5:  [12.7, 13.6, 15.1, 16.8, 18.6],
    6:  [12.7, 13.6, 15.2, 17.0, 19.1],
    7:  [12.7, 13.7, 15.4, 17.4, 19.8],
    8:  [12.8, 13.9, 15.7, 17.9, 20.6],
    9:  [13.0, 14.1, 16.1, 18.5, 21.5],
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
    2:  [13.3, 14.2, 15.7, 17.4, 19.2],
    3:  [13.0, 13.9, 15.4, 17.1, 18.9],
    4:  [12.7, 13.6, 15.2, 16.9, 18.8],
    5:  [12.6, 13.6, 15.2, 17.0, 19.1],
    6:  [12.6, 13.6, 15.3, 17.3, 19.6],
    7:  [12.7, 13.7, 15.5, 17.7, 20.2],
    8:  [12.8, 13.9, 15.8, 18.2, 20.9],
    9:  [13.0, 14.2, 16.2, 18.7, 21.6],
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
    table = _BMI_CENTILE_GIRLS if ("ayol" in gender or "qiz" in gender or "girl" in gender) else _BMI_CENTILE_BOYS
    age_key = min(max(age, 2), 18)
    refs = table.get(age_key, table.get(min(table.keys(), key=lambda x: abs(x - age_key))))
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
    table = _BMI_CENTILE_GIRLS if ("ayol" in gender or "qiz" in gender) else _BMI_CENTILE_BOYS
    age_key = min(max(age, 2), 18)
    refs = table.get(age_key, table.get(min(table.keys(), key=lambda x: abs(x - age_key))))
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
        return (True, False, False)   # default: yoshga mos

    if z < -2.0:
        return (False, True, False)   # Orqada qolgan
    elif z > 2.0:
        return (False, False, True)   # Oldinda
    else:
        return (True, False, False)   # Yoshga mos


# ---------------------------------------------------------------------------
# Word formatlashtirish yordamchi funksiyalari
# ---------------------------------------------------------------------------

def _set_cell_font(cell, text: str, bold: bool = False, size: int = 8,
                   align=WD_ALIGN_PARAGRAPH.LEFT):
    para = cell.paragraphs[0]
    para.alignment = align
    para.clear()
    run = para.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.name = "Times New Roman"
    # Layout optimization: reduce line spacing within cells
    para.paragraph_format.line_spacing = 1.0
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)
    para.paragraph_format.line_spacing = 1.0
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(0)


def _set_col_width(table, col_idx: int, width_cm: float):
    for cell in table.columns[col_idx].cells:
        cell.width = Cm(width_cm)


def _shade_cell(cell, fill_hex: str = "D9D9D9"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill_hex)
    tcPr.append(shd)


def _add_bold_centered_title(doc, text: str, size: int = 11) -> None:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(size)
    run.font.name = "Times New Roman"


def _section_head_paragraph(doc, text: str) -> None:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(10)
    run.font.name = "Times New Roman"
    para.paragraph_format.space_before = Pt(1)
    para.paragraph_format.space_after = Pt(1)


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


# ---------------------------------------------------------------------------
# Asosiy generatsiya funksiyasi
# ---------------------------------------------------------------------------

def generate_docx_file(raw_data: dict) -> BytesIO:
    # Barcha kalitlarni normallashtirish (camelCase → snake_case ham qo'shiladi)
    data = _normalize_data(raw_data)

    doc = Document()

    for section in doc.sections:
        section.top_margin    = Cm(0.7)
        section.bottom_margin = Cm(0.7)
        section.left_margin   = Cm(1.2)
        section.right_margin  = Cm(0.7)

    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(9)

    # -----------------------------------------------------------------------
    # SARLAVHA
    # -----------------------------------------------------------------------
    _add_bold_centered_title(
        doc,
        "МАКТАБГАЧА ТАЪЛИМ ЁШИДАГИ БОЛАЛАР УЧУН БИОИМПЕДАНС +\n"
        "АНТРОПОМЕТРИК ТЕКШИРУВ АНКЕТАСИ",
        size=11,
    )

    # -----------------------------------------------------------------------
    # I. УМУМИЙ МАЪЛУМОТЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, "I. Умумий маълумотлар")

    t1 = doc.add_table(rows=10, cols=3)
    t1.style = "Table Grid"

    _set_cell_font(t1.cell(0, 0), "№",         bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    _set_cell_font(t1.cell(0, 1), "Кўрсаткич", bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    _set_cell_font(t1.cell(0, 2), "Маълумот",  bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    for c in range(3):
        _shade_cell(t1.cell(0, c))

    # O'zgaruvchilar
    exam_date  = _val(data, "examination_date")
    birth_date = _val(data, "birth_date")
    age_val    = _val(data, "age")
    age_m      = _val(data, "age_months", "0")
    age_d      = _val(data, "age_days", "0")
    gender_raw = _val(data, "gender").lower()
    preschool  = lat2cyr(_val(data, "preschool_institution"))
    region_raw = _val(data, "region").lower()
    district_s = _val(data, "district").lower()
    address_s  = _val(data, "address").lower()
    
    region_val = lat2cyr(_val(data, "region"))
    district_val = lat2cyr(_val(data, "district"))
    address_val = lat2cyr(_val(data, "address"))
    full_address = ", ".join(filter(None, [region_val, district_val, address_val]))

    # Жинси checkbox
    is_boy   = any(k in gender_raw for k in ("erkak", "o'g'il", "ogil", "ўғил"))
    boy_box  = _checkbox(is_boy)
    girl_box = _checkbox(not is_boy)

    # Яшаш ҳудуди checkbox
    combined = f"{region_raw} {district_s} {address_s}"
    is_city     = any(k in combined for k in ("shahar", "shahri", "шаҳар", "city"))
    city_box    = _checkbox(is_city)
    village_box = _checkbox(not is_city)

    #Age string
    age_str = f"{age_val} йил" if age_val else ""
    if age_m != "0" or age_d != "0":
        age_str += f", {age_m} ой, {age_d} кун"

    full_name_raw = _val(data, "full_name") or data.get("name") or f"{_val(data, 'first_name')} {_val(data, 'last_name')}".strip()
    full_name_val = lat2cyr(str(full_name_raw)) if full_name_raw else ""
    id_code_val   = _val(data, "id_code")

    rows_i = [
        ("1", "Боланинг исм фамилияси",       full_name_val),
        ("2", "ID код",             id_code_val),
        ("3", "Текширув санаси",              exam_date),
        ("4", "Боланинг ёши",                 age_str),
        ("5", "Жинси",                        f"{boy_box} Ўғил    {girl_box} Қиз"),
        ("6", "Туғилган санаси",              birth_date),
        ("7", "Яшаш ҳудуди",                  f"{city_box} Шаҳар    {village_box} Қишлоқ"),
        ("8", "Мактабгача таълим муассасаси", preschool),
        ("9", "Яшаш манзили",                 full_address),
    ]

    for i, (num, label, val) in enumerate(rows_i, start=1):
        _set_cell_font(t1.cell(i, 0), num,   size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t1.cell(i, 1), label, size=9)
        _set_cell_font(t1.cell(i, 2), val,   size=9)

    _set_col_width(t1, 0, 1.0)
    _set_col_width(t1, 1, 6.5)
    _set_col_width(t1, 2, 8.5)

    # -----------------------------------------------------------------------
    # II. АСОСИЙ АНТРОПОМЕТРИК КЎРСАТКИЧЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, "II. Асосий антропометрик кўрсаткичлар (ЖССТ стандарти)")

    t2 = doc.add_table(rows=11, cols=7)
    t2.style = "Table Grid"

    headers2 = ["№", "Кўрсаткич", "Би", "Қийм", "Кўрсаткич", "Би", "Қийм"]
    for c, h in enumerate(headers2):
        _set_cell_font(t2.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _shade_cell(t2.cell(0, c))

    left_metrics = [
        ("1",  "Бўй узунлиги",         "см", _fmt(_val(data, "height"))),
        ("2",  "Тана вазни",            "кг", _fmt(_val(data, "weight"))),
        ("3",  "Бош айланаси",          "см", _fmt(_val(data, "head"))),
        ("4",  "Кўкрак айланаси",       "см", _fmt(_val(data, "chest"))),
        ("5",  "Бел айланаси",          "см", _fmt(_val(data, "waist"))),
        ("6",  "Елка узунлиги",         "см", _fmt(_val(data, "shoulder_length"))),
        ("7",  "Елка кенглиги",         "см", _fmt(_val(data, "shoulder_breadth"))),
        ("8",  "Елка айланаси",         "см", _fmt(_val(data, "shoulder_circumference"))),
        ("9",  "Билак/тирсак узунлиги", "см", _fmt(_val(data, "arm_elbow_length"))),
        ("10", "Қўл панжа узунлиги",    "см", _fmt(_val(data, "hand_length"))),
    ]

    right_metrics = [
        ("Сон узунлиги",        "см", _fmt(_val(data, "thigh_length"))),
        ("Сон айланаси",        "см", _fmt(_val(data, "thigh_circumference"))),
        ("Болдир узунлиги",     "см", _fmt(_val(data, "calf_length"))),
        ("Болдир айланаси",     "см", _fmt(_val(data, "calf_circumference"))),
        ("Оёқ панжа узунлиги", "см", _fmt(_val(data, "foot_length"))),
    ]

    for i, (num, label, unit, qiymat) in enumerate(left_metrics, start=1):
        _set_cell_font(t2.cell(i, 0), num,    size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t2.cell(i, 1), label,  size=9)
        _set_cell_font(t2.cell(i, 2), unit,   size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t2.cell(i, 3), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

    for i, (label, unit, qiymat) in enumerate(right_metrics, start=1):
        _set_cell_font(t2.cell(i, 4), label,  size=9)
        _set_cell_font(t2.cell(i, 5), unit,   size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t2.cell(i, 6), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

    _set_col_width(t2, 0, 0.8)
    _set_col_width(t2, 1, 4.2)
    _set_col_width(t2, 2, 0.8)
    _set_col_width(t2, 3, 2.0)
    _set_col_width(t2, 4, 4.2)
    _set_col_width(t2, 5, 0.8)
    _set_col_width(t2, 6, 2.0)

    # -----------------------------------------------------------------------
    # III. ҲИСОБЛАНГАН АНТРОПОМЕТРИК ИНДЕКСЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, "III. Ҳисобланган антропометрик индекслар")

    analysis = data.get("analysis", {}) or {}
    try:
        bmi_f = float(analysis.get("bmi", 0) or 0)
    except (TypeError, ValueError):
        bmi_f = 0.0
    try:
        z_val = float(analysis.get("z_score", 0) or 0)
    except (TypeError, ValueError):
        z_val = 0.0
    try:
        age_int = int(float(_val(data, "age") or 0))
    except (TypeError, ValueError):
        age_int = 0

    bmi_str    = f"{bmi_f:.1f}" if bmi_f else ""
    bmi_cat    = str(analysis.get("bmi_category", "") or "")
    zscore_str = f"{z_val:.2f}" if z_val else ""

    # Centil va sog'lomlik yo'lagi
    centil_str  = _calc_centile(bmi_f, age_int, gender_raw)
    corridor    = _calc_health_corridor(bmi_f, age_int, gender_raw)

    # Yangi indekslarni olish
    detailed = analysis.get("indices", {})
    z_h_str = f"{detailed.get('z_h', 0):.2f}"
    z_w_str = f"{detailed.get('z_w', 0):.2f}"
    z_bmi_str = f"{detailed.get('z_bmi', 0):.2f}"
    
    hmai_val = detailed.get("hmai", 0)
    hmai_desc = detailed.get("hmai_desc", "")
    
    mii_val = detailed.get("mii", 0)
    mii_desc = detailed.get("mii_desc", "")
    
    adi_val = detailed.get("adi", 0)
    adi_desc = detailed.get("adi_desc", "")

    t3 = doc.add_table(rows=10, cols=4)
    t3.style = "Table Grid"

    headers3 = ["№", "Индекс", "М", "Баҳолаш"]
    for c, h in enumerate(headers3):
        _set_cell_font(t3.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _shade_cell(t3.cell(0, c))

    indices = [
        ("1", "BMI (кг/м²)",       bmi_str,    bmi_cat),
        ("2", "Бўй-ёш Z-score",    z_h_str,    ""),
        ("3", "Вазн-ёш Z-score",   z_w_str,    ""),
        ("4", "BMI-ёш Z-score",    z_bmi_str,  ""),
        ("5", "Центил интервали",  centil_str, ""),
        ("6", "Соғломлик йўлаги",  corridor,   ""),
        ("7", "HMAI (адаптация)",  f"{hmai_val}", hmai_desc),
        ("8", "MII (интеграция)",  f"{mii_val}",  mii_desc),
        ("9", "ADI (дисгармония)", f"{adi_val}",  adi_desc),
    ]

    for i, (num, label, m_val, baholash) in enumerate(indices, start=1):
        _set_cell_font(t3.cell(i, 0), num,      size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t3.cell(i, 1), label,    size=9)
        _set_cell_font(t3.cell(i, 2), m_val,    size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t3.cell(i, 3), baholash, size=9)

    _set_col_width(t3, 0, 0.8)
    _set_col_width(t3, 1, 7.0)
    _set_col_width(t3, 2, 2.0)
    _set_col_width(t3, 3, 5.2)

    # -----------------------------------------------------------------------
    # IV. БИОИМПЕДАНС ТАҲЛИЛ НАТИЖАЛАРИ
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, "IV. Биоимпеданс таҳлил натижалари")

    t4 = doc.add_table(rows=8, cols=5)
    t4.style = "Table Grid"

    headers4 = ["№", "Кўрсаткич", "Би", "Қиймат", "Норма"]
    for c, h in enumerate(headers4):
        _set_cell_font(t4.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _shade_cell(t4.cell(0, c))

    bio_results = analysis.get("indices", {})
    
    bio_rows = [
        ("1", "TBW (%)",   "%",  f"{bio_results.get('tbw_percent', '')}", f"{bio_results.get('tbw_norm', '')}"),
        ("2", "Ёғ тўқимаси (фоизда)",   "%",  f"{bio_results.get('fm_percent', '')}",  f"{bio_results.get('fm_norm', '')}"),
        ("3", "Ёғ массаси (вазнда)",    "кг", f"{bio_results.get('fm', '')}",          f"{bio_results.get('fm_kg_norm', '')}"),
        ("4", "Мушак массаси",          "кг", f"{bio_results.get('muscle_mass', '')}", f"{bio_results.get('muscle_norm', '')}"),
        ("5", "Суяк минерал массаси",   "кг", f"{bio_results.get('bone_mass', '')}",   f"{bio_results.get('bone_norm', '')}"),
        ("6", "ACM (%)",  "%",  f"{bio_results.get('acm_percent', '')}", f"{bio_results.get('acm_norm', '')}"),
        ("7", "Висцерал ёғ даражаси",  "—",  f"{bio_results.get('visceral_fat', '')}", f"{bio_results.get('visceral_norm', '')}"),
    ]

    for i, (num, label, unit, qiymat, norma) in enumerate(bio_rows, start=1):
        _set_cell_font(t4.cell(i, 0), num,    size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t4.cell(i, 1), label,  size=9)
        _set_cell_font(t4.cell(i, 2), unit,   size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t4.cell(i, 3), qiymat, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t4.cell(i, 4), norma,  size=9, align=WD_ALIGN_PARAGRAPH.CENTER)

    _set_col_width(t4, 0, 0.8)
    _set_col_width(t4, 1, 6.0)
    _set_col_width(t4, 2, 1.2)
    _set_col_width(t4, 3, 3.5)
    _set_col_width(t4, 4, 3.5)

    # -----------------------------------------------------------------------
    # V. МОРФОЛОГИК ВА БИОЛОГИК БАҲОЛАШ
    # -----------------------------------------------------------------------
    _section_head_paragraph(doc, "V. Морфологик ва биологик баҳолаш")

    # Z-score asosida rivojlanish darajasi checkboxini aniqlash
    dev_mos, dev_orqada, dev_oldinda = _dev_level(z_val)

    t5 = doc.add_table(rows=5, cols=3)
    t5.style = "Table Grid"

    headers5 = ["№", "Кўрсаткич", "Натижа"]
    for c, h in enumerate(headers5):
        _set_cell_font(t5.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _shade_cell(t5.cell(0, c))

    dev_text = (
        f"{_checkbox(dev_mos)} Ёшга мос  "
        f"{_checkbox(dev_orqada)} Оркада қолган  "
        f"{_checkbox(dev_oldinda)} Олдинда"
    )

    # Morphological assessment data
    m_type = bio_results.get("morphological_type", "")
    b_age = bio_results.get("biological_age_status", "")
    s_trend = bio_results.get("secular_trend", "")

    morph_type_text = (
        f"{_checkbox(m_type == 'astenik')} Астеник  "
        f"{_checkbox(m_type == 'normostenik')} Нормостеник  "
        f"{_checkbox(m_type == 'giperstenik')} Гиперстеник"
    )
    bio_age_text = (
        f"{_checkbox(b_age == 'mos')} Мос  "
        f"{_checkbox(b_age == 'mos_emas')} Мос эмас"
    )
    secular_trend_text = (
        f"{_checkbox(s_trend == 'yoq')} Йўқ  "
        f"{_checkbox(s_trend == 'mavjud')} Мавжуд"
    )

    morph_rows = [
        ("1", "Жисмоний ривиш даражаси",   dev_text),
        ("2", "Морфологик тип",             morph_type_text),
        ("3", "Биологик ёшга мослик",       bio_age_text),
        ("4", "Секуляр тенденция белгиси",  secular_trend_text),
    ]

    for i, (num, label, result) in enumerate(morph_rows, start=1):
        _set_cell_font(t5.cell(i, 0), num,    size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _set_cell_font(t5.cell(i, 1), label,  size=9)
        _set_cell_font(t5.cell(i, 2), result, size=9)

    _set_col_width(t5, 0, 0.8)
    _set_col_width(t5, 1, 7.0)
    _set_col_width(t5, 2, 7.2)


    # -----------------------------------------------------------------------
    # VI. ЭТИК РОЗИЛИК ВА ИМЗОЛАР
    # -----------------------------------------------------------------------
    _section_head_paragraph(
        doc,
        "VI. Этик розилик ва текширувчи мутахасислар (ота-она / васий) имзоси:"
    )

    t7 = doc.add_table(rows=5, cols=2)
    t7.style = "Table Grid"

    headers7 = ["Мутахасис", "Имзо / Сана"]
    for c, h in enumerate(headers7):
        _set_cell_font(t7.cell(0, c), h, bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
        _shade_cell(t7.cell(0, c))

    for i, label in enumerate(
        ["Ота-она (ёки васий)", "Ҳамшира (муассаса)",
         "Мутахасис 1/Мутахасис 2", "Консультант"],
        start=1,
    ):
        _set_cell_font(t7.cell(i, 0), label, size=9)
        _set_cell_font(t7.cell(i, 1), "",    size=9)

    _set_col_width(t7, 0, 9.5)
    _set_col_width(t7, 1, 5.5)

    # -----------------------------------------------------------------------
    # Bufferga saqlash
    # -----------------------------------------------------------------------
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def generate_docx_report(data: dict) -> BytesIO:
    """Asosiy chaqiruv funksiyasi."""
    return generate_docx_file(data)
