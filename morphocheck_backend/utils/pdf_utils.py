from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
from io import BytesIO
import datetime
import os
from typing import Dict, Any

def setup_font() -> str:
    """PDF uchun shriftni ishonchli tarzda sozlash"""
    try:
        # Font faylini loyiha ildizidagi fonts papkasidan qidirish
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        font_path = os.path.join(base_dir, 'fonts', 'DejaVuSans.ttf')
        
        if not os.path.exists(font_path):
            # Agar asosiy font topilmasa, standart shriftlardan foydalanish
            available_fonts = ['Helvetica-Bold', 'Helvetica', 'Times-Roman', 'Courier']
            for font in available_fonts:
                if font in pdfmetrics.getRegisteredFontNames():
                    return font
            return 'Helvetica'  # Eng kamida bu mavjud bo'lishi kerak
            
        pdfmetrics.registerFont(TTFont('DejaVu', font_path))
        return 'DejaVu'
    except Exception as e:
        print(f"Font sozlashda xato: {str(e)}")
        return 'Helvetica'

def validate_pdf_data(data: Dict[str, Any]) -> None:
    """Kirish ma'lumotlarini qat'iy tekshirish"""
    required_fields = {
        'first_name': str,
        'last_name': str,
        'region': str,
        'address': str,
        'age': (int, float),
        'gender': str,
        'height': (int, float),
        'weight': (int, float),
        'chest': (int, float),
        'head': (int, float),
        'analysis': dict,
        'advices': dict
    }
    
    # Majburiy maydonlarni tekshirish
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise ValueError(f"Quyidagi majburiy maydonlar topilmadi: {', '.join(missing_fields)}")
    
    # Maydon turlarini tekshirish
    type_errors = []
    for field, expected_type in required_fields.items():
        if not isinstance(data[field], expected_type) if not isinstance(expected_type, tuple) \
           else not any(isinstance(data[field], t) for t in expected_type):
            type_errors.append(f"{field} ({type(data[field]).__name__} o'rniga {expected_type.__name__} bo'lishi kerak)")
    
    if type_errors:
        raise TypeError(f"Maydon turlaridagi xatolar: {', '.join(type_errors)}")
    
    # Analysis va advices ichidagi maydonlarni tekshirish
    required_analysis_fields = ['bmi', 'bmi_category', 'somatotype', 'ideal_weight', 'weight_diff']
    missing_analysis = [f for f in required_analysis_fields if f not in data['analysis']]
    if missing_analysis:
        raise ValueError(f"Analysisda quyidagi maydonlar yetishmayapti: {', '.join(missing_analysis)}")
    
    required_advice_fields = ['specialist', 'nutrition', 'activity', 'checkups']
    missing_advice = [f for f in required_advice_fields if f not in data['advices']]
    if missing_advice:
        raise ValueError(f"Advicesda quyidagi maydonlar yetishmayapti: {', '.join(missing_advice)}")

def create_custom_styles(font_name: str) -> Dict[str, ParagraphStyle]:
    """Maxsus stillar yaratish"""
    styles = getSampleStyleSheet()
    
    custom_styles = {
        'Title': ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=20,
            alignment=1,
            spaceAfter=25,
            fontName=font_name,
            textColor=colors.HexColor("#2c3e50")
        ),
        'SectionTitle': ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceBefore=20,
            spaceAfter=12,
            fontName=font_name,
            textColor=colors.HexColor("#34495e"),
            backColor=colors.HexColor("#ecf0f1"),
            borderPadding=8,
            leftIndent=10
        ),
        'Highlight': ParagraphStyle(
            'Highlight',
            parent=styles['Normal'],
            fontSize=10,
            fontName=font_name,
            textColor=colors.HexColor("#7f8c8d")
        )
    }
    
    return custom_styles

def get_bmi_color(bmi_value: float) -> str:
    """BMI qiymatiga qarab rang berish"""
    if bmi_value < 18.5:
        return "#3498db"  # Moviy - kam vazn
    elif bmi_value < 25:
        return "#2ecc71"  # Yashil - normal
    elif bmi_value < 30:
        return "#f39c12"  # Sariq - ortiqcha vazn
    else:
        return "#e74c3c"  # Qizil - semizlik

def generate_pdf_report(data: Dict[str, Any]) -> BytesIO:
    """To'liq tekshirilgan va ishonchli PDF hisobot generatsiyasi"""
    try:
        # Ma'lumotlarni validatsiya qilish
        validate_pdf_data(data)
        
        # PDF hujjatini yaratish
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=40,  # Bosh joyni oshirdik
            bottomMargin=40
        )
        
        # Shriftni sozlash
        font_name = setup_font()
        custom_styles = create_custom_styles(font_name)
        styles = getSampleStyleSheet()
        
        # Elementlarni yig'ish
        elements = []
        
        # Sarlavha
        elements.append(Paragraph("🧬 MorphoCheck Pro Tahlil Hisoboti", custom_styles['Title']))
        elements.append(Spacer(1, 15))
        
        # Foydalanuvchi ma'lumotlari
        elements.append(Paragraph("👤 Shaxsiy Ma'lumotlar", custom_styles['SectionTitle']))
        
        user_info_data = [
            ["Ism-Familiya", f"{data['first_name']} {data['last_name']}"],
            ["Yosh", f"{data['age']} yosh"],
            ["Jins", "Erkak" if data['gender'].lower() in ['male', 'erkak', 'm'] else "Ayol"],
            ["Viloyat", data['region']],
            ["Manzil", data['address']]
        ]
        
        user_table = Table(user_info_data, colWidths=[2*inch, 4*inch])
        user_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e9ecef")),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(user_table)
        elements.append(Spacer(1, 20))
        
        # Asosiy o'lchovlar
        elements.append(Paragraph("📏 Asosiy O'lchovlar", custom_styles['SectionTitle']))
        
        measurements = [
            ["Parametr", "Qiymat", "Birlik"],
            ["Bo'y", f"{data['height']}", "sm"],
            ["Vazn", f"{data['weight']}", "kg"],
            ["Ko'krak aylanasi", f"{data['chest']}", "sm"],
            ["Bosh aylanasi", f"{data['head']}", "sm"]
        ]
        
        meas_table = Table(measurements, colWidths=[2.5*inch, 1.5*inch, 1*inch])
        meas_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3498db")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#dee2e6")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ]))
        elements.append(meas_table)
        elements.append(Spacer(1, 20))
        
        # Tahlil natijalari
        elements.append(Paragraph("📊 Tahlil Natijalari", custom_styles['SectionTitle']))
        
        analysis = data['analysis']
        bmi_color = get_bmi_color(float(analysis['bmi']))
        
        analysis_results = [
            ["Ko'rsatkich", "Qiymat", "Sharh"],
            ["Tana Massa Indeksi (BMI)", f"{analysis['bmi']:.1f}", analysis['bmi_category']],
            ["Somatotip", analysis['somatotype'], "Tana tuzilishi"],
            ["Ideal vazn", f"{analysis['ideal_weight']:.1f} kg", "Tavsiya etilgan"],
            ["Vazn farqi", f"{analysis['weight_diff']:+.1f} kg", "Idealga nisbatan"]
        ]
        
        analysis_table = Table(analysis_results, colWidths=[2.5*inch, 1.5*inch, 2*inch])
        analysis_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(bmi_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8f9fa")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#dee2e6")),
        ]))
        elements.append(analysis_table)
        elements.append(Spacer(1, 20))
        
        # Maslahatlar bo'limi
        elements.append(Paragraph("💡 Shaxsiy Maslahatlar", custom_styles['SectionTitle']))
        
        advices = data['advices']
        advice_data = [
            ["🎯 Mutaxassis", advices['specialist']],
            ["🍎 Oziqlanish", advices['nutrition']],
            ["🏃‍♂️ Jismoniy Faollik", advices['activity']],
            ["🏥 Tibbiy Tekshiruv", advices['checkups']]
        ]
        
        advice_table = Table(advice_data, colWidths=[1.5*inch, 4.5*inch])
        advice_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#9b59b6")),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#e8f6f3")),
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#fef9e7")),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#fdedec")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#2c3e50")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e9ecef")),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(advice_table)
        elements.append(Spacer(1, 25))
        
        # Yakuniy qism
        elements.append(Spacer(1, 20))
        
        # Sana va raqam
        date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        report_number = f"MCP-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        footer_data = [
            ["Hisobot sanasi:", date_str],
            ["Hisobot raqami:", report_number],
        ]
        
        footer_table = Table(footer_data, colWidths=[2*inch, 4*inch])
        footer_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ]))
        elements.append(footer_table)
        
        elements.append(Spacer(1, 20))
        
        # Imzolar
        signature_data = [
            ["", ""],
            ["_________________________", "_________________________"],
            ["Shifokor imzosi", "Bemor tasdiqi"]
        ]
        
        signature_table = Table(signature_data, colWidths=[2.5*inch, 2.5*inch])
        signature_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(signature_table)
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(
            "<i>Ushbu hisobot shaxsiy ma'lumot hisoblanadi va maxfiylikni talab qiladi</i>", 
            custom_styles['Highlight']
        ))

        # PDFni yaratish
        doc.build(elements)
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        raise RuntimeError(f"PDF generatsiyasida xato: {str(e)}")