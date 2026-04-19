import re
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

UZ_RU_MAP = {
    "o'zbek": "узбек", "uzbek": "узбек", "o‘zbek": "узбек", "ўзбек": "узбек",
    "tabiiy": "естественное", "табиий": "естественное",
    "sun'iy": "искусственное", "сунъий": "искусственное",
    "ona suti": "материнское молоко", "она сути": "материнское молоко",
    "yaqin qarindosh": "близкородственный", "яқин қариндош": "близкородственный",
    "emas": "не", "эмас": "не",
    "sog'lom": "здоров(а)", "соғлом": "здоров(а)",
    "ixtisoslashtirilgan": "специализированная", "ихтисослаштирилган": "специализированная",
    "davlat": "государственная", "давлат": "государственная",
    "maktab-internati": "школа-интернат", "мактаб-интернати": "школа-интернат",
    "viloyati": "область", "вилояти": "область",
    "shahri": "город", "шаҳри": "город",
    "a'lo darajada": "на отличном уровне", "аъло даражада": "на отличном уровне",
    "shaxsiy hovli": "частный двор", "шахсий ҳовли": "частный двор",
    "barcha qulayliklar": "все удобства", "барча қулайликлар": "все удобства",
    "mavjud": "имеется/имеются", "мавжуд": "имеется/имеются",
    "kunlik darslar": "ежедневные уроки", "кунлик дарслар": "ежедневные уроки",
    "sport to'garaklari": "спортивные секции", "спорт тўгараклари": "спортивные секции",
    "mavsumiy": "сезонный", "мавсумий": "сезонный",
    "surunkali": "хронические", "сурункали": "хронические",
    "kasalliklari": "заболевания", "касалликлари": "заболевания",
    "yilda": "в году", "йилда": "в году",
    "yoshgacha": "лет", "ёшгача": "лет",
    "tug'ilgandan buyon": "с рождения", "туғилгандан буён": "с рождения",
    "shu hududda": "в этой местности", "шу ҳудудда": "в этой местности",
}

def _translate_uz_to_ru(text):
    if not text or not isinstance(text, str): return text
    def normalize(s): return s.replace('‘', "'").replace('’', "'").replace('`', "'")
    text = normalize(text)
    sorted_keys = sorted([k for k in UZ_RU_MAP.keys() if ' ' in k], key=len, reverse=True)
    result_text = text
    for key in sorted_keys:
        if key.lower() in result_text.lower():
            pattern = re.compile(re.escape(key), re.IGNORECASE)
            def phrase_replacer(match):
                orig = match.group(0)
                translated = UZ_RU_MAP[key]
                if orig and orig[0].isupper(): return translated.capitalize()
                return translated
            result_text = pattern.sub(phrase_replacer, result_text)
    def replace_word(match):
        word = match.group(0)
        lower_word = word.lower()
        if lower_word in UZ_RU_MAP:
            translated = UZ_RU_MAP[lower_word]
            if word[0].isupper(): return translated.capitalize()
            return translated
        return word
    pattern = r"[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ']+"
    return re.sub(pattern, replace_word, result_text)

test_cases = [
    "12-ихтисослаштирилган давлат школа-интернати",
    "Ташкент область, Чирчиқ город",
    "Туғилгандан буён шу ҳудудда",
    "Аъло даражада (шахсий ҳовли, барча қулайликлар)",
    "Кунлик дарслар и спорт тўгараклари",
    "Грипп (мавсумий), корь (2022-йилда)",
    "Естественное (1.5 ёшгача материнское молоко)",
    "Близкородственный эмас",
    "Здоров(а), сурункали касалликлари нет"
]

for t in test_cases:
    print(f"Original: {t}")
    print(f"Translated: {_translate_uz_to_ru(t)}")
    print("-" * 30)
