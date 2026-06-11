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
    (r"Toshkent", "Ташкент"),
    (r"Тошкент", "Ташкент"),
    (r"o'?zbek", "\u04e9збек"),
    (r"ўзбек", "\u04e9збек"),
    (r"yaxshi", "жакшы"),
    (r"яхши", "жакшы"),
    (r"yo'?q", "жок"),
    (r"йўқ", "жок"),
    (r"ha", "ооба"),
    (r"ҳа", "ооба"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "тууgan эмес"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "тууган эмес"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "тууган эмес"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "жакын тууган"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "жакын тууган"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "жакын тууган"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "алыс тууган"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "алыс тууган"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "алыс тууган"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "табигый"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "табигый"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "аралаш"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "аралаш"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "жасалма"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "жасалма"),
    (r"tug'ilgandan buyon", "туулгандан бери"),
    (r"tug'ilgandan", "туулгандан бери"),
    (r"туғилгандан", "туулгандан бери"),
    (r"yildan", "жылдан"),
    (r"йилдан", "жылдан"),
    (r"Noma'?lum", "Белгисиз"),
    (r"Ma'?lumot yo'?q", "Маалымат жок"),
    (r"Toshkent shahri", "Ташкент шаары"),
    (r"\bshahri\b", "шаары"),
    (r"\bshahar\b", "шаар"),
    (r"\bviloyati\b", "облусу"),
    (r"\bviloyat\b", "облус"),
    (r"\btumani\b", "району"),
    (r"\btuman\b", "район"),
    (r"\bmahalla\b", "махалла"),
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
    (
        r"muhitga nisbatan optimal morfologik moslashuv",
        "чөйрөгө карата оптималдуу морфологиялык ыңгайлашуу",
    ),
    (
        r"akseleratsiya / yuqori morfologik rivojlanish",
        "акселерация / жогорку морфологиялык өнүгүү",
    ),
    (
        r"moslashuv stresi yoki rivojlanishning sekinlashishi",
        "ыңгайлашуу стресси же өнүгүүнүн жайлашы",
    ),
    (
        r"normal o'?rtacha morfologik muvozanat",
        "нормалдуу орточо морфологиялык тең салмак",
    ),
    (
        r"somatik komponentlarning yuqori integratsiyasi",
        "соматикалык компоненттердин жогорку интеграциясы",
    ),
    (r"past morfologik nomutanosiblik", "төмөн морфологиялык дисбаланс"),
    (r"uyg'?un rivojlanish", "гармониялуу өнүгүү"),
    (r"o'?rtacha nomutanosiblik", "орточо дисбаланс"),
    (r"yuqori darajadagi nomutanosiblik", "жогорку деңгээлдеги дисбаланс"),
    (r"Xavf past", "Коркунуч төмөн"),
    (r"Xavf o'?rtacha", "Коркунуч орточо"),
    (r"Xavf yuqori", "Коркунуч жогору"),
    (
        r"morfologik-kompozitsion xavf past",
        "морфологиялык-композициялык коркунуч төмөн",
    ),
    (
        r"morfologik-kompozitsion xavf o'?rtacha",
        "морфологиялык-композициялык коркунуч орточо",
    ),
    (
        r"morfologik-kompozitsion xavf yuqori",
        "морфологиялык-композициялык коркунуч жогору",
    ),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спортко багыттоо (болжолдуу)"),
    (r"Qo'?shimcha yo'?nalishlar", "Кошумча багыттар"),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Салмак жетишсиздигинин себептерин аныктоо зарыл",
    ),
    (
        r"Салмак жетишсиздиги sabablarini aniqlash zarur",
        "Салмак жетишсиздигинин себептерин аныктоо зарыл",
    ),
    (r"\bSabab\b", "Себеби"),
    (r"tana ko'?rsatkichlari muvozanatli", "дене көрсөткүчтөрү тең салмактуу"),
    (
        r"yengil vazn va nisbatan nozik tana tuzilishi",
        "салмагы жеңил жана дене түзүлүшү салыштырмалуу назик",
    ),
    (r"morfologik uyg'?unlik yaxshi", "морфологиялык шайкештик жакшы"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Акыркы тандоодо баланын кызыгуусу, машыктыруучунун баасы жана дарыгердин уруксаты эске алынсын",
    ),
    (
        r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi",
        "Педиатр же диетологдун кароосу сунушталат",
    ),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Салмак жетишсиздигинин себептерин аныктоо зарыл",
    ),
    (
        r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting",
        "Калориясы жогору жана белокко бай тамактануу тартибине өтүңүз",
    ),
    (
        r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning",
        "Күнүнө 5-6 жолу аз-аздан тамактаныңыз",
    ),
    (
        r"Bolada normostenik tip: uyg'?un rivojlanmoqda",
        "Балада нормостеник тип: шайкеш өнүгүүдө",
    ),
    (
        r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling",
        "Абалды сактоо үчүн тең салмактуу тамактануу режимин карманыңыз",
    ),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Күчтүү кардио көнүгүүлөрдү азайтып, булчуң массасын көбөйтүүгө багытталган көнүгүүлөрдү аткарыңыз",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "Кан анализи (гемоглобин), гормоналдык фон жана ашказан-ичеги системасын текшерүү сунушталат",
    ),
    (
        r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang",
        "Мезгилдик жашылча-жемиштердин түрдүүлүгүн камсыз кылыңыз",
    ),
    (
        r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang",
        "Чыгармачылык жана интеллектуалдык жүктөмдөрдү физикалык активдүүлүк менен алмаштырыңыз",
    ),
    (r"Toza suv ichish rejimini nazorat qiling", "Таза суу ичүү режимин көзөмөлдөңүз"),
    (r"yengil atletika", "жеңил атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "сүзүү"),
    (r"normost\s*enik", "нормостеник"),
    (r"normostenik", "нормостеник"),
    (r"astenik", "астеник"),
    (r"giperstenik", "гиперстеник"),
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
    (r"Toshkent", "Ташкент"),
    (r"Тошкент", "Ташкент"),
    (r"o'?zbek", "\u04e9збек"),
    (r"ўзбек", "\u04e9збек"),
    (r"yaxshi", "жа\u049bсы"),
    (r"яхши", "жа\u049bсы"),
    (r"yo'?q", "жо\u049b"),
    (r"йўқ", "жо\u049b"),
    (r"ha", "иә"),
    (r"ҳа", "иә"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "туыс емес"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "туыс емес"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "туыс емес"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "жа\u049bын туыс"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "жа\u049bын туыс"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "жа\u049bын туыс"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "алыс туыс"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "алыс туыс"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "алыс туыс"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "таби\u0493и"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "таби\u0493и"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "аралас"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "аралас"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "жасанды"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "жасанды"),
    (r"tug'ilgandan buyon", "ту\u0493аннан бер\u0456"),
    (r"tug'ilgandan", "ту\u0493аннан бер\u0456"),
    (r"туғилгандан", "ту\u0493anнан бер\u0456"),
    (r"yildan", "жылдан"),
    (r"йилdan", "жылdan"),
    (r"Noma'?lum", "Белг\u0456с\u0456з"),
    (r"Ma'?lumot yo'?q", "М\u04d9л\u0456met жо\u049b"),
    (r"Toshkent shahri", "Ташкент \u049bаласы"),
    (r"\bshahri\b", "\u049bаласы"),
    (r"\bshahar\b", "\u049bала"),
    (r"\bviloyati\b", "облысы"),
    (r"\bviloyat\b", "облыс"),
    (r"\btumani\b", "ауданы"),
    (r"\btuman\b", "аудан"),
    (r"\bmahalla\b", "махалла"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Ай\u049bын салма\u049b тапшылы\u0493ы"),
    (r"Vazn yetishmovchiligi", "Салма\u049b тапшылы\u0493ы"),
    (r"Ortiqcha vazn", "Арты\u049b салма\u049b"),
    (r"Semizlik", "Сем\u0456зд\u0456к"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Норма (15-85 сентиль)"),
    (r"Me'?yor", "Норма"),
    (r"Tavsiya etilgan oraliq", "\u04b0сынылатын аралы\u049b"),
    (r"Idealdan og'?ish", "Идеалдан ауыт\u049bу"),
    (r"Somatotip", "Соматотип"),
    (r"\bmos_emas\b", "с\u04d8йкес келмейд\u0456"),
    (r"\bmos\b", "с\u04d8йкес келед\u0456"),
    (r"\bmavjud\b", "бар"),
    (r"\byoq\b", "жо\u049b"),
    (
        r"muhitga nisbatan optimal morfologik moslashuv",
        "\u049bорша\u0493ан орта\u0493а о\u04a3тайлы морфологиялы\u049b бей\u0456мделу",
    ),
    (
        r"akseleratsiya / yuqori morfologik rivojlanish",
        "акселерация / жо\u0493ары морфологиялы\u049b даму",
    ),
    (
        r"moslashuv stresi yoki rivojlanishning sekinlashishi",
        "бей\u0456мделу стрес\u0456 немесе дамуды\u04a2 баяулауы",
    ),
    (
        r"normal o'?rtacha morfologik muvozanat",
        "\u049baлыпты орташа морфологиялы\u049b те\u04a3гер\u0456м",
    ),
    (
        r"somatik komponentlarning yuqori integratsiyasi",
        "соматикалы\u049b компоненттерд\u0456\u04a3 жо\u0493ары интеграциясы",
    ),
    (r"past morfologik nomutanosiblik", "т\u04e9men морфологиялы\u049b дисбаланс"),
    (r"uyg'?un rivojlanish", "\u04afйлес\u0456мд\u0456 даму"),
    (r"o'?rtacha nomutanosiblik", "орташа дисбаланс"),
    (r"yuqori darajadagi nomutanosiblik", "жо\u0493ары де\u04a3гейдег\u0456 дисбаланс"),
    (r"morfologik-kompozitsion xavf past", "морфологиялы\u049b-композициялы\u049b \u049bау\u0456п т\u04e9men"),
    (
        r"morfologik-kompozitsion xavf o'?rtacha",
        "морфологиялы\u049b-композициялы\u049b \u049bау\u0456п орташа",
    ),
    (
        r"morfologik-kompozitsion xavf yuqori",
        "морfoлогиялы\u049b-композициялы\u049b \u049bау\u0456п жо\u0493ары",
    ),
    (
        r"O'?rtacha xavf \(Adipoz fenotip bosqichi\)",
        "Орташа \u049bау\u0456п (Адипозды фенотип кезе\u04a3\u0456)",
    ),
    (
        r"Yuqori xavf \(Ortiqcha yog'? va mushak yetishmovchiligi\)",
        "Жо\u0493ары \u049bау\u0456п (Арты\u049b май ж\u04d8не б\u04b1лшы\u049bет жет\u0456спеуш\u0456л\u0456г\u0456)",
    ),
    (r"Low risk", "Т\u04e9men \u049bау\u0456п"),
    (
        r"Moderate risk \(Adipose phenotype stage\)",
        "Орташа \u049bау\u0456п (Адипозды фенотип кезе\u04a3\u0456)",
    ),
    (
        r"High risk \(Fat excess and muscle deficit\)",
        "Жо\u0493ары \u049bау\u0456п (Арты\u049b май ж\u04d8не б\u04b1лшы\u049bет жет\u0456спеуш\u0456л\u0456г\u0456)",
    ),
    (r"Xavf past", "\u049bау\u0456п т\u04e9men"),
    (r"Xavf o'?rtacha", "\u049bау\u0456п орташа"),
    (r"Xavf yuqori", "\u049bау\u0456п жо\u0493ары"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спорт\u049bа ба\u0493ыттау (шамамен)"),
    (r"Qo'?shimcha yo'?nalishlar", "\u049aосымша ба\u0493ыттар"),
    (r"\bSabab\b", "Себеб\u0456"),
    (r"tana ko'?rsatkichlari muvozanatli", "дене к\u04e9рсетк\u0456штер\u0456 те\u04a3гер\u0456мд\u0456"),
    (
        r"yengil vazn va nisbatan nozik tana tuzilishi",
        "салма\u049bы же\u04a3\u0456л ж\u04d8не дене б\u0456т\u0456м\u0456 салыстырмалы т\u04afрде н\u04d9з\u0456к",
    ),
    (r"morfologik uyg'?unlik yaxshi", "морфологиялы\u049b \u04afйлес\u0456мд\u0456л\u0456к жа\u049bсы"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Со\u04a3\u0493ы та\u04a3дауда баланы\u04a3 \u049bызы\u0493ушылы\u0493ы, жатты\u049bтырушы ба\u0493асы ж\u04d8не д\u04d9р\u0456гер р\u04b1\u049bсаты ескер\u0456лс\u0456н",
    ),
    (
        r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi",
        "Педиатр немесе диетологты\u04a3 тексеру\u0456 \u04b1сынылады",
    ),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Салма\u049b жет\u0456спеуш\u0456л\u0456г\u0456н\u0456\u04a3 себептер\u0456н аны\u049bтау \u049bажет",
    ),
    (
        r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting",
        "А\u049b\u04b1ыз бен жо\u0493ары калория\u0493а бай тама\u049bтану режим\u0456не к\u04e9ш\u0456\u04a3\u0456з",
    ),
    (
        r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning",
        "К\u04afн\u0456не 5-6 рет к\u0456ш\u0456 порциялармен тама\u049bтаны\u04a3ыз",
    ),
    (
        r"Bolada normostenik tip: uyg'?un rivojlanmoqda",
        "Баланы\u04a3 нормостеникалы\u049b тип\u0456: \u04afйлес\u0456мд\u0456 дамуда",
    ),
    (
        r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling",
        "К\u04afйд\u0456 са\u049bтау \u04afш\u0456н те\u04a3гер\u0456мд\u0456 тама\u049bтану режим\u0456н са\u049bта\u04a3ыз",
    ),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Белсенд\u0456 кардио жатты\u0493уларды азайтып, б\u04b1лшы\u049bет массасын арттыру\u0493а ба\u0493ыттал\u0493ан жатты\u0493уларды орында\u04a3ыз",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "\u049bан анализ\u0456н (гемоглобин), гормоналды фонды ж\u04d8не ас\u049bазан-\u0456шек жолдарын тексеру \u04b1сынылады",
    ),
    (
        r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang",
        "Маусымды\u049b к\u04e9к\u04e9н\u0456стер мен жем\u0456стерд\u0456\u04a3 алуан т\u04afрл\u0456л\u0456г\u0456н \u049bамтамасыз ет\u0456\u04a3\u0456з",
    ),
    (
        r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang",
        "Шы\u0493армашылы\u049b пен зияткерл\u0456к ж\u04afктемелерд\u0456 физикалы\u049b белсенд\u0456л\u0456кпен алмастыры\u04a3ыз",
    ),
    (r"Toza suv ichish rejimini nazorat qiling", "Таза су \u0456шу regimeін ба\u049bыла\u04a3ыз"),
    (r"yengil atletika", "же\u0456л атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "ж\u04afзу"),
    (r"\bastenik\b", "астеник"),
    (r"\bnormostenik\b", "нормостеник"),
    (r"\bgiperstenik\b", "гиперстеник"),
]

_RU_REPLACEMENTS = [
    (r"Toshkent", "Ташкент"),
    (r"Тошкент", "Ташкент"),
    (r"o'?zbek", "узбек"),
    (r"ўзбек", "узбек"),
    (r"yaxshi", "хорошее"),
    (r"яхши", "хорошее"),
    (r"yo'?q", "нет"),
    (r"йўқ", "нет"),
    (r"ha", "да"),
    (r"ҳа", "да"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "не родственники"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "не родственники"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "не родственники"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "близкие родственники"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "близкие родственники"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "близкие родственники"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "дальние родственники"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "дальние родственники"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "дальние родственники"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "естественное"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "естественное"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "смешанное"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "смешанное"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "искусственное"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "искусственное"),
    (r"tug'ilgandan buyon", "с рождения"),
    (r"tug'ilgandan", "с рождения"),
    (r"туғилгандан", "с рождения"),
    (r"yildan", "лет"),
    (r"йилдан", "лет"),
    (r"Toshkent shahri", "город Ташкент"),
    (r"\bToshkent\b", "Ташкент"),
    (r"\bShayxontohur\b", "Шайхантахур"),
    (r"\bshahri\b", "город"),
    (r"\bshahar\b", "город"),
    (r"\bviloyati\b", "область"),
    (r"\bviloyat\b", "область"),
    (r"\btumani\b", "район"),
    (r"\btuman\b", "район"),
    (r"\bmahalla\b", "махалля"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Дефицит массы тела (выраженный)"),
    (r"Vazn yetishmovchiligi", "Дефицит массы тела"),
    (r"Ortiqcha vazn", "Избыточный вес"),
    (r"Semizlik", "Ожирение"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Норма (15-85-центиль)"),
    (r"Me'?yor", "Норма"),
    (r"Tavsiya etilgan oraliq", "Рекомендуемый диапазон"),
    (r"Idealdan og'?ish", "Отклонение от идеала"),
    (r"Somatotip", "Соматотип"),
    (
        r"muhitga nisbatan optimal morfologik (moslashuv|мутобиқшавӣ)",
        "оптимальная морфологическая адаптация к среде",
    ),
    (
        r"akseleratsiya / yuqori morfologik rivojlanish",
        "акселерация / высокое морфологическое развитие",
    ),
    (
        r"moslashuv stresi yoki rivojlanishning sekinlashishi",
        "стресс адаптации или замедление развития",
    ),
    (
        r"somatik komponentlarning yuqori integratsiyasi",
        "высокая интеграция соматических компонентов",
    ),
    (
        r"normal o'?rtacha morfologik muvozanat",
        "нормальный средний морфологический баланс",
    ),
    (r"past morfologik nomutanosiblik", "низкий морфологический дисбаланс"),
    (r"uyg'?un rivojlanish", "гармоничное развитие"),
    (r"o'?rtacha nomutanosiblik", "средний дисбаланс"),
    (r"yuqori darajadagi nomutanosiblik", "дисбаланс высокой степени"),
    (r"morfologik-kompozitsion xavf past", "морфологически-композиционный риск низкий"),
    (
        r"morfologik-kompozitsion xavf o'?rtacha",
        "морфологически-композиционный риск средний",
    ),
    (
        r"morfologik-kompozitsion xavf yuqori",
        "морфологически-композиционный риск высокий",
    ),
    (
        r"O'?rtacha xavf \(Adipoz fenotip bosqichi\)",
        "Средний риск (стадия адипозного фенотипа)",
    ),
    (
        r"Yuqori xavf \(Ortiqcha yog'? va mushak yetishmovchiligi\)",
        "Высокий риск (избыток жира и дефицит мышц)",
    ),
    (r"Low risk", "Низкий риск"),
    (
        r"Moderate risk \(Adipose phenotype stage\)",
        "Средний риск (стадия адипозного фенотипа)",
    ),
    (
        r"High risk \(Fat excess and muscle deficit\)",
        "Высокий риск (избыток жира и дефицит мышц)",
    ),
    (r"moslashuv", "адаптация"),
    (r"integratsiya", "интеграция"),
    (r"nomutanosiblik", "дисбаланс"),
    (r"Xavf past", "Риск низкий"),
    (r"Xavf o'?rtacha", "Риск средний"),
    (r"Xavf yuqori", "Риск высокий"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Спортивная ориентация (примерно)"),
    (r"Qo'?shimcha yo'?nalishlar", "Дополнительные направления"),
    (r"\bSabab\b", "Причина"),
    (r"tana ko'?rsatkichlari muvozanatli", "показатели тела сбалансированы"),
    (
        r"yengil vazn va nisbatan nozik tana tuzilishi",
        "лёгкий вес и относительно худощавое телосложение",
    ),
    (r"morfologik uyg'?unlik yaxshi", "морфологическая гармония хорошая"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "При окончательном выборе следует учитывать интерес ребёнка, оценку тренера и разрешение врача",
    ),
    (
        r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi",
        "Рекомендуется осмотр педиатра или диетолога",
    ),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Необходимо выяснить причины дефицита веса",
    ),
    (
        r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting",
        "Перейдите на высококалорийный рацион, богатый белками",
    ),
    (
        r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning",
        "Питайся 5-6 раз в день небольшими порциями",
    ),
    (
        r"Bolada normostenik tip: uyg'?un rivojlanmoqda",
        "У ребенка нормостенический тип: развивается гармонично",
    ),
    (
        r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling",
        "Для поддержания состояния соблюдайте сбалансированный рацион",
    ),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Снизьте интенсивные кардиотренировки и выполняйте упражнения на увеличение мышечной массы",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "Рекомендуется сдать анализ крови (гемоглобин), проверить гормональный фон и желудочно-кишечный тракт",
    ),
    (
        r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang",
        "Обеспечьте разнообразие сезонных овощей и фруктов",
    ),
    (
        r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang",
        "Чередуйте творческие и интеллектуальные нагрузки с физической активностью",
    ),
    (
        r"Toza suv ichish rejimini nazorat qiling",
        "Следите за режимом питья чистой воды",
    ),
    (r"yengil atletika", "лёгкая атлетика"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "плавание"),
    (r"\bastenik\b", "астеник"),
    (r"\bnormostenik\b", "нормостеник"),
    (r"\bgiperstenik\b", "гиперстеник"),
]

_EN_REPLACEMENTS = [
    (r"Toshkent", "Tashkent"),
    (r"Тошкент", "Tashkent"),
    (r"o'?zbek", "Uzbek"),
    (r"ўзбек", "Uzbek"),
    (r"yaxshi", "good"),
    (r"яхши", "good"),
    (r"yo'?q", "No"),
    (r"йўқ", "No"),
    (r"ha", "Yes"),
    (r"ҳа", "Yes"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "not relatives"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "not relatives"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "not relatives"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "close relatives"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "close relatives"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "close relatives"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "distant relatives"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "distant relatives"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "distant relatives"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "natural"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "natural"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "mixed"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "mixed"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "artificial"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "artificial"),
    (r"tug'ilgandan buyon", "since birth"),
    (r"tug'ilgandan", "since birth"),
    (r"туғилгандан", "since birth"),
    (r"yildan", "years"),
    (r"йилдан", "years"),
    (r"Noma'?lum", "Unknown"),
    (r"Ma'?lumot yo'?q", "No data"),
    (r"Toshkent shahri", "Tashkent city"),
    (r"\bToshkent\b", "Tashkent"),
    (r"\bShayxontohur\b", "Shaykhantakhur"),
    (r"\bshahri\b", "city"),
    (r"\bshahar\b", "city"),
    (r"\bviloyati\b", "region"),
    (r"\bviloyat\b", "region"),
    (r"\btumani\b", "district"),
    (r"\btuman\b", "district"),
    (r"\bmahalla\b", "mahalla"),
    (r"\bastenik\b", "Asthenic"),
    (r"\bnormostenik\b", "Normosthenic"),
    (r"\bgiperstenik\b", "Hypersthenic"),
    (r"\bmos_emas\b", "Does not match"),
    (r"\bmos\b", "Matches"),
    (r"\bmavjud\b", "Present"),
    (r"\byoq\b", "Absent"),
]

_TG_REPLACEMENTS = [
    (r"Toshkent", "Тошканд"),
    (r"Тошкент", "Тошканд"),
    (r"o'?zbek", "ӯзбек"),
    (r"ўзбек", "ӯзбек"),
    (r"yaxshi", "хуб"),
    (r"яхши", "хуб"),
    (r"yo'?q", "нест"),
    (r"йўқ", "нест"),
    (r"ha", "ҳа"),
    (r"ҳа", "ҳа"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "хеш нест"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "хеш нест"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "хеш нест"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "хеши наздик"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "хеши наздик"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "хеши наздик"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "хеши дур"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "хеши дур"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "хеши дур"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "табиӣ"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "табиӣ"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "омехта"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "омехта"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "сунъӣ"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "сунъӣ"),
    (r"tug'ilgandan buyon", "аз таваллуд"),
    (r"tug'ilgandan", "аз таваллуд"),
    (r"туғилгандан", "аз таваллуд"),
    (r"yildan", "сол"),
    (r"йилдан", "сол"),
    (r"Noma'?lum", "Номаълум"),
    (r"Ma'?lumot yo'?q", "Маълумот нест"),
    (r"Toshkent shahri", "шаҳри Тошканд"),
    (r"\bToshkent\b", "Тошканд"),
    (r"\bShayxontohur\b", "Шайхонтоҳур"),
    (r"\bshahri\b", "шаҳр"),
    (r"\bshahar\b", "шаҳр"),
    (r"\bviloyati\b", "вилояти"),
    (r"\bviloyat\b", "вилоят"),
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
    (
        r"muhitga nisbatan optimal morfologik (moslashuv|мутобиқшавӣ)",
        "мутобиқшавии оптималии морфологӣ нисбат ба муҳит",
    ),
    (
        r"akseleratsiya / yuqori morfologik rivojlanish",
        "акселератсия / рушди баланди морфологӣ",
    ),
    (
        r"moslashuv stresi yoki rivojlanishning sekinlashishi",
        "стресси мутобиқшавӣ ё сустшавии рушд",
    ),
    (
        r"somatik komponentlarning yuqori integratsiyasi",
        "интегратсияи баланди ҷузъҳои соматикӣ",
    ),
    (r"normal o'?rtacha morfologik muvozanat", "мувозинати миёнаи морфологии меъёрӣ"),
    (r"past morfologik nomutanosiblik", "номувофиқати пасти морфологӣ"),
    (r"uyg'?un rivojlanish", "рушди ҳамоҳанг"),
    (r"o'?rtacha nomutanosiblik", "номувофиқати миёна"),
    (r"yuqori darajadagi nomutanosiblik", "номувофиқати дараҷаи баланд"),
    (r"morfologik-kompozitsion xavf past", "хавфи морфологӣ-композитсионӣ паст"),
    (r"morfologik-kompozitsion xavf o'?rtacha", "хавфи морфологӣ-композитсионӣ миёна"),
    (r"morfologik-kompozitsion xavf yuqori", "хавфи морфологӣ-композитсионӣ баланд"),
    (
        r"O'?rtacha xavf \(Adipoz fenotip bosqichi\)",
        "Хавфи миёна (марҳилаи фенотипи адипозӣ)",
    ),
    (
        r"Yuqori xavf \(Ortiqcha yog'? va mushak yetishmovchiligi\)",
        "Хавфи баланд (зиёдатии чарб ва норасоии мушак)",
    ),
    (r"Low risk", "Хавфи паст"),
    (
        r"Moderate risk \(Adipose phenotype stage\)",
        "Хавфи миёна (марҳилаи фенотипи адипозӣ)",
    ),
    (
        r"High risk \(Fat excess and muscle deficit\)",
        "Хавфи баланд (зиёдатии чарб ва норасоии мушак)",
    ),
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
    (
        r"yengil vazn va nisbatan nozik tana tuzilishi",
        "вазни сабук ва сохтори нисбатан нозуки бадан",
    ),
    (r"morfologik uyg'?unlik yaxshi", "ҳамоҳангии морфологӣ хуб аст"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Дар интихоби ниҳоӣ шавқи кӯдак, баҳодиҳии мураббӣ ва иҷозати духтур ба назар гирифта шавад",
    ),
    (
        r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi",
        "Муоинаи педиатр ё диетолог тавсия мешавад",
    ),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Сабабҳои камвазниро муайян кардан зарур аст",
    ),
    (
        r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting",
        "Ба ғизои серкалория ва аз сафеда бой гузаред",
    ),
    (
        r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning",
        "Дар як рӯз 5-6 маротиба бо порсияҳои хурд ғизо гиред",
    ),
    (
        r"Bolada normostenik tip: uyg'?un rivojlanmoqda",
        "Дар кӯдак навъи нормостеник мушоҳида мешавад: рушд ҳамоҳанг аст",
    ),
    (
        r"Bolada нормостеник tip: uyg'?un rivojlanmoqda",
        "Дар кӯдак навъи нормостеник мушоҳида мешавад: рушд ҳамоҳанг аст",
    ),
    (
        r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling",
        "Барои нигоҳ доштани ҳолат ба реҷаи ғизои мутавозин риоя кунед",
    ),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Машқҳои пуршиддати кардиоро кам карда, машқҳои афзоиши массаи мушакҳоро иҷро кунед",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "Гузаронидани таҳлили хун (гемоглобин), санҷиши заминаи гормонӣ ва низоми меъдаю рӯда тавсия мешавад",
    ),
    (
        r"Toza suv ichish rejimini nazorat qiling",
        "Режими нӯшидани оби тозаро назорат кунед",
    ),
    (r"yengil atletika", "варзиши сабук"),
    (r"futbol", "футбол"),
    (r"gimnastika", "гимнастика"),
    (r"suzish", "шиноварӣ"),
    (r"\bastenik\b", "астеник"),
    (r"\bnormostenik\b", "нормостеник"),
    (r"\bgiperstenik\b", "гиперстеник"),
]

_TM_REPLACEMENTS = [
    (r"Toshkent", "Toshkent"),
    (r"Тошкент", "Toshkent"),
    (r"o'?zbek", "ozbek"),
    (r"ўзбек", "ozbek"),
    (r"yaxshi", "gowy"),
    (r"яхши", "gowy"),
    (r"yo'?q", "yok"),
    (r"йўқ", "yok"),
    (r"ha", "hava"),
    (r"ҳа", "hava"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "garyndash dal"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "garyndash dal"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "garyndash dal"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "yakin garyndash"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "yakin garyndash"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "yakin garyndash"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "uzak garyndash"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "uzak garyndash"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "uzak garyndash"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "tebigy"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "tebigy"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "garyszyk"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "garyszyk"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "suny"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "suny"),
    (r"tug'ilgandan buyon", "doglandan bari"),
    (r"tug'ilgandan", "doglandan bari"),
    (r"туғилгандан", "doglandan bari"),
    (r"yildan", "yyldan"),
    (r"йилдан", "yyldan"),
    (r"Noma'?lum", "Namalum"),
    (r"Ma'?lumot yo'?q", "Maglumat yok"),
    (r"Toshkent shahri", "Toshkent saheri"),
    (r"\bToshkent\b", "Toshkent"),
    (r"\bShayxontohur\b", "Shayhontohur"),
    (r"\bshahri\b", "saheri"),
    (r"\bshahar\b", "saher"),
    (r"\btumani\b", "etraby"),
    (r"\btuman\b", "etrap"),
    (r"\bviloyati\b", "welayaty"),
    (r"\bmahalla\b", "mahalla"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Agram yetmezciligi (aydyn)"),
    (r"Vazn yetishmovchiligi", "Agram yetmezciligi"),
    (r"Ortiqcha vazn", "Artyk agram"),
    (r"Semizlik", "Semizlik"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Kada (15-85-sentil)"),
    (r"Me'?yor", "Kada"),
    (r"Tavsiya etilgan oraliq", "Maslahat berlen aralyk"),
    (r"Idealdan og'?ish", "Idealden gyssarma"),
    (r"Somatotip", "Somatotip"),
    (r"\bmos_emas\b", "gabat gelenok"),
    (r"\bmos\b", "gabat gelyar"),
    (r"\bmavjud\b", "bar"),
    (r"\byoq\b", "yok"),
    (
        r"muhitga nisbatan optimal morfologik moslashuv",
        "dasky gurshawa garanda optimal morfologik uygunlasma",
    ),
    (
        r"akseleratsiya / yuqori morfologik rivojlanish",
        "akselerasiya / yokary morfologik osus",
    ),
    (
        r"moslashuv stresi yoki rivojlanishning sekinlashishi",
        "uygunlasma stresi ya-da osusin hayallamagy",
    ),
    (r"normal o'?rtacha morfologik muvozanat", "kadaly orta morfologik denagramlylyk"),
    (
        r"somatik komponentlarning yuqori integratsiyasi",
        "somatik komponentlerin yokary integrasiyasy",
    ),
    (r"past morfologik nomutanosiblik", "pes morfologik nomutanosiplik"),
    (r"uyg'?un rivojlanish", "uygun osus"),
    (r"o'?rtacha nomutanosiblik", "orta nomutanosiplik"),
    (r"yuqori darajadagi nomutanosiblik", "yokary derejeli nomutanosiplik"),
    (r"morfologik-kompozitsion xavf past", "morfologik-kompozision howp pes"),
    (r"morfologik-kompozitsion xavf o'?rtacha", "morfologik-kompozision howp orta"),
    (r"morfologik-kompozitsion xavf yuqori", "morfologik-kompozision howp yokary"),
    (
        r"O'?rtacha xavf \(Adipoz fenotip bosqichi\)",
        "Orta howp (adipoz fenotip tapgyry)",
    ),
    (
        r"Yuqori xavf \(Ortiqcha yog'? va mushak yetishmovchiligi\)",
        "Yokary howp (artyk yag we muskul yetmezciligi)",
    ),
    (r"Low risk", "Pes howp"),
    (
        r"Moderate risk \(Adipose phenotype stage\)",
        "Orta howp (adipoz fenotip tapgyry)",
    ),
    (
        r"High risk \(Fat excess and muscle deficit\)",
        "Yokary howp (artyk yag we muskul yetmezciligi)",
    ),
    (r"moslashuv", "uygunlasma"),
    (r"integratsiya", "integrasiya"),
    (r"nomutanosiblik", "nomutanosiplik"),
    (r"Xavf past", "Howp pes"),
    (r"Xavf o'?rtacha", "Howp orta"),
    (r"Xavf yuqori", "Howp yokary"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Sporta ugrukdyrmak (takmynan)"),
    (r"Qo'?shimcha yo'?nalishlar", "Gosmaya ugurlar"),
    (r"\bSabab\b", "Sebap"),
    (r"tana ko'?rsatkichlari muvozanatli", "beden gorkezijileri denagramly"),
    (
        r"yengil vazn va nisbatan nozik tana tuzilishi",
        "yenil agram we incerak beden gurlusy",
    ),
    (r"morfologik uyg'?unlik yaxshi", "morfologik uygunlyk gowy"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Ahyrky saylawda caganyn gyzyklanmasy, trenerin bahasy we lukmanyn rugsady goz onunde tutulmalydyr",
    ),
    (
        r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi",
        "Pediatr ya-da dietolog gorugi maslahat berilyar",
    ),
    (
        r"Vazn yetishmasligi sabablarini aniqlash zarur",
        "Agram yetmezciliginin sebaplerini anyklamak zerur",
    ),
    (
        r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting",
        "Yokary kaloriyaly we beloga bay iymitlenme tertibine gecin",
    ),
    (
        r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning",
        "Gunde 5-6 gezek kici porsiyalarda iymitlenin",
    ),
    (
        r"Bolada normostenik tip: uyg'?un rivojlanmoqda",
        "Cagada normostenik tip: uygun osyar",
    ),
    (
        r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling",
        "Yagdayy saklamak ucin denagramly iymitlenme rezimine amal edin",
    ),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Goycli kardio masklary azaldyp, muskul massasyny artdyrmaga gonukdirilen masklary yerine yetirin",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "Gan analizi (gemoglobin), gormonal fon we asgazan-icege ulgamynyn barlagy maslahat berilyar",
    ),
    (
        r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang",
        "Mowsumleyin gok-onumlerin we miwelerin kopdurliligini upjun edin",
    ),
    (
        r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang",
        "Doredijilik we intellektual yukleri fiziki isjenlik bilen gezeklesdirin",
    ),
    (
        r"Toza suv ichish rejimini nazorat qiling",
        "Arassa suw icmek rezimine gozegcilik edin",
    ),
    (r"yengil atletika", "yenil atletika"),
    (r"futbol", "futbol"),
    (r"gimnastika", "gimnastika"),
    (r"suzish", "yuzmek"),
    (r"\bastenik\b", "astenik"),
    (r"\bnormostenik\b", "normostenik"),
    (r"\bgiperstenik\b", "giperstenik"),
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
    mojibake_score = sum(
        text.count(marker) for marker in ("Р", "С", "Ѓ", "Њ", "Ќ", "Џ")
    )
    repaired_score = sum(
        repaired.count(marker) for marker in ("Р", "С", "Ѓ", "Њ", "Ќ", "Џ")
    )
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


def tm_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "tm" or not text:
        return text
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", _fix_mojibake(text)))
    for pattern, replacement in _TM_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


_TR_REPLACEMENTS = [
    (r"Toshkent", "Taskent"),
    (r"Тошкент", "Taskent"),
    (r"o'?zbek", "Ozbek"),
    (r"ўзбек", "Ozbek"),
    (r"yaxshi", "iyi"),
    (r"яхши", "iyi"),
    (r"yo'?q", "yok"),
    (r"йўқ", "yok"),
    (r"ha", "evet"),
    (r"ҳа", "evet"),
    (r"qarindosh emas(?:\s*\((?:неродственный|nerodstvenniy)\))?", "akraba degil"),
    (r"Қариндош [эе]мас(?:\s*\(неродственный\))?", "akraba degil"),
    (r"Кариндош [эе]мас(?:\s*\(неродственный\))?", "akraba degil"),
    (r"yaqin qarindosh(?:\s*\((?:родственный|близкородственный|rodstvenniy|blizkorodstvenniy)\))?", "yakin akraba"),
    (r"Яқин қариндош(?:\s*\((?:родственный|близкородственный)\))?", "yakin akraba"),
    (r"Якин кариндош(?:\s*\((?:родственный|близкородственный)\))?", "yakin akraba"),
    (r"uzoq qarindosh(?:\s*\((?:дальнородственный|дальнеродственный|dalnerodstvenniy)\))?", "uzak akraba"),
    (r"Узоқ қариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "uzak akraba"),
    (r"Узок кариндош(?:\s*\((?:дальнородственный|дальнеродственный)\))?", "uzak akraba"),
    (r"tabiiy(?:\s*\(естественном вскармливании\))?", "dogal"),
    (r"табиий(?:\s*\(естественном вскармливании\))?", "dogal"),
    (r"aralash(?:\s*\(смешанном вскармливании\))?", "karisik"),
    (r"аралаш(?:\s*\(смешанном вскармливании\))?", "karisik"),
    (r"sun'?iy(?:\s*\(искусственном вскармливании\))?", "yapay"),
    (r"сунъий(?:\s*\(искусственном вскармливании\))?", "yapay"),
    (r"tug'ilgandan buyon", "dogustan"),
    (r"tug'ilgandan", "dogustan"),
    (r"туғилгандан", "dogustan"),
    (r"yildan", "yildir"),
    (r"йилdan", "yildir"),
    (r"Noma'?lum", "Bilinmiyor"),
    (r"Ma'?lumot yo'?q", "Veri yok"),
    (r"Toshkent shahri", "Taskent sehri"),
    (r"\bshahri\b", "sehri"),
    (r"\bshahar\b", "sehir"),
    (r"\bviloyati\b", "bolgesi"),
    (r"\bviloyat\b", "bolge"),
    (r"\btumani\b", "ilcesi"),
    (r"\btuman\b", "ilce"),
    (r"\bmahalla\b", "mahalle"),
    (r"Vazn yetishmovchiligi \(yaqqol\)", "Belirgin dusuk kilo"),
    (r"Vazn yetishmovchiligi", "Dusuk kilo"),
    (r"Ortiqcha vazn", "Fazla kilo"),
    (r"Semizlik", "Obezite"),
    (r"Me'?yor \(15[-–]85[-–]sentil\)", "Normal (15-85 persentil)"),
    (r"Me'?yor", "Normal"),
    (r"Tavsiya etilgan oraliq", "Onerilen aralik"),
    (r"Idealdan og'?ish", "Ideale gore sapma"),
    (r"Somatotip", "Somatotip"),
    (r"\bmos_emas\b", "uygun degil"),
    (r"\bmos\b", "uygun"),
    (r"\bmavjud\b", "var"),
    (r"\byoq\b", "yok"),
    (r"muhitga nisbatan optimal morfologik moslashuv", "cevreye gore optimal morfolojik uyum"),
    (r"akseleratsiya / yuqori morfologik rivojlanish", "akselerasyon / yuksek morfolojik gelisim"),
    (r"moslashuv stresi yoki rivojlanishning sekinlashishi", "uyum stresi veya gelisimin yavaslamasi"),
    (r"normal o'?rtacha morfologik muvozanat", "normal ortalama morfolojik denge"),
    (r"somatik komponentlarning yuqori integratsiyasi", "somatik bilesenlerin yuksek entegrasyonu"),
    (r"past morfologik nomutanosiblik", "dusuk morfolojik uyumsuzluk"),
    (r"uyg'?un rivojlanish", "uyumlu gelisim"),
    (r"o'?rtacha nomutanosiblik", "orta uyumsuzluk"),
    (r"yuqori darajadagi nomutanosiblik", "yuksek duzeyde uyumsuzluk"),
    (r"morfologik-kompozitsion xavf past", "morfolojik-kompozisyonel risk dusuk"),
    (r"morfologik-kompozitsion xavf o'?rtacha", "morfolojik-kompozisyonel risk orta"),
    (r"morfologik-kompozitsion xavf yuqori", "morfolojik-kompozisyonel risk yuksek"),
    (r"Xavf past", "Risk dusuk"),
    (r"Xavf o'?rtacha", "Risk orta"),
    (r"Xavf yuqori", "Risk yuksek"),
    (r"Sportga yo'?naltirish \(taxminiy\)", "Spor yonlendirmesi (tahmini)"),
    (r"Qo'?shimcha yo'?nalishlar", "Ek yonler"),
    (r"\bSabab\b", "Neden"),
    (r"tana ko'?rsatkichlari muvozanatli", "vucut gostergeleri dengeli"),
    (r"yengil vazn va nisbatan nozik tana tuzilishi", "hafif kilo ve nispeten ince vucut yapisi"),
    (r"morfologik uyg'?unlik yaxshi", "morfolojik uyum iyi"),
    (
        r"Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin",
        "Son secimde cocugun ilgisi, antrenor degerlendirmesi ve doktor izni dikkate alinsin",
    ),
    (r"Pediatr yoki parhezshunos \(dietolog\) ko'?rigi tavsiya etiladi", "Pediatri veya diyetisyen muayenesi onerilir"),
    (r"Vazn yetishmasligi sabablarini aniqlash zarur", "Dusuk kilonun nedenleri belirlenmelidir"),
    (r"Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'?ting", "Yuksek kalorili ve protein acisindan zengin beslenme duzenine gecin"),
    (r"Kuniga 5-6 marta kichik porsiyalarda ovqatlaning", "Gunde 5-6 kez kucuk porsiyonlarla beslenin"),
    (r"Bolada normostenik tip: uyg'?un rivojlanmoqda", "Cocukta normostenik tip: uyumlu gelisiyor"),
    (r"Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling", "Durumu korumak icin dengeli beslenme duzenine uyun"),
    (
        r"Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring",
        "Yogun kardiyo egzersizlerini azaltip kas kutlesini artirmaya yonelik egzersizler yapin",
    ),
    (
        r"Qon tahlili \(gemoglobin\), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'?tish tavsiya etiladi",
        "Kan testi (hemoglobin), hormonal durum ve gastrointestinal sistem kontrolu onerilir",
    ),
    (r"Mavsumiy sabzavot va mevalar xilma-xilligini ta'?minlang", "Mevsimsel sebze ve meyvelerin cesitliligini saglayin"),
    (r"Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang", "Yaratici ve zihinsel yukleri fiziksel aktiviteyle donusumlu olarak yapin"),
    (r"Toza suv ichish rejimini nazorat qiling", "Temiz su icme duzenini izleyin"),
    (r"yengil atletika", "atletizm"),
    (r"futbol", "futbol"),
    (r"gimnastika", "jimnastik"),
    (r"suzish", "yuzme"),
]


def tr_text(value: Any, lang: str = "uz") -> str:
    if value is None:
        return ""
    text = str(value)
    if lang != "tr" or not text:
        return text
    text = _strip_leading_icons(_ICON_PREFIX_RE.sub("", _fix_mojibake(text)))
    for pattern, replacement in _TR_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def report_text(value: Any, lang: str = "uz") -> str:
    if lang == "tr":
        return tr_text(value, lang)
    if lang == "tm":
        return tm_text(value, lang)
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
