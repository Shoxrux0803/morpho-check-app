from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Line
from io import BytesIO
import datetime
import os

__all__ = ["generate_pdf_report"]

LOGO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'morphocheck-logo.png'))


def setup_font():
    try:
        font_path = os.path.join(os.path.dirname(__file__), '..', 'fonts', 'DejaVuSans.ttf')
        pdfmetrics.registerFont(TTFont('DejaVu', font_path))
        return 'DejaVu'
    except Exception as e:
        print(f"Shrift ulashda xatolik: {e}")
        return 'Helvetica'


def create_header():
    """Sarlavha uchun chiziq yaratish"""
    drawing = Drawing(400, 1)
    drawing.add(Line(0, 0, 400, 0, strokeColor=colors.HexColor("#3498db"), strokeWidth=2))
    return drawing


def create_divider():
    """Ajratish chizig'i"""
    drawing = Drawing(400, 1)
    drawing.add(Line(0, 0, 400, 0, strokeColor=colors.HexColor("#bdc3c7"), strokeWidth=1))
    return drawing


def draw_watermark(canvas, doc):
    """PDF sahifasining orqa foniga hiraroq logo joylashtirish"""
    canvas.saveState()
    if os.path.exists(LOGO_PATH):
        # Shaffoflik (0.05 juda hira, o'qilishi oson bo'ladi)
        canvas.setFillAlpha(0.06)
        # Sahifa markazini topish
        page_width, page_height = A4
        img_width = 6.5 * inch
        img_height = 3.25 * inch # 2:1 nisbatda
        
        # Markazga joylashtirish
        x = (page_width - img_width) / 2
        y = (page_height - img_height) / 2
        
        canvas.drawImage(
            LOGO_PATH,
            x, y,
            width=img_width,
            height=img_height,
            mask='auto'
        )
    canvas.restoreState()


def generate_pdf_file(data: dict):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=30, 
        leftMargin=30, 
        topMargin=40, 
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    font_name = setup_font()
    
    # Stillarni yangilash
    styles['Normal'].fontName = font_name
    styles['Heading2'].fontName = font_name
    
    # Yangi stillar yaratish
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=20,
        alignment=1,
        spaceAfter=25,
        fontName=font_name,
        textColor=colors.HexColor("#2c3e50"),
        borderPadding=10
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        fontName=font_name,
        textColor=colors.HexColor("#34495e"),
        backColor=colors.HexColor("#ecf0f1"),
        borderPadding=5,
        leftIndent=10
    )
    
    highlight_style = ParagraphStyle(
        'Highlight',
        parent=styles['Normal'],
        fontSize=10,
        fontName=font_name,
        textColor=colors.HexColor("#7f8c8d"),
        alignment=0
    )
    
    elements = []

    # Sarlavha qismi
    elements.append(Paragraph("MORPHOCHECK PRO TAHLIL HISOBOTI", title_style))
    elements.append(create_header())
    elements.append(Spacer(1, 15))

    # Ma'lumotlarni olish (dict yoki obyekt holatida)
    first_name = data.get('first_name', '') if isinstance(data, dict) else getattr(data, 'first_name', '')
    last_name = data.get('last_name', '') if isinstance(data, dict) else getattr(data, 'last_name', '')
    age_y = data.get('age', '') if isinstance(data, dict) else getattr(data, 'age', '')
    age_m = data.get('age_months', 0) if isinstance(data, dict) else getattr(data, 'age_months', 0)
    age_d = data.get('age_days', 0) if isinstance(data, dict) else getattr(data, 'age_days', 0)
    
    gender = data.get('gender', '') if isinstance(data, dict) else getattr(data, 'gender', '')
    birth_date = data.get('birth_date', '') if isinstance(data, dict) else getattr(data, 'birth_date', '')
    examination_date = data.get('examination_date', '') if isinstance(data, dict) else getattr(data, 'examination_date', '')
    preschool_institution = data.get('preschool_institution', '') if isinstance(data, dict) else getattr(data, 'preschool_institution', '')
    region = data.get('region', '') if isinstance(data, dict) else getattr(data, 'region', '')
    district = data.get('district', '') if isinstance(data, dict) else getattr(data, 'district', '')
    address = data.get('address', '') if isinstance(data, dict) else getattr(data, 'address', '')
    
    age_str = f"{age_y} yosh"
    if age_m or age_d:
        age_str += f", {age_m} oy, {age_d} kun"

    personal_info_data = [
        ["Ism Familiya:", f"{first_name} {last_name}"],
        ["Yosh:", age_str],
        ["Jins:", gender],
        ["Tug'ilgan sanasi:", birth_date or '-'],
        ["Tekshiruv sanasi:", examination_date or '-'],
        ["Maktab/MTM:", preschool_institution or '-'],
        ["Viloyat:", region or '-'],
        ["Tuman:", district or '-'],
        ["Manzil:", address or '-']
    ]
    
    personal_table = Table(personal_info_data, colWidths=[2.5*inch, 3.5*inch])
    personal_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e9ecef")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(personal_table)
    elements.append(Spacer(1, 20))

    # Asosiy tahlil natijalari
    elements.append(Paragraph("ASOSIY TAHLIL NATIJALARI", section_title_style))
    
    # Analysis ma'lumotlarini olish
    analysis_data_dict = data.get('analysis', {}) if isinstance(data, dict) else getattr(data, 'analysis', {})
    
    analysis_table_data = [
        ["Parametr", "Qiymat", "Sharh"],
        ["BMI", f"{analysis_data_dict.get('bmi', 0):.1f}", analysis_data_dict.get('bmi_category', '')],
        ["Somatotip", analysis_data_dict.get('somatotype', ''), "Tana tuzilishi"],
        ["Me'yordagi vazn oraliqi", f"{analysis_data_dict.get('ideal_weight_range', {}).get('min', 0)} - {analysis_data_dict.get('ideal_weight_range', {}).get('max', 0)} kg", "Tavsiya etilgan oraliq"],
        ["Vazn farqi", f"{analysis_data_dict.get('weight_diff', 0):.1f} kg", "Joriy va ideal farqi"]
    ]
    
    # Yangi indekslar (HMAI, MII, ADI)
    detailed = analysis_data_dict.get('indices', {})
    if detailed:
        analysis_table_data.append(["HMAI (Adaptatsiya)", f"{detailed.get('hmai', '')}", detailed.get('hmai_desc', '')])
        analysis_table_data.append(["MII (Integratsiya)", f"{detailed.get('mii', '')}", detailed.get('mii_desc', '')])
        analysis_table_data.append(["ADI (Disgarmoniya)", f"{detailed.get('adi', '')}", detailed.get('adi_desc', '')])
    
    shoulder_ratio = analysis_data_dict.get('shoulder_ratio', 0)
    if shoulder_ratio:
        analysis_table_data.append(["Yelka proporsiyasi", f"{shoulder_ratio}%", "Bo'yga nisbatan"])
        
    thigh_ratio = analysis_data_dict.get('thigh_ratio', 0)
    if thigh_ratio:
        analysis_table_data.append(["Son proporsiyasi", f"{thigh_ratio}%", "Bo'yga nisbatan"])

    # Table widths: Total available ~540 points (7.5 inches)
    # Column 1: Label, Column 2: Value, Column 3: Description (Sharh)
    col_widths = [2.2*inch, 0.8*inch, 3.4*inch]
    
    # Wrap text in Paragraphs for better layout
    formatted_analysis_data = []
    for row in analysis_table_data:
        formatted_analysis_data.append([
            Paragraph(str(row[0]), styles['Normal']),
            Paragraph(str(row[1]), styles['Normal']),
            Paragraph(str(row[2]), styles['Normal'])
        ])

    t_analysis = Table(formatted_analysis_data, colWidths=col_widths)
    t_analysis.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3498db")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), font_name),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTNAME', (0, 1), (-1, -1), font_name),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#dee2e6")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_analysis)
    elements.append(Spacer(1, 25))

    # BMI ko'rsatkichi
    bmi_value = analysis_data_dict.get('bmi', 0)
    if bmi_value < 18.5:
        bmi_status = "Kam vazn"
        bmi_color = "#3498db"
    elif bmi_value < 25:
        bmi_status = "Normal"
        bmi_color = "#2ecc71"
    elif bmi_value < 30:
        bmi_status = "Ortiqcha vazn"
        bmi_color = "#f39c12"
    else:
        bmi_status = "Semizlik"
        bmi_color = "#e74c3c"
    
    bmi_info = [
        ["BMI Holati:", bmi_status],
        ["Tavsiya:", analysis_data_dict.get('bmi_category', '')]
    ]
    
    bmi_table = Table(bmi_info, colWidths=[2*inch, 4*inch])
    bmi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(bmi_color)),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BORDER', (0, 0), (-1, -1), 1, colors.white),
    ]))
    elements.append(bmi_table)
    elements.append(Spacer(1, 25))


    # Maslahatlar bo'limi
    elements.append(Paragraph("SHAXSIY TAVSIYALAR (OTA-ONALAR UCHUN)", section_title_style))
    
    detailed = analysis_data_dict.get('indices', {})
    advice_list = detailed.get('advice', [])
    
    if advice_list:
        advice_elements = []
        for item in advice_list:
            # Har bir maslahat uchun alohida Paragraph
            p = Paragraph(f"{item}", styles['Normal'])
            advice_elements.append([p])
        
        # Maslahatlar jadvali (chiroyli ko'rinish uchun)
        advice_table = Table(advice_elements, colWidths=[6*inch])
        advice_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fdfefe")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#d5dbdb")),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(advice_table)
    else:
        elements.append(Paragraph("• Maxsus tavsiyalar mavjud emas.", styles['Normal']))
    elements.append(Spacer(1, 30))

    # Yakuniy qism
    elements.append(create_divider())
    elements.append(Spacer(1, 20))
    
    footer_data = [
        ["Hisobot sanasi:", datetime.datetime.now().strftime("%Y-%m-%d %H:%M")],
        ["Hisobot raqami:", f"MCP-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"],
    ]
    
    footer_table = Table(footer_data, colWidths=[2*inch, 4*inch])
    footer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(footer_table)
    
    elements.append(Spacer(1, 25))
    
    # Imzo qismi
    signature_table_data = [
        ["", ""],
        ["_________________________", "_________________________"],
        ["Shifokor imzosi", "Bemor tasdiqi"]
    ]
    
    signature_table = Table(signature_table_data, colWidths=[2.5*inch, 2.5*inch])
    signature_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(signature_table)
    
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        "<i>Ushbu hisobot shaxsiy ma'lumot hisoblanadi va maxfiylikni talab qiladi</i>", 
        highlight_style
    ))

    if os.path.exists(LOGO_PATH):
        elements.append(Spacer(1, 20))
        elements.append(Image(LOGO_PATH, width=2.0*inch, height=1.0*inch))

    doc.build(elements, onFirstPage=draw_watermark, onLaterPages=draw_watermark)
    buffer.seek(0)
    return buffer


# Asosiy funksiya
def generate_pdf_report(data: dict):
    """PDF hisobotini yaratish"""
    return generate_pdf_file(data)