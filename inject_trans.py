import re

file_path = r'c:\Users\user\.gemini\antigravity\scratch\morpho-check-app\src\contexts\LanguageContext.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

translations = {
    'uz': '''
    // Chat Settings
    chatSettingsTitle: 'Chat Sozlamalari',
    chatSettingsDesc: 'Bu yerdan qaysi rollar uchun AI Chat yordamchisi va Ichki Chat ko\\'rinishi hamda ishlashini yoqib yoki o\\'chirib qo\\'yishingiz mumkin.',
    aiChatLabel: 'AI Chat',
    internalChatLabel: 'Ichki Chat',
    settingUpdated: 'uchun sozlama yangilandi',
    settingError: 'Xatolik yuz berdi',
    roleAdminExt: 'Administratorlar (Admin)',
    roleResearcher: 'Izlanuvchilar (Researcher)',
    roleUser: 'Oddiy foydalanuvchilar (User)',
    roleFieldAssistant: 'Yordamchilar (Field Assistant)',
    roleGuest: 'Mehmonlar (Ro\\'yxatdan o\\'tmaganlar)',
''',
    'en': '''
    // Chat Settings
    chatSettingsTitle: 'Chat Settings',
    chatSettingsDesc: 'Here you can enable or disable the visibility and functionality of the AI Chat Assistant and Internal Chat for different roles.',
    aiChatLabel: 'AI Chat',
    internalChatLabel: 'Internal Chat',
    settingUpdated: 'setting updated for',
    settingError: 'An error occurred',
    roleAdminExt: 'Administrators (Admin)',
    roleResearcher: 'Researchers (Researcher)',
    roleUser: 'Regular Users (User)',
    roleFieldAssistant: 'Assistants (Field Assistant)',
    roleGuest: 'Guests (Unregistered)',
''',
    'ru': '''
    // Chat Settings
    chatSettingsTitle: 'Настройки чата',
    chatSettingsDesc: 'Здесь вы можете включить или отключить видимость и работу AI Чата и Внутреннего чата для разных ролей.',
    aiChatLabel: 'AI Чат',
    internalChatLabel: 'Внутренний Чат',
    settingUpdated: 'настройки обновлены для',
    settingError: 'Произошла ошибка',
    roleAdminExt: 'Администраторы (Admin)',
    roleResearcher: 'Исследователи (Researcher)',
    roleUser: 'Обычные пользователи (User)',
    roleFieldAssistant: 'Ассистенты (Field Assistant)',
    roleGuest: 'Гости (Незарегистрированные)',
''',
    'kz': '''
    // Chat Settings
    chatSettingsTitle: 'Чат параметрлері',
    chatSettingsDesc: 'Осы жерден әртүрлі рөлдер үшін AI чат және Ішкі чат көрінісі мен жұмысын қосуға немесе өшіруге болады.',
    aiChatLabel: 'AI Чат',
    internalChatLabel: 'Ішкі Чат',
    settingUpdated: 'үшін параметр жаңартылды',
    settingError: 'Қате пайда болды',
    roleAdminExt: 'Әкімшілер (Admin)',
    roleResearcher: 'Зерттеушілер (Researcher)',
    roleUser: 'Қарапайым пайдаланушылар (User)',
    roleFieldAssistant: 'Көмекшілер (Field Assistant)',
    roleGuest: 'Қонақтар (Тіркелмегендер)',
''',
    'ky': '''
    // Chat Settings
    chatSettingsTitle: 'Чат жөндөөлөрү',
    chatSettingsDesc: 'Бул жерден ар кандай ролдор үчүн AI чат жана Ички чаттын көрүнүшүн жана иштешин күйгүзүп же өчүрө аласыз.',
    aiChatLabel: 'AI Чат',
    internalChatLabel: 'Ички Чат',
    settingUpdated: 'үчүн жөндөө жаңыртылды',
    settingError: 'Ката кетти',
    roleAdminExt: 'Администраторлор (Admin)',
    roleResearcher: 'Изилдөөчүлөр (Researcher)',
    roleUser: 'Кадимки колдонуучулар (User)',
    roleFieldAssistant: 'Жардамчылар (Field Assistant)',
    roleGuest: 'Коноктор (Катталбагандар)',
''',
    'tg': '''
    // Chat Settings
    chatSettingsTitle: 'Танзимоти чат',
    chatSettingsDesc: 'Дар ин ҷо шумо метавонед намоёнӣ ва фаъолияти AI Чат ва Чати дохилиро барои нақшҳои гуногун фаъол ё ғайрифаъол кунед.',
    aiChatLabel: 'AI Чат',
    internalChatLabel: 'Чати дохилӣ',
    settingUpdated: 'барои танзимот нав карда шуд',
    settingError: 'Хатогӣ рух дод',
    roleAdminExt: 'Маъмурон (Admin)',
    roleResearcher: 'Тадқиқотчиён (Researcher)',
    roleUser: 'Истифодабарандагони оддӣ (User)',
    roleFieldAssistant: 'Ёварон (Field Assistant)',
    roleGuest: 'Меҳмонон (Ба қайд гирифта нашудаанд)',
''',
    'tm': '''
    // Chat Settings
    chatSettingsTitle: 'Çat sazlamalary',
    chatSettingsDesc: 'Bu ýerden dürli rollar üçin AI Çat we Içerki Çat görnüşini we işini açyp ýa-da öçürip bilersiňiz.',
    aiChatLabel: 'AI Çat',
    internalChatLabel: 'Içerki Çat',
    settingUpdated: 'üçin sazlama täzelendi',
    settingError: 'Ýalňyşlyk ýüze çykdy',
    roleAdminExt: 'Dolandyryjylar (Admin)',
    roleResearcher: 'Gözlegçiler (Researcher)',
    roleUser: 'Adaty ulanyjylar (User)',
    roleFieldAssistant: 'Kömeksiler (Field Assistant)',
    roleGuest: 'Myhmanlar (Hasaba alynmadyklar)',
''',
    'tr': '''
    // Chat Settings
    chatSettingsTitle: 'Sohbet Ayarları',
    chatSettingsDesc: 'Buradan farklı roller için AI Sohbeti ve İç Sohbet görünümünü ve çalışmasını açıp kapatabilirsiniz.',
    aiChatLabel: 'AI Sohbet',
    internalChatLabel: 'İç Sohbet',
    settingUpdated: 'için ayar güncellendi',
    settingError: 'Bir hata oluştu',
    roleAdminExt: 'Yöneticiler (Admin)',
    roleResearcher: 'Araştırmacılar (Researcher)',
    roleUser: 'Normal Kullanıcılar (User)',
    roleFieldAssistant: 'Asistanlar (Field Assistant)',
    roleGuest: 'Misafirler (Kayıtsız)',
'''
}

for lang_code, trans_text in translations.items():
    pattern = re.compile(rf'(\b{lang_code}:\s*{{)')
    content = pattern.sub(rf'\1\n{trans_text}', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Translations inserted perfectly with correct UTF-8.')
