LATIN_MULTI = {
    "shch": "щ",
    "ch": "ч",
    "sh": "ш",
    "yo": "ё",
    "yu": "ю",
    "ya": "я",
    "ye": "е",
    "ts": "ц",
    "o'": "ў",
    "o`": "ў",
    "oʻ": "ў",
    "o‘": "ў",
    "o’": "ў",
    "oʼ": "ў",
    "g'": "ғ",
    "g`": "ғ",
    "gʻ": "ғ",
    "g‘": "ғ",
    "g’": "ғ",
    "gʼ": "ғ",
}

LATIN_SINGLE = {
    "a": "а",
    "b": "б",
    "c": "ц",
    "d": "д",
    "e": "е",
    "f": "ф",
    "g": "г",
    "h": "ҳ",
    "i": "и",
    "j": "ж",
    "k": "к",
    "l": "л",
    "m": "м",
    "n": "н",
    "o": "о",
    "p": "п",
    "q": "қ",
    "r": "р",
    "s": "с",
    "t": "т",
    "u": "у",
    "v": "в",
    "w": "в",
    "x": "х",
    "y": "й",
    "z": "з",
    "'": "ъ",
    "`": "ъ",
    "ʻ": "ъ",
    "‘": "ъ",
    "’": "ъ",
    "ʼ": "ъ",
}

CYR_MULTI = {
    "Щ": "Shch",
    "щ": "shch",
    "Ш": "Sh",
    "ш": "sh",
    "Ч": "Ch",
    "ч": "ch",
    "Ё": "Yo",
    "ё": "yo",
    "Ю": "Yu",
    "ю": "yu",
    "Я": "Ya",
    "я": "ya",
    "Ц": "Ts",
    "ц": "ts",
    "Ў": "O'",
    "ў": "o'",
    "Ғ": "G'",
    "ғ": "g'",
    "Қ": "Q",
    "қ": "q",
    "Ҳ": "H",
    "ҳ": "h",
}

CYR_SINGLE = {
    "А": "A",
    "а": "a",
    "Б": "B",
    "б": "b",
    "В": "V",
    "в": "v",
    "Г": "G",
    "г": "g",
    "Д": "D",
    "д": "d",
    "Е": "E",
    "е": "e",
    "Ж": "J",
    "ж": "j",
    "З": "Z",
    "з": "z",
    "И": "I",
    "и": "i",
    "Й": "Y",
    "й": "y",
    "К": "K",
    "к": "k",
    "Л": "L",
    "л": "l",
    "М": "M",
    "м": "m",
    "Н": "N",
    "н": "n",
    "О": "O",
    "о": "o",
    "П": "P",
    "п": "p",
    "Р": "R",
    "р": "r",
    "С": "S",
    "с": "s",
    "Т": "T",
    "т": "t",
    "У": "U",
    "у": "u",
    "Ф": "F",
    "ф": "f",
    "Х": "X",
    "х": "x",
    "Э": "E",
    "э": "e",
    "Ъ": "'",
    "ъ": "'",
    "Ь": "",
    "ь": "",
}


def _match_case(source: str, target: str) -> str:
    if source.isupper():
        return target.upper()
    if source[0].isupper():
        return target.capitalize()
    return target


def lat2cyr(text: str) -> str:
    """Convert Uzbek Latin text to Cyrillic without breaking sh/ch/o'/g' clusters."""
    if not isinstance(text, str):
        return text

    result = []
    i = 0
    keys = sorted(LATIN_MULTI, key=len, reverse=True)
    while i < len(text):
        chunk = text[i:]
        matched = False
        for key in keys:
            part = chunk[: len(key)]
            if part.lower() == key:
                if (
                    key == "yo"
                    and len(chunk) > 2
                    and chunk[2] in {"'", "`", "ʻ", "‘", "’", "ʼ"}
                ):
                    continue
                result.append(_match_case(part, LATIN_MULTI[key]))
                i += len(key)
                matched = True
                break
        if matched:
            continue

        char = text[i]
        lower = char.lower()
        mapped = LATIN_SINGLE.get(lower)
        result.append(_match_case(char, mapped) if mapped else char)
        i += 1
    return "".join(result)


def cyr2lat(text: str) -> str:
    """Convert Uzbek Cyrillic text to Latin."""
    if not isinstance(text, str):
        return text

    result = []
    for char in text:
        result.append(CYR_MULTI.get(char) or CYR_SINGLE.get(char) or char)
    return "".join(result)
