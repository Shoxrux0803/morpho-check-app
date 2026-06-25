import re
import json

file_path = 'c:/Users/user/.gemini/antigravity/scratch/morpho-check-app/src/contexts/LanguageContext.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

keys = {
    'clinicalRiskSystem': {
        'tg': 'Системаи байрақи хатари клиникӣ',
        'uz': 'Klinik risk flag tizimi',
        'ru': 'Система клинических флагов риска',
        'en': 'Clinical risk flag system',
        'tr': 'Klinik risk bayrağı sistemi',
        'ky': 'Клиникалык коркунуч желеги системасы',
        'kz': 'Клиникалық қауіп жалауы жүйесі',
        'tm': 'Kliniki töwekgelçilik baýdagy ulgamy',
    },
    'progressTrackingLabel': {
        'tg': 'Пайгирии пешрафт',
        'uz': 'Progress tracking',
        'ru': 'Отслеживание прогресса',
        'en': 'Progress tracking',
        'tr': 'İlerleme takibi',
        'ky': 'Прогрессти көзөмөлдөө',
        'kz': 'Прогрессті бақылау',
        'tm': 'Gidişat yzarlamasy',
    },
    'compareWithPrevious': {
        'tg': 'Муқоиса бо ченаки қаблӣ',
        'uz': 'Oldingi o\'lchov bilan solishtirish',
        'ru': 'Сравнение с предыдущим измерением',
        'en': 'Comparison with previous measurement',
        'tr': 'Önceki ölçümle karşılaştırma',
        'ky': 'Мурдагы өлчөө менен салыштыруу',
        'kz': 'Алдыңғы өлшеммен салыстыру',
        'tm': 'Öňki ölçeg bilen deňeşdirme',
    },
    'changeInMonths': {
        'tg': 'моҳ тағйирот дар',
        'uz': 'oy ichidagi o\'zgarish',
        'ru': 'мес. изменение за',
        'en': 'months change',
        'tr': 'ay içindeki değişim',
        'ky': 'ай ичиндеги өзгөрүү',
        'kz': 'ай ішіндегі өзгеріс',
        'tm': 'aý içindäki üýtgeşme',
    },
    'forParents': {
        'tg': 'Барои волидон',
        'uz': 'Ota-ona uchun',
        'ru': 'Для родителей',
        'en': 'For parents',
        'tr': 'Ebeveynler için',
        'ky': 'Ата-энелер үчүн',
        'kz': 'Ата-аналар үшін',
        'tm': 'Ata-eneler üçin',
    },
    'clinicalNotes': {
        'tg': 'Эзоҳи клиникӣ',
        'uz': 'Klinik izoh',
        'ru': 'Клинический комментарий',
        'en': 'Clinical note',
        'tr': 'Klinik not',
        'ky': 'Клиникалык эскертүү',
        'kz': 'Клиникалық түсініктеме',
        'tm': 'Kliniki bellik',
    },
    'nutritionPlan': {
        'tg': 'Нақшаи ғизо',
        'uz': 'Nutrition plan',
        'ru': 'План питания',
        'en': 'Nutrition plan',
        'tr': 'Beslenme planı',
        'ky': 'Тамактануу планы',
        'kz': 'Тамақтану жоспары',
        'tm': 'Iýmit meýilnamasy',
    },
    'aiNoResponse': {
        'tg': 'AI ҷавоб надод. Илтимос, аз нав кӯшиш кунед.',
        'uz': 'AI javob qaytarmadi. Iltimos, qayta urinib ko\'ring.',
        'ru': 'ИИ не ответил. Пожалуйста, попробуйте снова.',
        'en': 'AI did not respond. Please try again.',
        'tr': 'Yapay zeka yanıt vermedi. Lütfen tekrar deneyin.',
        'ky': 'ЖИ жооп берген жок. Сураныч, кайра аракет кылыңыз.',
        'kz': 'ЖИ жауап бермеді. Қайта көріңіз.',
        'tm': 'AI jogap bermedi. Täzeden synanyşyň.',
    },
    'networkError': {
        'tg': 'Танзимоти интернет/API-ро санҷед.',
        'uz': 'Internet/API sozlamalarini tekshiring.',
        'ru': 'Проверьте настройки интернета/API.',
        'en': 'Check internet/API settings.',
        'tr': 'İnternet/API ayarlarını kontrol edin.',
        'ky': 'Интернет/API жөндөөлөрүн текшериңиз.',
        'kz': 'Интернет/API параметрлерін тексеріңіз.',
        'tm': 'Internet/API sazlamalaryny barlaň.',
    },
    'aiAssistantError': {
        'tg': 'Ҳангоми даъвати ёвари AI хатогӣ рӯй дод.',
        'uz': 'AI yordamchini chaqirishda xatolik yuz berdi.',
        'ru': 'Произошла ошибка при вызове ИИ-ассистента.',
        'en': 'An error occurred while calling the AI assistant.',
        'tr': 'Yapay zeka asistanı çağrılırken bir hata oluştu.',
        'ky': 'ЖИ жардамчысын чакырууда ката кетти.',
        'kz': 'ЖИ көмекшісін шақыру кезінде қате орын алды.',
        'tm': 'AI kömekçisini çagyrmakda ýalňyşlyk ýüze çykdy.',
    }
}

for lang in keys['clinicalRiskSystem'].keys():
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
print('Done!')
