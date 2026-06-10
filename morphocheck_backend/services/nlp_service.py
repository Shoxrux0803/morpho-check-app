import re
from collections import Counter
from typing import Any, Dict, List

from services.cache_service import cache_service


STOP_WORDS = {
    "uz": {
        "va",
        "yoki",
        "bilan",
        "uchun",
        "ham",
        "bu",
        "shu",
        "esa",
        "da",
        "degan",
        "bo'lgan",
        "bo'ladi",
    },
    "ru": {
        "и",
        "или",
        "с",
        "для",
        "также",
        "это",
        "этот",
        "а",
        "в",
        "на",
        "который",
        "будет",
    },
    "en": {"and", "or", "for", "the", "a", "an", "is", "are", "with", "to", "of", "in"},
    "kz": set(),
}

VOCABULARY_EXPANSIONS = {
    "uz": {
        "tahlil": ["analiz", "baholash", "tekshiruv"],
        "sog'liq": ["salomatlik", "organizm holati", "farovonlik"],
        "sogliq": ["salomatlik", "organizm holati", "farovonlik"],
        "vazn": ["og'irlik", "massa", "tana massasi"],
        "bo'y": ["tana uzunligi", "o'sish", "statura"],
        "boy": ["tana uzunligi", "o'sish", "statura"],
        "rivojlanish": ["o'sish dinamikasi", "taraqqiyot", "adaptatsiya"],
        "maslahat": ["tavsiya", "yo'riqnoma", "ko'rsatma"],
    },
    "ru": {
        "tahlil": ["анализ", "оценка", "обследование"],
        "sog'liq": ["здоровье", "состояние организма", "благополучие"],
        "sogliq": ["здоровье", "состояние организма", "благополучие"],
        "vazn": ["вес", "масса", "масса тела"],
        "bo'y": ["длина тела", "рост", "статура"],
        "boy": ["длина тела", "рост", "статура"],
        "rivojlanish": ["динамика роста", "развитие", "адаптация"],
        "maslahat": ["рекомендация", "руководство", "указание"],
    },
    "en": {
        "tahlil": ["analysis", "evaluation", "assessment"],
        "sog'liq": ["health", "wellbeing", "condition"],
        "sogliq": ["health", "wellbeing", "condition"],
        "vazn": ["weight", "body mass", "mass"],
        "bo'y": ["height", "stature", "body length"],
        "boy": ["height", "stature", "body length"],
        "rivojlanish": ["development", "growth dynamics", "adaptation"],
        "maslahat": ["advice", "recommendation", "guideline"],
    },
    "kz": {},
}

TOKEN_PATTERN = re.compile(r"[\w'`-]+", re.UNICODE)


def _normalize_token(token: str) -> str:
    return token.lower().replace("`", "'").strip("-'")


def analyze_text(text: str, lang: str = "uz") -> Dict[str, Any]:
    normalized_lang = lang if lang in STOP_WORDS else "uz"
    payload = {"text": text, "lang": normalized_lang}
    cache_key = cache_service.make_key("nlp:text-analysis:v1", payload)
    cached = cache_service.get_json(cache_key)
    if cached is not None:
        cached["cache"] = "hit"
        return cached

    tokens = [
        _normalize_token(match.group(0)) for match in TOKEN_PATTERN.finditer(text or "")
    ]
    tokens = [token for token in tokens if token]
    stop_words = STOP_WORDS[normalized_lang]
    keywords = [token for token in tokens if token not in stop_words and len(token) > 1]
    frequencies = Counter(keywords)
    top_terms = [
        {"term": term, "count": count} for term, count in frequencies.most_common(12)
    ]
    expansions = expand_vocabulary(
        [item["term"] for item in top_terms], normalized_lang
    )

    result = {
        "lang": normalized_lang,
        "token_count": len(tokens),
        "unique_token_count": len(set(tokens)),
        "keyword_count": len(keywords),
        "top_terms": top_terms,
        "expanded_vocabulary": expansions,
        "cache": "miss",
    }
    cache_service.set_json(cache_key, result, ttl_seconds=1800)
    return result


def expand_vocabulary(terms: List[str], lang: str = "uz") -> Dict[str, List[str]]:
    normalized_lang = lang if lang in VOCABULARY_EXPANSIONS else "uz"
    expansions = VOCABULARY_EXPANSIONS[normalized_lang]
    result: Dict[str, List[str]] = {}
    for term in terms:
        key = _normalize_token(term)
        if key in expansions:
            result[key] = expansions[key]
    return result
