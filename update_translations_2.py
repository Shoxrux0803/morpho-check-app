import re

file_path = 'c:/Users/user/.gemini/antigravity/scratch/morpho-check-app/src/contexts/LanguageContext.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

keys = {
    'noPreviousMeasurement': {
        'tg': 'Барои ин кӯдак ченаки қаблӣ ёфт нашуд.',
        'uz': 'Bu bola uchun oldingi o\'lchov topilmadi.',
        'ru': 'Для этого ребенка предыдущее измерение не найдено.',
        'en': 'No previous measurement found for this child.',
        'tr': 'Bu çocuk için önceki ölçüm bulunamadı.',
        'ky': 'Бул бала үчүн мурдагы өлчөө табылган жок.',
        'kz': 'Бұл бала үшін алдыңғы өлшем табылған жоқ.',
        'tm': 'Bu çaga üçin öňki ölçeg tapylmady.',
    }
}

for lang in keys['noPreviousMeasurement'].keys():
    pattern = re.compile(r'(\n  ' + lang + r': \{.*?\n)(  \},)', re.DOTALL)
    
    def replacer(match):
        block = match.group(1)
        closing = match.group(2)
        added_lines = []
        for key, translations_dict in keys.items():
            if f"{key}:" not in block:
                val = translations_dict.get(lang, translations_dict['en']).replace("'", "\\'")
                added_lines.append(f"    {key}: '{val}',")
        if added_lines:
            return block + "\n".join(added_lines) + "\n" + closing
        return match.group(0)

    content = pattern.sub(replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done noPreviousMeasurement!')
