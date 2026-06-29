# morphocheck_backend/utils/i18n.py

import contextvars
import re
from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

# Context variable to hold the preferred language for the current request context.
# Supported languages: "uz", "ru", "en", "tr". Default: "uz".
request_lang = contextvars.ContextVar("request_lang", default="uz")

SUPPORTED_LANGUAGES = {"uz", "ru", "en", "tr"}

# Translation dictionary mapping default Uzbek messages/errors to target languages.
I18N_DICTIONARY: Dict[str, Dict[str, str]] = {
    # System & Authentication Errors
    "Not authenticated": {
        "uz": "Not authenticated",
        "ru": "Не авторизован",
        "en": "Not authenticated",
        "tr": "Giriş yapılmadı",
    },
    "Could not validate credentials": {
        "uz": "Could not validate credentials",
        "ru": "Не удалось проверить учетные данные",
        "en": "Could not validate credentials",
        "tr": "Kimlik bilgileri doğrulanamadı",
    },
    "User not found": {
        "uz": "User not found",
        "ru": "Пользователь не найден",
        "en": "User not found",
        "tr": "Kullanıcı bulunamadı",
    },
    "Foydalanuvchi bloklangan yoki o'chirilgan": {
        "uz": "Foydalanuvchi bloklangan yoki o'chirilgan",
        "ru": "Пользователь заблокирован или удален",
        "en": "User is blocked or deleted",
        "tr": "Kullanıcı engellendi veya silindi",
    },
    "Sizda ushbu amalni bajarish uchun ruxsat yo'q.": {
        "uz": "Sizda ushbu amalni bajarish uchun ruxsat yo'q.",
        "ru": "У вас нет прав для выполнения этого действия.",
        "en": "You do not have permission to perform this action.",
        "tr": "Bu işlemi gerçekleştirmek için yetkiniz yok.",
    },
    "Faqat superadmin uchun": {
        "uz": "Faqat superadmin uchun",
        "ru": "Только для суперадминистратора",
        "en": "Only for superadmin",
        "tr": "Yalnızca süper admin için",
    },
    "Ma'lumotlar mavjud emas": {
        "uz": "Ma'lumotlar mavjud emas",
        "ru": "Данные отсутствуют",
        "en": "No data available",
        "tr": "Veri mevcut değil",
    },
    "Faqat .xlsx fayl qabul qilinadi": {
        "uz": "Faqat .xlsx fayl qabul qilinadi",
        "ru": "Принимаются только файлы .xlsx",
        "en": "Only .xlsx files are accepted",
        "tr": "Yalnızca .xlsx dosyaları kabul edilir",
    },
    "Researcherni tanlash faqat superadmin uchun": {
        "uz": "Researcherni tanlash faqat superadmin uchun",
        "ru": "Выбор исследователя доступен только суперадминистратору",
        "en": "Selecting researcher is restricted to superadmin",
        "tr": "Araştırmacı seçimi yalnızca süper admin ile sınırlıdır",
    },
    "Researcher topilmadi": {
        "uz": "Researcher topilmadi",
        "ru": "Исследователь не найден",
        "en": "Researcher not found",
        "tr": "Araştırmacı bulunamadı",
    },
    "Excel faylda ma'lumot topilmadi": {
        "uz": "Excel faylda ma'lumot topilmadi",
        "ru": "Данные в файле Excel не найдены",
        "en": "No data found in Excel file",
        "tr": "Excel dosyasında veri bulunamadı",
    },
    "Import uchun mos ustunlar topilmadi": {
        "uz": "Import uchun mos ustunlar topilmadi",
        "ru": "Соответствующие столбцы для импорта не найдены",
        "en": "No matching columns found for import",
        "tr": "İçe aktarma için uygun sütunlar bulunamadı",
    },
    "Import qilish uchun ma'lumot topilmadi": {
        "uz": "Import qilish uchun ma'lumot topilmadi",
        "ru": "Данные для импорта не найдены",
        "en": "No data found to import",
        "tr": "İçe aktarılacak veri bulunamadı",
    },
    "Filterga mos ma'lumotlar topilmadi": {
        "uz": "Filterga mos ma'lumotlar topilmadi",
        "ru": "Данные по указанным фильтрам не найдены",
        "en": "No data matching filters found",
        "tr": "Filtrelere uygun veri bulunamadı",
    },
    "Ma'lumot topilmadi": {
        "uz": "Ma'lumot topilmadi",
        "ru": "Информация не найдена",
        "en": "Data not found",
        "tr": "Veri bulunamadı",
    },
    "Ruxsat etilmagan": {
        "uz": "Ruxsat etilmagan",
        "ru": "Доступ запрещен",
        "en": "Unauthorized",
        "tr": "Yetkisiz",
    },
    "Ushbu hisobotni yuklab olishga huquqingiz yo'q": {
        "uz": "Ushbu hisobotni yuklab olishga huquqingiz yo'q",
        "ru": "У вас нет прав для скачивания этого отчета",
        "en": "You do not have permission to download this report",
        "tr": "Bu raporu indirme yetkiniz yok",
    },
    "Ushbu hujjatni yuklab olishga huquqingiz yo'q": {
        "uz": "Ushbu hujjatni yuklab olishga huquqingiz yo'q",
        "ru": "У вас нет прав для скачивания этого документа",
        "en": "You do not have permission to download this document",
        "tr": "Bu belgeyi indirme yetkiniz yok",
    },
    "Sozlama topilmadi": {
        "uz": "Sozlama topilmadi",
        "ru": "Настройка не найдена",
        "en": "Setting not found",
        "tr": "Ayar bulunamadı",
    },
    "Matn bo'sh bo'lmasligi kerak.": {
        "uz": "Matn bo'sh bo'lmasligi kerak.",
        "ru": "Текст не должен быть пустым.",
        "en": "Text must not be empty.",
        "tr": "Metin boş olmamalıdır.",
    },
    "Serverda ichki xatolik yuz berdi.": {
        "uz": "Serverda ichki xatolik yuz berdi.",
        "ru": "Произошла внутренняя ошибка сервера.",
        "en": "An internal server error occurred.",
        "tr": "Sunucuda dahili bir hata oluştu.",
    },

    # Validation Errors (Pydantic / schemas.py)
    "Matn maydoni string bo'lishi kerak": {
        "uz": "Matn maydoni string bo'lishi kerak",
        "ru": "Текстовое поле должно быть строкой",
        "en": "Text field must be a string",
        "tr": "Metin alanı string olmalıdır",
    },
    "Raqamli maydon bool bo'lishi mumkin emas": {
        "uz": "Raqamli maydon bool bo'lishi mumkin emas",
        "ru": "Числовое поле не может быть булевым",
        "en": "Numeric field cannot be boolean",
        "tr": "Sayısal alan boolean olamaz",
    },
    "Raqamli maydon chekli son bo'lishi kerak": {
        "uz": "Raqamli maydon chekli son bo'lishi kerak",
        "ru": "Числовое поле должно быть конечным числом",
        "en": "Numeric field must be a finite number",
        "tr": "Sayısal alan sonlu bir sayı olmalıdır",
    },
    "Jins erkak yoki ayol bo'lishi kerak": {
        "uz": "Jins erkak yoki ayol bo'lishi kerak",
        "ru": "Пол должен быть мужским или женским",
        "en": "Gender must be male or female",
        "tr": "Cinsiyet erkek veya kadın olmalıdır",
    },
    "Sana YYYY-MM-DD formatida bo'lishi kerak": {
        "uz": "Sana YYYY-MM-DD formatida bo'lishi kerak",
        "ru": "Дата должна быть в формате YYYY-MM-DD",
        "en": "Date must be in YYYY-MM-DD format",
        "tr": "Tarih YYYY-MM-DD formatında olmalıdır",
    },
    "Majburiy maydonlar bo'sh": {
        "uz": "Majburiy maydonlar bo'sh",
        "ru": "Обязательные поля пусты",
        "en": "Required fields are empty",
        "tr": "Zorunlu alanlar boş",
    },
    "Yosh, oy yoki kunlardan kamida biri 0 dan katta bo'lishi kerak": {
        "uz": "Yosh, oy yoki kunlardan kamida biri 0 dan katta bo'lishi kerak",
        "ru": "Хотя бы один из параметров (возраст, месяцы или дни) должен быть больше 0",
        "en": "At least one of age, months, or days must be greater than 0",
        "tr": "Yaş, ay veya günlerden en az biri 0'dan büyük olmalıdır",
    },
    "Bola ma'lumotlarini qayta ishlash uchun vasiyning roziligi tasdiqlanishi kerak": {
        "uz": "Bola ma'lumotlarini qayta ishlash uchun vasiyning roziligi tasdiqlanishi kerak",
        "ru": "Для обработки данных ребенка требуется подтверждение согласия опекуна",
        "en": "Guardian's consent must be confirmed to process the child's data",
        "tr": "Çocuğun verilerini işlemek için velinin onayı onaylanmalıdır",
    },
    "Rozilik bergan ota-ona yoki vasiyning ismi kiritilishi kerak": {
        "uz": "Rozilik bergan ota-ona yoki vasiyning ismi kiritilishi kerak",
        "ru": "Необходимо ввести имя давшего согласие родителя или опекуна",
        "en": "The name of the consenting parent or guardian must be entered",
        "tr": "Onay veren ebeveyn veya vasinin adı girilmelidir",
    },
    "Ko'rik sanasi kelajakda bo'lishi mumkin emas": {
        "uz": "Ko'rik sanasi kelajakda bo'lishi mumkin emas",
        "ru": "Дата осмотра не может быть в будущем",
        "en": "Examination date cannot be in the future",
        "tr": "Muayene tarihi gelecekte olamaz",
    },
    "BMI amaliy diapazondan tashqarida": {
        "uz": "BMI amaliy diapazondan tashqarida",
        "ru": "ИМТ выходит за рамки практического диапазона",
        "en": "BMI is out of practical range",
        "tr": "BMI pratik aralığın dışında",
    },
    "Ko'krak aylanasi bo'yga nisbatan mos emas": {
        "uz": "Ko'krak aylanasi bo'yga nisbatan mos emas",
        "ru": "Окружность груди не соответствует росту",
        "en": "Chest circumference is not proportional to height",
        "tr": "Göğüs çevresi boya göre uygun değil",
    },
    "Bel aylanasi bo'yga nisbatan mos emas": {
        "uz": "Bel aylanasi bo'yga nisbatan mos emas",
        "ru": "Окружность талии не соответствует росту",
        "en": "Waist circumference is not proportional to height",
        "tr": "Bel çevresi boya göre uygun değil",
    },
    "Bosh aylanasi bo'yga nisbatan mos emas": {
        "uz": "Bosh aylanasi bo'yga nisbatan mos emas",
        "ru": "Окружность головы не соответствует росту",
        "en": "Head circumference is not proportional to height",
        "tr": "Baş çevresi boya göre uygun değil",
    },
    "Tug'ilgan sana ko'rik sanasidan keyin bo'lishi mumkin emas": {
        "uz": "Tug'ilgan sana ko'rik sanasidan keyin bo'lishi mumkin emas",
        "ru": "Дата рождения не может быть позже даты осмотра",
        "en": "Birth date cannot be after the examination date",
        "tr": "Doğum tarihi muayene tarihinden sonra olamaz",
    },
    "Yosh tug'ilgan sana va ko'rik sanasiga mos emas": {
        "uz": "Yosh tug'ilgan sana va ko'rik sanasiga mos emas",
        "ru": "Возраст не соответствует дате рождения и дате осмотра",
        "en": "Age does not match the birth date and examination date",
        "tr": "Yaş doğum tarihi ve muayene tarihi ile eşleşmiyor",
    },
    "Parol kamida 8 ta belgidan iborat bo'lishi kerak": {
        "uz": "Parol kamida 8 ta belgidan iborat bo'lishi kerak",
        "ru": "Пароль должен состоять минимум из 8 символов",
        "en": "Password must be at least 8 characters long",
        "tr": "Şifre en az 8 karakter olmalıdır",
    },
    "Parolda kamida 1 ta katta harf bo'lishi kerak": {
        "uz": "Parolda kamida 1 ta katta harf bo'lishi kerak",
        "ru": "Пароль должен содержать минимум 1 заглавную букву",
        "en": "Password must contain at least 1 uppercase letter",
        "tr": "Şifre en az 1 büyük harf içermelidir",
    },
    "Parolda kamida 1 ta kichik harf bo'lishi kerak": {
        "uz": "Parolda kamida 1 ta kichik harf bo'lishi kerak",
        "ru": "Пароль должен содержать минимум 1 строчную букву",
        "en": "Password must contain at least 1 lowercase letter",
        "tr": "Şifre en az 1 küçük harf içermelidir",
    },
    "Parolda kamida 1 ta raqam bo'lishi kerak": {
        "uz": "Parolda kamida 1 ta raqam bo'lishi kerak",
        "ru": "Пароль должен содержать минимум 1 цифру",
        "en": "Password must contain at least 1 number",
        "tr": "Şifre en az 1 rakam içermelidir",
    },
    "Parollar mos emas": {
        "uz": "Parollar mos emas",
        "ru": "Пароли не совпадают",
        "en": "Passwords do not match",
        "tr": "Şifreler eşleşmiyor",
    },
    "Joriy parol noto'g'ri": {
        "uz": "Joriy parol noto'g'ri",
        "ru": "Неверный текущий пароль",
        "en": "Current password is incorrect",
        "tr": "Mevcut şifre yanlış",
    },
    "Parol muvaffaqiyatli o'zgartirildi": {
        "uz": "Parol muvaffaqiyatli o'zgartirildi",
        "ru": "Пароль успешно изменен",
        "en": "Password changed successfully",
        "tr": "Şifre başarıyla değiştirildi",
    },
    "Noto'g'ri foydalanuvchi roli": {
        "uz": "Noto'g'ri foydalanuvchi roli",
        "ru": "Неверная роль пользователя",
        "en": "Invalid user role",
        "tr": "Geçersiz kullanıcı rolü",
    },
    "Field required": {
        "uz": "Maydon kiritilishi shart",
        "ru": "Поле обязательно для заполнения",
        "en": "Field required",
        "tr": "Alan zorunludur",
    },
}


def parse_accept_language(header_value: str) -> str:
    """
    Parses Accept-Language header and returns best matched language among: uz, ru, en, tr.
    Accepts values like: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    """
    if not header_value:
        return "uz"

    languages = []
    try:
        parts = header_value.split(",")
        for part in parts:
            part = part.strip()
            if not part:
                continue
            lang_code = part.split(";")[0].strip().lower()
            # Normalize e.g. ru-RU -> ru, uz-UZ -> uz
            if "-" in lang_code:
                lang_code = lang_code.split("-")[0]
            elif "_" in lang_code:
                lang_code = lang_code.split("_")[0]

            # Extract quality factor if it exists
            q = 1.0
            if ";q=" in part:
                try:
                    q = float(part.split(";q=")[1].strip())
                except ValueError:
                    pass
            languages.append((lang_code, q))
    except Exception:
        return "uz"

    # Sort languages by quality factor descending
    languages.sort(key=lambda x: x[1], reverse=True)

    for lang_code, _ in languages:
        if lang_code in SUPPORTED_LANGUAGES:
            return lang_code

    return "uz"


def translate(text: str, lang: Optional[str] = None) -> str:
    """
    Translates input text using the dictionary mappings.
    If translation or language doesn't exist, falls back to the original text.
    """
    if not text:
        return text

    target_lang = lang or request_lang.get() or "uz"
    if target_lang not in SUPPORTED_LANGUAGES:
        target_lang = "uz"

    # Exact dictionary match lookup
    clean_text = text.strip()
    if clean_text in I18N_DICTIONARY:
        return I18N_DICTIONARY[clean_text].get(target_lang, text)

    # Partial dynamic mapping for custom value errors (e.g. "Bemor topilmadi: id=XX")
    # Pattern: Bemor topilmadi: id=XX -> Пациент не найден: id=XX / Patient not found: id=XX
    if clean_text.startswith("Bemor topilmadi: id="):
        patient_id = clean_text.split("id=")[-1]
        translations = {
            "uz": f"Bemor topilmadi: id={patient_id}",
            "ru": f"Пациент не найден: id={patient_id}",
            "en": f"Patient not found: id={patient_id}",
            "tr": f"Hasta bulunamadı: id={patient_id}",
        }
        return translations.get(target_lang, text)

    # Pattern: PDF yaratishda xato: XX / DOCX yaratishda xato: XX
    if "yaratishda xato" in clean_text or "generatsiyasida xato" in clean_text:
        translations = {
            "uz": "Hisobot yaratishda xatolik yuz berdi",
            "ru": "Произошла ошибка при генерации отчета",
            "en": "An error occurred during report generation",
            "tr": "Rapor oluşturulurken bir hata oluştu",
        }
        return translations.get(target_lang, text)

    # Check for lists like "Majburiy maydonlar bo'sh: firstName, lastName"
    if clean_text.startswith("Majburiy maydonlar bo'sh:"):
        fields = clean_text.split(":")[-1]
        translations = {
            "uz": f"Majburiy maydonlar bo'sh:{fields}",
            "ru": f"Обязательные поля пусты:{fields}",
            "en": f"Required fields are empty:{fields}",
            "tr": f"Zorunlu alanlar boş:{fields}",
        }
        return translations.get(target_lang, text)

    return text


class I18nMiddleware(BaseHTTPMiddleware):
    """
    Middleware that extracts the requested language from the client
    either via a query param '?lang=ru' or via Accept-Language header.
    It saves this language in request_lang contextvar for context-aware translations.
    """

    async def dispatch(self, request: Request, call_next):
        # 1. Check for query parameter
        lang = request.query_params.get("lang")

        # 2. Check for Accept-Language header if query param not provided or invalid
        if not lang or lang not in SUPPORTED_LANGUAGES:
            accept_lang = request.headers.get("accept-language", "")
            lang = parse_accept_language(accept_lang)

        # 3. Save to context
        token = request_lang.set(lang)

        try:
            response = await call_next(request)
            return response
        finally:
            # Clean up contextvar
            request_lang.reset(token)


# Aliasing the translate function
_ = translate


async def i18n_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Custom exception handler for HTTPExceptions.
    Translates the exception detail string before returning it.
    """
    lang = request_lang.get()
    translated_detail = translate(exc.detail, lang)
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": translated_detail},
        headers=getattr(exc, "headers", None),
    )


async def i18n_validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom exception handler for RequestValidationError (Pydantic).
    Translates Pydantic validation errors before returning them to client.
    """
    lang = request_lang.get()
    errors = exc.errors()
    translated_errors = []

    for error in errors:
        msg = error.get("msg", "")
        # Remove typical pydantic prefix for value errors to translate clean message
        prefix = ""
        clean_msg = msg
        if msg.startswith("Value error, "):
            prefix = "Value error, "
            clean_msg = msg[len("Value error, "):]

        translated_msg = translate(clean_msg, lang)
        error["msg"] = f"{prefix}{translated_msg}"
        translated_errors.append(error)

    return JSONResponse(
        status_code=422,
        content={"detail": translated_errors},
    )
