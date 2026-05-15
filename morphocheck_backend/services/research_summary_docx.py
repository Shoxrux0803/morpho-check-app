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


def _gender_label(gender):
    value = str(gender or "").lower()
    if "girl" in value or "ayol" in value or "qiz" in value or "female" in value:
        return "Qiz/Ayol"
    if "boy" in value or "erkak" in value or "o'g" in value or "og" in value or "male" in value:
        return "O'g'il/Erkak"
    return "Noma'lum"


def _age(record):
    birth_date = getattr(record, "birth_date", None)
    if not birth_date:
        return None
    try:
        b_date = datetime.strptime(str(birth_date), "%Y-%m-%d")
        exam_raw = getattr(record, "examination_date", None) or datetime.now().strftime("%Y-%m-%d")
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
    if f_value is None or not math.isfinite(f_value) or f_value < 0 or df1 <= 0 or df2 <= 0:
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


def _build_stats(records):
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
                "label": label,
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
                "z_normal": len([v for v in values if not sd or abs((v - avg) / sd) <= 2]),
                "z_high": len([v for v in values if sd and (v - avg) / sd > 2]),
            }
        )

    gender = []
    for key, label, unit in ANALYSIS_METRICS:
        groups = defaultdict(list)
        for record in records:
            value = _metric_value(record, key)
            gender_name = _gender_label(getattr(record, "gender", None))
            if value is not None and gender_name != "Noma'lum":
                groups[gender_name].append(value)
        male = groups["O'g'il/Erkak"]
        female = groups["Qiz/Ayol"]
        row = {"label": label, "unit": unit, "male_n": len(male), "female_n": len(female)}
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
            or "Noma'lum"
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
        ss_between = sum(len(values) * (_mean(values) - grand_mean) ** 2 for _, values in eligible)
        ss_within = sum(sum((v - _mean(values)) ** 2 for v in values) for _, values in eligible)
        df_between = len(eligible) - 1
        df_within = len(all_region_values) - len(eligible)
        ms_within = ss_within / df_within if df_within else 0
        f_value = (ss_between / df_between) / ms_within if ms_within else None
        region.update(
            {
                "f": f_value,
                "p": _f_test_p_value(f_value, df_between, df_within),
                "eta_squared": ss_between / (ss_between + ss_within) if ss_between + ss_within else None,
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
                values.append(_pearson([(x, y) for x, y in pairs if x is not None and y is not None]))
        correlation.append({"label": label_a, "values": values})

    pairs = [
        (_metric_value(record, "chest_standing_height"), _metric_value(record, "weight"))
        for record in records
    ]
    pairs = [(height, weight) for height, weight in pairs if height is not None and weight is not None]
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

    genders = Counter(_gender_label(getattr(record, "gender", None)) for record in records)
    settlements = Counter(
        str(getattr(record, "settlement", None) or getattr(record, "birth_place", None) or "Noma'lum").strip()
        or "Noma'lum"
        for record in records
    )
    schools = Counter(str(getattr(record, "school_name", None) or "Noma'lum").strip() or "Noma'lum" for record in records)
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


def _set_cell_text(cell, text, bold=False, size=9, align=WD_ALIGN_PARAGRAPH.LEFT, fill=None, color=None):
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
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if level == 1 else WD_ALIGN_PARAGRAPH.LEFT
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
            _set_cell_text(cells[index], value, size=8, align=WD_ALIGN_PARAGRAPH.CENTER if index else WD_ALIGN_PARAGRAPH.LEFT)
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


def generate_research_summary_docx(records, current_user=None, researcher=None, filters=None):
    stats = _build_stats(records)
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(1.2)
        section.bottom_margin = Cm(1.2)
        section.left_margin = Cm(1.4)
        section.right_margin = Cm(1.2)

    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(9)

    _heading(doc, "MORPHOCHECK ILMIY-STATISTIK DOCX HISOBOTI", 1)
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run(f"Hisobot sanasi: {datetime.now().strftime('%Y-%m-%d %H:%M')}").font.size = Pt(9)

    owner_name = getattr(researcher, "name", None) or getattr(current_user, "name", None) or "-"
    owner_email = getattr(researcher, "email", None) or getattr(current_user, "email", None) or "-"
    scope = "Barcha izlanuvchilar ma'lumotlari" if getattr(current_user, "role", "") == "superadmin" and researcher is None else "Izlanuvchiga tegishli ma'lumotlar"

    _heading(doc, "1. Umumiy svodka", 2)
    ages = stats["ages"]
    summary_rows = [
        ["Qamrov", scope],
        ["Izlanuvchi", f"{owner_name} ({owner_email})"],
        ["Jami yozuvlar", stats["count"]],
        ["Yosh oralig'i", f"{_fmt(min(ages), 1)} - {_fmt(max(ages), 1)} yil" if ages else "-"],
        ["O'rtacha yosh", f"{_fmt(_mean(ages), 1)} yil" if ages else "-"],
        ["Faol filtrlar", ", ".join(f"{k}={v}" for k, v in (filters or {}).items() if v not in (None, "")) or "Yo'q"],
    ]
    _table(doc, ["Ko'rsatkich", "Qiymat"], summary_rows, widths=[5, 11])

    _heading(doc, "2. Demografik infografikalar", 2)
    total = max(stats["count"], 1)
    gender_rows = [
        [name, count, f"{count / total * 100:.1f}%", _bar(count, total)]
        for name, count in stats["genders"].most_common()
    ]
    _table(doc, ["Jins", "N", "%", "Vizual ulush"], gender_rows or [["-", "-", "-", "-"]], widths=[4, 2, 2, 8])

    settlement_rows = [
        [name, count, f"{count / total * 100:.1f}%", _bar(count, total)]
        for name, count in stats["settlements"].most_common(10)
    ]
    _table(doc, ["Hudud", "N", "%", "Vizual ulush"], settlement_rows or [["-", "-", "-", "-"]], widths=[6, 2, 2, 7])

    _heading(doc, "3. Avtomatik statistik tahlil jadvallari", 2)
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
    _table(doc, ["Ko'rsatkich", "N", "Mean +/- SD", "Median", "Min-Max", "P5/P25/P75/P95"], descriptive_rows)

    bmi = next((item for item in stats["descriptive"] if item["key"] == "bmi"), None)
    if bmi:
        z_rows = [
            ["Z < -2", bmi.get("z_low", 0), _bar(bmi.get("z_low", 0), max(bmi.get("n", 0), 1))],
            ["-2 <= Z <= 2", bmi.get("z_normal", 0), _bar(bmi.get("z_normal", 0), max(bmi.get("n", 0), 1))],
            ["Z > 2", bmi.get("z_high", 0), _bar(bmi.get("z_high", 0), max(bmi.get("n", 0), 1))],
        ]
        _table(doc, ["BMI Z-score guruhi", "N", "Infografika"], z_rows, widths=[5, 2, 9])

    _heading(doc, "4. Guruhlar kesimidagi tahlil", 2)
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
        ["Ko'rsatkich", "Erkak N", "Erkak mean", "Ayol N", "Ayol mean", "Farq", "p", "Effect"],
        gender_analysis_rows,
    )

    region = stats["region"]
    region_rows = [
        [row["name"], row["n"], _fmt(row["mean"]), _fmt(row["sd"]), _bar(row["n"], total)]
        for row in region["groups"]
    ]
    _table(doc, ["Hudud", "N", "BMI mean", "SD", "Ulush"], region_rows or [["-", "-", "-", "-", "-"]])
    doc.add_paragraph(
        f"ANOVA: F={_fmt(region.get('f'))}; p={_p_label(region.get('p'))}; eta^2={_fmt(region.get('eta_squared'), 3)}"
    )

    _heading(doc, "5. Korrelyatsiya va regressiya", 2)
    corr_headers = [""] + [metric[1] for metric in ANALYSIS_METRICS]
    corr_rows = [
        [row["label"]] + [_fmt(value, 2) if value is not None else "-" for value in row["values"]]
        for row in stats["correlation"]
    ]
    _table(doc, corr_headers, corr_rows)

    regression = stats["regression"]
    equation = (
        f"Vazn = {_fmt(regression.get('intercept'))} + {_fmt(regression.get('slope'), 3)} x Bo'y"
        if regression.get("intercept") is not None
        else "Ma'lumot yetarli emas"
    )
    _table(
        doc,
        ["Model", "N", "R", "R2", "p"],
        [[equation, regression.get("n", 0), _fmt(regression.get("r"), 3), _fmt(regression.get("r2"), 3), _p_label(regression.get("p"))]],
        widths=[8, 2, 2, 2, 2],
    )

    _heading(doc, "6. Ilmiy izoh", 2)
    note = doc.add_paragraph()
    note.add_run(
        "Hisobot avtomatik shakllantirildi. Jadvallarda tavsifiy statistika, jinslar bo'yicha "
        "t-test, hududlar bo'yicha ANOVA, korrelyatsiya matritsasi va bo'y-vazn regressiya modeli "
        "keltirilgan. Natijalarni ilmiy ishda ishlatishda tanlanma hajmi, filtrlar va metodologik "
        "cheklovlar alohida ko'rsatilishi tavsiya etiladi."
    )

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
