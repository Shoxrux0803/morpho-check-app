from datetime import date, datetime


def calculate_age_precise(birth_date_str: str, exam_date_str: str = None):
    """
    Tug'ilgan sana va tekshiruv sanasidan yoshni (yil, oy, kun) aniq hisoblaydi.
    Format: YYYY-MM-DD
    """
    try:
        if not birth_date_str or birth_date_str == "Noma'lum":
            return None, 0, 0

        birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()

        if exam_date_str:
            exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
        else:
            exam_date = date.today()

        years = exam_date.year - birth_date.year
        months = exam_date.month - birth_date.month
        days = exam_date.day - birth_date.day

        if days < 0:
            months -= 1
            # Avvalgi oyning oxirgi kuni
            prev_month = exam_date.month - 1 if exam_date.month > 1 else 12
            prev_year = exam_date.year if exam_date.month > 1 else exam_date.year - 1
            import calendar

            _, last_day = calendar.monthrange(prev_year, prev_month)
            days += last_day

        if months < 0:
            years -= 1
            months += 12

        return max(0, years), max(0, months), max(0, days)
    except Exception as e:
        print(f"Age calculation error: {e}")
        return None, 0, 0
