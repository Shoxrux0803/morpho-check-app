"""Kyrgyz report text normalization helpers.

Some saved analyses contain Uzbek dynamic descriptions. Reports call these
helpers so old records also render in Kyrgyz when ``lang == "ky"``.
"""

import re
import unicodedata
from typing import Any


KY_BMI_CATEGORIES = {
    "v_low": "Салмак жетишсиздиги (айкын)",
    "low": "Салмак жетишсиздиги",
    "normal": "Норма",
    "overweight": "Ашыкча салмак",
    "obese": "Семирүү",
}


KZ_BMI_CATEGORIES = {
    "v_low": "Айқын салмақ тапшылығы",
    "low": "Салмақ тапшылығы",
    "normal": "Норма",
    "overweight": "Артық салмақ",
    "obese": "Семіздік",
}


TG_BMI_CATEGORIES = {
    "v_low": "Камвазнии шадид",
    "low": "Камвазнӣ",
    "normal": "Меъёр",
    "overweight": "Вазни зиёдатӣ",
    "obese": "Фарбеҳӣ",
}



TM_BMI_CATEGORIES = {
    "v_low": "Agram yetmezciligi (aydyn)",
    "low": "Agram yetmezciligi",
    "normal": "Kada",
    "overweight": "Artyk agram",
    "obese": "Semizlik",
}
_KY_REPLACEMENTS = [
    (r"Noma'?lum", "Белгисиз"),
    (r"Ma'?lumot yo'?q", "Маалымат жок"),
    (r"Toshkent shahri", "Ташкент шаары"),
    (r"\bshahri\b", "шаары"),
    (r"\bshahar\b", "шаар"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Салмак жетишсиздиги (айкын)"),
    (r"Vazn yetishmovchiligi", "Салмак жетишсиздиги"),
    (r"Ortiqcha vazn", "Ашыкча салмак"),
    (r"Semizlik", "Семирүү"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Норма (15-85-сентиль)"),
    (r"Меъёр \(15[-–]85[-–]сентил\)", "Норма (15-85-сентиль)"),
    (r"Me'?yor", "Норма"),
    (r"Меъёрда \(-1 … \+1 SD\)", "Нормада (-1 … +1 SD)"),
    (r"Меъёр", "Норма"),
    (r"Tavsiya etilgan oraliq", "Сунушталган аралык"),
    (r"Idealdan og'?ish", "Идеалдан четтөө"),
    (r"Somatotip", "Соматотип"),
    (r"normost\s*enik", "нормостеник"),
    (r"normostenik", "нормостеник"),
    (r"astenik", "астеник"),
    (r"giperstenik", "гиперстеник"),
    (r"muhitga nisbatan optimal morfologik moslashuv", "чөйрөгө карата оптималдуу морфологиялык ыңгайлашуу"),
    (r"akseleratsiya / yuqori morfologik rivojlanish", "акселерация / жогорку морфологиялык өнүгүү"),
    (r"moslashuv stresi yoki rivojlanishning sekinlashishi", "ыңгайлашуу стресси же өнүгүүнүн жайлашы"),
    (r"normal o'?rtacha morfologik muvozanat", "нормалдуу орточо морфологиялык тең салмак"),
    (r"somatik komponentlarning yuqori integratsiyasi", "соматикалык компоненттердин жогорку интеграциясы"),
    (r"past morfologik nomutanosiblik", "төмөн морфологиялык дисбаланс"),
    (r"uyg'?un rivojlanish", "гармониялуу өнүгүү"),
    (r"o'?rtacha nomutanosiblik", "орточо дисбаланс"),
    (r"yuqori darajadagi nomutanosiblik", "жогорку деңгээлдеги дисбаланс"),
    (r"Xavf past", "Коркунуч төмөн"),
    (r"Xavf o'?rtacha", "Коркунуч орточо"),
    (r"Xavf yuqori", "Коркунуч жогору"),
    (r"morfologik-kompozitsion xavf past", "морфологиялык-композициялык коркунуч төмөн"),
    (r"morfologik-kompozitsion xavf o'?rtacha", "морфологиялык-композициялык коркунуч орточо"),
    (r"morfologik-kompozitsion xavf yuqori", "морфологиялык-композициялык коркунуч жогору"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спортко багыттоо (болжолдуу)"),
    (r"Qo'?shimcha yo'?nalishlar", "Кошумча багыттар"),
    (r"Vazn yetishmasligi sabablarini aniqlash zarur", "Салмак жетишсиздигинин себептерин аныктоо зарыл"),
    (r"Салмак жетишсиздиги sabablarini aniqlash zarur", "Салмак жетишсиздигинин себептерин аныктоо зарыл"),
    (r"\bSabab\b", "Себеби"),
    (r"tana ko'?rsatkichlari muvozanatli", "дене көрсөткүчтөрү тең салмактуу"),
    (r"yengil vazn va nisbatan nozik tana tuzilishi", "салмагы жеңил жана дене түзүлүшү салыштырмалуу назик"),
    (r"morfologik uyg'?unlik yaxshi", "морфологиялык шайкештик жакшы"),
    (r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin", "Акыркы тандоодо баланын кызыгуусу, машыктыруучунун баасы жана дарыгердин уруксаты эске алынсын"),
    (r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi", "Педиатр же диетологдун кароосу сунушталат"),
    (r"Vazn yetishmasligi sabablarini aniqlash zarur", "Салмак жетишсиздигинин себептерин аныктоо зарыл"),
    (r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting", "Калориясы жогору жана белокко бай тамактануу тартибине өтүңүз"),
    (r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning", "Күнүнө 5-6 жолу аз-аздан тамактаныңыз"),
    (r"Bolada normostenik tip: uyg'?un rivojlanmoqda", "Балада нормостеник тип: шайкеш өнүгүүдө"),
    (r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling", "Абалды сактоо үчүн тең салмактуу тамактануу режимин карманыңыз"),
    (r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring", "Күчтүү кардио көнүгүүлөрдү азайтып, булчуң массасын көбөйтүүгө багытталган көнүгүүлөрдү аткарыңыз"),
    (r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi", "Кан анализи (гемоглобин), гормоналдык фон жана ашказан-ичеги системасын текшерүү сунушталат"),
    (r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang", "Мезгилдик жашылча-жемиштердин түрдүүлүгүн камсыз кылыңыз"),
    (r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang", "Чыгармачылык жана интеллектуалдык жүктөмдөрдү физикалык активдүүлүк менен алмаштырыңыз"),
    (r"Toza suv ichish rejimini nazorat qiling", "Таза суу ичүү режимин көзөмөлдөңүз"),
    (r"yengil atletika", "жеңил атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "сүзүү"),
]


def ky_text(value: Any, lang: str = "uz") -> str:
    """Translate common saved Uzbek report fragments to Kyrgyz."""
    if value is None:
        return ""
    text = str(value)
    if lang != "ky" or not text:
        return text
    for pattern, replacement in _KY_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


_KZ_REPLACEMENTS = [
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спортқа бағыттау (шамамен)"),
    (r"Qo'?shimcha yo'?nalishlar", "Қосымша бағыттар"),
    (r"\bSabab\b", "Себебі"),
    (r"tana ko'?rsatkichlari muvozanatli", "дене көрсеткіштері теңгерімді"),
    (r"yengil vazn va nisbatan nozik tana tuzilishi", "салмағы жеңіл және дене бітімі салыстырмалы түрде нәзік"),
    (r"morfologik uyg'?unlik yaxshi", "морфологиялық үйлесімділік жақсы"),
    (r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin", "Соңғы таңдауда баланың қызығушылығы, жаттықтырушы бағасы және дәрігер рұқсаты ескерілсін"),
    (r"yengil atletika", "жеңіл атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"Салмақ жетіспеушілігіnin", "Салмақ жетіспеушілігінің"),
    (r"Салмақ тапшылығыnin", "Салмақ тапшылығының"),
    (r"Ақуызға бай жоғары калориялы диетаға көшіңіз", "Ақуызға бай, жоғары калориялы тамақтану тәртібіне көшіңіз"),
    (r"Күніне 5-6 рет аз порциямен тамақтаныңыз", "Күніне 5-6 рет шағын порциялармен тамақтаныңыз"),
]

_RU_REPLACEMENTS = [
    (r"Toshkent shahri", "город Ташкент"),
    (r"\bToshkent\b", "Ташкент"),
    (r"\bShayxontohur\b", "Шайхантахур"),
    (r"\bshahri\b", "город"),
    (r"\bshahar\b", "город"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спортивная ориентация (примерно)"),
    (r"Qo'?shimcha yo'?nalishlar", "Дополнительные направления"),
    (r"\bSabab\b", "Причина"),
    (r"tana ko'?rsatkichlari muvozanatli", "показатели тела сбалансированы"),
    (r"yengil vazn va nisbatan nozik tana tuzilishi", "лёгкий вес и относительно худощавое телосложение"),
    (r"morfologik uyg'?unlik yaxshi", "морфологическая гармония хорошая"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "При окончательном выборе следует учитывать интерес ребёнка, оценку тренера и разрешение врача",
    ),
    (r"yengil atletika", "лёгкая атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "плавание"),
]

_EN_REPLACEMENTS = [
    (r"Noma'?lum", "Unknown"),
    (r"Ma'?lumot yo'?q", "No data"),
    (r"Toshkent shahri", "Tashkent city"),
    (r"\bToshkent\b", "Tashkent"),
    (r"\bShayxontohur\b", "Shaykhantakhur"),
    (r"\bshahri\b", "city"),
    (r"\bshahar\b", "city"),
    (r"\bastenik\b", "Asthenic"),
    (r"\bnormostenik\b", "Normosthenic"),
    (r"\bgiperstenik\b", "Hypersthenic"),
    (r"\bmos_emas\b", "Does not match"),
    (r"\bmos\b", "Matches"),
    (r"\bmavjud\b", "Present"),
    (r"\byoq\b", "Absent"),
]

_TG_REPLACEMENTS = [
    (r"Noma'?lum", "Номаълум"),
    (r"Ma'?lumot yo'?q", "Маълумот нест"),
    (r"Toshkent shahri", "шаҳри Тошканд"),
    (r"\bToshkent\b", "Тошканд"),
    (r"\bShayxontohur\b", "Шайхонтоҳур"),
    (r"\bshahri\b", "шаҳр"),
    (r"\bshahar\b", "шаҳр"),
    (r"\btumani\b", "ноҳия"),
    (r"\btuman\b", "ноҳия"),
    (r"\bmahalla\b", "маҳалла"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Камвазнии шадид"),
    (r"Vazn yetishmovchiligi", "Камвазнӣ"),
    (r"Ortiqcha vazn", "Вазни зиёдатӣ"),
    (r"Semizlik", "Фарбеҳӣ"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Меъёр (15-85-сентил)"),
    (r"Me'?yor", "Меъёр"),
    (r"Tavsiya etilgan oraliq", "Диапазони тавсияшуда"),
    (r"Idealdan og'?ish", "Дуршавӣ аз меъёр"),
    (r"Somatotip", "Соматотип"),
    (r"\bastenik\b", "астеник"),
    (r"\bnormostenik\b", "нормостеник"),
    (r"\bgiperstenik\b", "гиперстеник"),
    (r"muhitga nisbatan optimal morfologik (moslashuv|мутобиқшавӣ)", "мутобиқшавии оптималии морфологӣ нисбат ба муҳит"),
    (r"akseleratsiya / yuqori morfologik rivojlanish", "акселератсия / рушди баланди морфологӣ"),
    (r"moslashuv stresi yoki rivojlanishning sekinlashishi", "стресси мутобиқшавӣ ё сустшавии рушд"),
    (r"somatik komponentlarning yuqori integratsiyasi", "интегратсияи баланди ҷузъҳои соматикӣ"),
    (r"normal o'?rtacha morfologik muvozanat", "мувозинати миёнаи морфологии меъёрӣ"),
    (r"past morfologik nomutanosiblik", "номувофиқати пасти морфологӣ"),
    (r"uyg'?un rivojlanish", "рушди ҳамоҳанг"),
    (r"o'?rtacha nomutanosiblik", "номувофиқати миёна"),
    (r"yuqori darajadagi nomutanosiblik", "номувофиқати дараҷаи баланд"),
    (r"morfologik-kompozitsion xavf past", "хавфи морфологӣ-композитсионӣ паст"),
    (r"morfologik-kompozitsion xavf o'?rtacha", "хавфи морфологӣ-композитсионӣ миёна"),
    (r"morfologik-kompozitsion xavf yuqori", "хавфи морфологӣ-композитсионӣ баланд"),
    (r"O'?rtacha xavf \(Adipoz fenotip bosqichi\)", "Хавфи миёна (марҳилаи фенотипи адипозӣ)"),
    (r"Yuqori xavf \(Ortiqcha yog'? va mushak yetishmovchiligi\)", "Хавфи баланд (зиёдатии чарб ва норасоии мушак)"),
    (r"Low risk", "Хавфи паст"),
    (r"Moderate risk \(Adipose phenotype stage\)", "Хавфи миёна (марҳилаи фенотипи адипозӣ)"),
    (r"High risk \(Fat excess and muscle deficit\)", "Хавфи баланд (зиёдатии чарб ва норасоии мушак)"),
    (r"moslashuv", "мутобиқшавӣ"),
    (r"integratsiya", "интегратсия"),
    (r"nomutanosiblik", "номувофиқатӣ"),
    (r"Xavf past", "Хавфи паст"),
    (r"Xavf o'?rtacha", "Хавфи миёна"),
    (r"Xavf yuqori", "Хавфи баланд"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Роҳнамоӣ ба варзиш (тахминӣ)"),
    (r"Qo'?shimcha yo'?nalishlar", "Самтҳои иловагӣ"),
    (r"\bSabab\b", "Сабаб"),
    (r"tana ko'?rsatkichlari muvozanatli", "нишондиҳандаҳои бадан мутавозинанд"),
    (r"yengil vazn va nisbatan nozik tana tuzilishi", "вазни сабук ва сохтори нисбатан нозуки бадан"),
    (r"morfologik uyg'?unlik yaxshi", "ҳамоҳангии морфологӣ хуб аст"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Дар интихоби ниҳоӣ шавқи кӯдак, баҳодиҳии мураббӣ ва иҷозати духтур ба назар гирифта шавад",
    ),
    (r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi", "Муоинаи педиатр ё диетолог тавсия мешавад"),
    (r"Vazn yetishmasligi sabablarini aniqlash zarur", "Сабабҳои камвазниро муайян кардан зарур аст"),
    (r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting", "Ба ғизои серкалория ва аз сафеда бой гузаред"),
    (r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning", "Дар як рӯз 5-6 маротиба бо порсияҳои хурд ғизо гиред"),
    (r"Bolada normostenik tip: uyg'?un rivojlanmoqda", "Дар кӯдак навъи нормостеник мушоҳида мешавад: рушд ҳамоҳанг аст"),
    (r"Bolada нормостеник tip: uyg'?un rivojlanmoqda", "Дар кӯдак навъи нормостеник мушоҳида мешавад: рушд ҳамоҳанг аст"),
    (r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling", "Барои нигоҳ доштани ҳолат ба реҷаи ғизои мутавозин риоя кунед"),
    (r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring", "Машқҳои пуршиддати кардиоро кам карда, машқҳои афзоиши массаи мушакҳоро иҷро кунед"),
    (r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi", "Гузаронидани таҳлили хун (гемоглобин), санҷиши заминаи гормонӣ ва низоми меъдаю рӯда тавсия мешавад"),
    (r"Toza suv ichish rejimini nazorat qiling", "Режими нӯшидани оби тозаро назорат кунед"),
    (r"yengil atletika", "варзиши сабук"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "шиноварӣ"),
]

_ICON_PREFIX_RE = re.compile(
    r"^[\s\u200d\ufe0f]*(?:[👨⚕🍎🏃🏥📝•]|рџ\S*|пёЏ|вЂЌ)+\s*",
    re.IGNORECASE,
)


def _strip_leading_icons(text: str) -> str:
    while text:
        first = text[0]
        category = unicodedata.category(first)
        if first.isspace() or category in {"Cf", "Mn", "So", "Sk"} or first in "•":
            text = text[1:]
            continue
        break
    return text.lstrip()


def _fix_mojibake(text: str) -> str:
    """Recover UTF-8 text that was accidentally decoded as cp1251."""
    try:
        repaired = text.encode("cp1251").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text
    # Mojibake commonly contains many byte-looking Cyrillic fragments.
    mojibake_score = sum(text.count(marker) for marker in ("Р", "С", "Ѓ", "Њ", "Ќ", "Џ"))
    repaired_score = sum(repaired.count(marker) for marker in ("Р", "С", "Ѓ", "Њ", "Ќ", "Џ"))
    if repaired and mojibake_score > repaired_score + 2:
        return repaired
    return text


def kz_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "kz" or not text:
        return text
    text = _fix_mojibake(text)
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", text))
    for pattern, replacement in _KZ_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def ru_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "ru" or not text:
        return text
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", _fix_mojibake(text)))
    replacements = [
        (r"Noma'?lum", "Неизвестно"),
        (r"Ma'?lumot yo'?q", "Нет данных"),
    ]
    replacements.extend(_RU_REPLACEMENTS)
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def en_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "en" or not text:
        return text
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", _fix_mojibake(text)))
    for pattern, replacement in _EN_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def tg_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "tg" or not text:
        return text
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", _fix_mojibake(text)))
    for pattern, replacement in _TG_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def report_text(value: Any, lang: str = "uz") -> str:
    if lang == "tg":
        return tg_text(value, lang)
    if lang == "ky":
        return ky_text(value, lang)
    if lang == "kz":
        return kz_text(value, lang)
    if lang == "ru":
        return ru_text(value, lang)
    if lang == "en":
        return en_text(value, lang)
    return _strip_leading_icons("" if value is None else str(value))
