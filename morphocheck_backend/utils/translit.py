def lat2cyr(text: str) -> str:
    """Lotin yozuvidagi matnni Kirill yozuviga o'giradi (o'zbek va rus)."""
    if not isinstance(text, str):
        return text
    
    mapping = {
        "shch": "щ", "Shch": "Щ", "SHCH": "Щ",
        "sh": "ш", "Sh": "Ш", "SH": "Ш", "ch": "ч", "Ch": "Ч", "CH": "Ч",
        "ya": "я", "Ya": "Я", "YA": "Я", "yo": "ё", "Yo": "Ё", "YO": "Ё", 
        "yu": "ю", "Yu": "Ю", "YU": "Ю", "ts": "ц", "Ts": "Ц", "TS": "Ц",
        "o'": "ў", "O'": "Ў", "g'": "ғ", "G'": "Ғ",
        "o‘": "ў", "O‘": "Ў", "g‘": "ғ", "G‘": "Ғ",
        "o`": "ў", "O`": "Ў", "g`": "ғ", "G`": "Ғ",
        "a": "а", "A": "А", "b": "б", "B": "Б", "d": "д", "D": "Д", 
        "e": "е", "E": "Е", "f": "ф", "F": "Ф", "g": "г", "G": "Г", 
        "h": "ҳ", "H": "Ҳ", "i": "и", "I": "И", "j": "ж", "J": "Ж", 
        "k": "к", "K": "К", "l": "л", "L": "Л", "m": "м", "M": "М", 
        "n": "н", "N": "Н", "o": "о", "O": "О", "p": "п", "P": "П", 
        "q": "қ", "Q": "Қ", "r": "р", "R": "Р", "s": "с", "S": "С", 
        "t": "т", "T": "Т", "u": "у", "U": "У", "v": "в", "V": "В", 
        "x": "х", "X": "Х", "y": "й", "Y": "Й", "z": "з", "Z": "З",
        "'": "ъ", "‘": "ъ", "`": "ъ", "w": "в", "W": "В", "c": "ц", "C": "Ц"
    }
    
    res = text
    for lat, cyr in mapping.items():
        res = res.replace(lat, cyr)
    return res

def cyr2lat(text: str) -> str:
    """Kirill yozuvidagi matnni Lotin yozuviga o'giradi (o'zbek)."""
    if not isinstance(text, str):
        return text
    
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
        "Х": "X", "х": "x", "Э": "E", "э": "e", "ъ": "'", "Ъ": "'",
        "ь": "", "Ь": ""
    }
    
    res = text
    for cyr, lat in mapping.items():
        res = res.replace(cyr, lat)
    return res
