import io
from datetime import datetime

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor

CONSENT_I18N = {
    "uz": {
        "title": "HELSINKI DEKLARATSIYASI ASOSIDAGI ETIK ROZILIK BAYONNOMASI",
        "subtitle": "MorphoCheck tizimida inson ishtirokidagi tibbiy tadqiqot ma'lumotlarini qayta ishlash",
        "child": "Bola/bemor F.I.SH.",
        "guardian": "Ota-ona yoki qonuniy vasiy",
        "relationship": "Munosabati",
        "phone": "Telefon",
        "date": "Sana",
        "policy": "Policy versiyasi",
        "standard": "Etik asos",
        "standard_text": (
            "Tizim shaxsiy, antropometrik va sog'liq ma'lumotlarini Jahon tibbiyot "
            "assotsiatsiyasining inson ishtirokidagi tibbiy tadqiqotlar uchun etik tamoyillar "
            "to'g'risidagi Helsinki deklaratsiyasi asosida yuritadi: ishtirokchining huquqlari "
            "va farovonligi ustuvorligi, xabardor qilingan ixtiyoriy rozilik, maxfiylik, "
            "xavfni kamaytirish va ilmiy asoslangan maqsad."
        ),
        "consent": "Rozilik matni",
        "consent_text": (
            "Men bolaning qonuniy vakili sifatida uning shaxsiy, antropometrik va sog'liq "
            "ma'lumotlarini MorphoCheck tizimida tibbiy tahlil, ilmiy kuzatuv va hisobot "
            "tayyorlash maqsadida qayta ishlashga rozilik beraman. Rozilik ixtiyoriy bo'lib, "
            "qonuniy vakil tushunarli axborot olish va rozilikni bekor qilish huquqiga ega. "
            "Men bolamning jismoniy rivojlanishini tekshirish Helsinki deklaratsiyasi "
            "qoidalari asosida olib borilishiga rozilik bildiraman. Deklaratsiya matni bilan "
            "to'laligicha tanishdim."
        ),
        "use": "Ma'lumotlardan foydalanish",
        "use_items": [
            "Tibbiy-antropometrik tahlil va klinik tavsiyalar tayyorlash.",
            "Faqat ruxsatli admin, superadmin yoki izlanuvchi tomonidan ko'rib chiqish.",
            "Ilmiy/statistik tahlilda imkon qadar identifikatsiyasiz yoki minimallashtirilgan shaklda foydalanish.",
            "Bola kabi zaif ishtirokchilar manfaatini himoya qilish va zarar xavfini kamaytirish.",
        ],
        "signature": "Vasiy imzosi",
        "system": "Tizim qaydi",
    },
    "en": {
        "title": "ETHICAL CONSENT FORM UNDER THE DECLARATION OF HELSINKI",
        "subtitle": "Processing medical research data involving human participants in MorphoCheck",
        "child": "Child/patient full name",
        "guardian": "Parent or legal guardian",
        "relationship": "Relationship",
        "phone": "Phone",
        "date": "Date",
        "policy": "Policy version",
        "standard": "Ethical basis",
        "standard_text": (
            "The system handles personal, anthropometric, and health data under the World "
            "Medical Association Declaration of Helsinki ethical principles for medical research "
            "involving human participants: priority of participant rights and welfare, informed "
            "voluntary consent, confidentiality, risk minimization, and a scientifically justified purpose."
        ),
        "consent": "Consent statement",
        "consent_text": (
            "As the child's legal representative, I consent to processing the child's personal, "
            "anthropometric, and health data in MorphoCheck for medical analysis, research "
            "observation, and report preparation. Consent is voluntary, and the legal "
            "representative has the right to receive understandable information and withdraw consent. "
            "I consent to my child's physical development assessment being conducted in accordance "
            "with the rules of the Declaration of Helsinki. I have fully reviewed the text of the Declaration."
        ),
        "use": "Use of data",
        "use_items": [
            "Medical anthropometric analysis and clinical recommendations.",
            "Review only by authorized admin, superadmin, or researcher users.",
            "Scientific/statistical analysis in de-identified or minimized form whenever possible.",
            "Protection of vulnerable participants such as children and minimization of possible harm.",
        ],
        "signature": "Guardian signature",
        "system": "System record",
    },
    "tr": {
        "title": "HELSINKI BILDIRGESI KAPSAMINDA ETIK ONAM FORMU",
        "subtitle": "MorphoCheck sisteminde insan katilimcili tibbi arastirma verilerinin islenmesi",
        "child": "Cocuk/hasta tam adi",
        "guardian": "Ebeveyn veya yasal vasi",
        "relationship": "Yakinlik derecesi",
        "phone": "Telefon",
        "date": "Tarih",
        "policy": "Politika surumu",
        "standard": "Etik temel",
        "standard_text": (
            "Sistem, kisisel, antropometrik ve saglik verilerini Dunya Tabipler Birligi "
            "Helsinki Bildirgesi'nin insan katilimcili tibbi arastirmalara iliskin etik "
            "ilkeleri kapsaminda isler: katilimci haklari ve esenliginin onceligi, "
            "bilgilendirilmis gonullu onam, gizlilik, riskin azaltılması ve bilimsel olarak "
            "gerekcelendirilmis amac."
        ),
        "consent": "Onam metni",
        "consent_text": (
            "Cocugun yasal temsilcisi olarak, cocugun kisisel, antropometrik ve saglik "
            "verilerinin MorphoCheck sisteminde tibbi analiz, bilimsel izlem ve rapor "
            "hazirlama amaciyla islenmesine onay veriyorum. Onam gonulludur; yasal temsilci "
            "anlasilir bilgi alma ve onami geri cekme hakkina sahiptir. Cocugumun fiziksel "
            "gelisim degerlendirmesinin Helsinki Bildirgesi kurallarina uygun yurutulmesini "
            "kabul ediyorum. Bildirge metnini tamamen inceledim."
        ),
        "use": "Verilerin kullanimi",
        "use_items": [
            "Tibbi-antropometrik analiz ve klinik onerilerin hazirlanmasi.",
            "Yalnizca yetkili admin, superadmin veya arastirmaci kullanicilar tarafindan incelenmesi.",
            "Bilimsel/istatistiksel analizde mumkun oldugunca kimliksiz veya en aza indirilmis bicimde kullanilmasi.",
            "Cocuklar gibi hassas katilimcilarin yararinin korunmasi ve olasi zararin azaltılması.",
        ],
        "signature": "Vasi imzasi",
        "system": "Sistem kaydi",
    },
    "ru": {
        "title": "СТАНДАРТЫ КОНФИДЕНЦИАЛЬНОСТИ И ФОРМА СОГЛАСИЯ",
        "subtitle": "Обработка данных ребенка/пациента в MorphoCheck",
        "child": "Ф.И.О. ребенка/пациента",
        "guardian": "Родитель или законный представитель",
        "relationship": "Отношение",
        "phone": "Телефон",
        "date": "Дата",
        "policy": "Версия политики",
        "standard": "Стандарт конфиденциальности",
        "standard_text": (
            "Система обрабатывает персональные и медицинские данные согласно этическим принципам Хельсинкской декларации: "
            "целевое использование, минимально необходимый доступ, журналируемость и просмотр "
            "только авторизованными пользователями."
        ),
        "consent": "Текст согласия",
        "consent_text": (
            "Я, как законный представитель ребенка, даю согласие на обработку персональных, "
            "антропометрических и медицинских данных в MorphoCheck для медицинского анализа, "
            "научного наблюдения и подготовки отчетов. Я согласен(на), чтобы оценка "
            "физического развития моего ребенка проводилась в соответствии с правилами "
            "Хельсинкской декларации. С текстом Декларации я полностью ознакомлен(а)."
        ),
        "use": "Использование данных",
        "use_items": [
            "Медико-антропометрический анализ и клинические рекомендации.",
            "Просмотр авторизованным администратором, суперадмином или исследователем.",
            "Научно-статистический анализ в минимизированном виде, когда это возможно.",
        ],
        "signature": "Подпись представителя",
        "system": "Запись системы",
    },
    "kz": {
        "title": "ҚҰПИЯЛЫЛЫҚ СТАНДАРТТАРЫ ЖӘНЕ КЕЛІСІМ НЫСАНЫ",
        "subtitle": "MorphoCheck жүйесінде бала/пациент деректерін өңдеу",
        "child": "Бала/пациенттің толық аты-жөні",
        "guardian": "Ата-ана немесе заңды өкіл",
        "relationship": "Қатынасы",
        "phone": "Телефон",
        "date": "Күні",
        "policy": "Саясат нұсқасы",
        "standard": "Құпиялылық стандарты",
        "standard_text": (
            "Жүйе жеке және денсаулық деректерін Хельсинки декларациясының этикалық қағидаттарына сай өңдейді: "
            "мақсатты пайдалану, ең аз қажетті қолжетімділік, аудит ізі және тек рұқсатты "
            "пайдаланушыларға көрсету."
        ),
        "consent": "Келісім мәтіні",
        "consent_text": (
            "Мен баланың заңды өкілі ретінде оның жеке, антропометриялық және денсаулық "
            "деректерін MorphoCheck жүйесінде медициналық талдау, ғылыми бақылау және есеп "
            "дайындау мақсатында өңдеуге келісім беремін. Мен баламның физикалық дамуын "
            "тексеру Хельсинки декларациясының қағидалары негізінде жүргізілуіне келісім "
            "беремін. Декларация мәтінімен толық таныстым."
        ),
        "use": "Деректерді пайдалану",
        "use_items": [
            "Медициналық-антропометриялық талдау және клиникалық ұсыныстар.",
            "Рұқсатты admin, superadmin немесе зерттеуші тарапынан қарау.",
            "Мүмкіндігінше азайтылған түрде ғылыми/статистикалық талдау.",
        ],
        "signature": "Өкіл қолы",
        "system": "Жүйе жазбасы",
    },
    "ky": {
        "title": "КУПУЯЛЫК СТАНДАРТТАРЫ ЖАНА МАКУЛДУК ФОРМАСЫ",
        "subtitle": "MorphoCheck тутумунда бала/бейтап маалыматтарын иштетүү",
        "child": "Бала/бейтаптын толук аты-жөнү",
        "guardian": "Ата-эне же мыйзамдуу өкүл",
        "relationship": "Мамилеси",
        "phone": "Телефон",
        "date": "Дата",
        "policy": "Саясат версиясы",
        "standard": "Купуялык стандарты",
        "standard_text": (
            "Тутум жеке жана ден соолук маалыматтарын Хельсинки декларациясынын этикалык принциптерине ылайык иштетет: "
            "максаттуу колдонуу, минималдуу жеткиликтүүлүк, аудит изи жана уруксат берилген "
            "колдонуучуларга гана көрсөтүү."
        ),
        "consent": "Макулдук тексти",
        "consent_text": (
            "Мен баланын мыйзамдуу өкүлү катары анын жеке, антропометриялык жана ден соолук "
            "маалыматтарын MorphoCheck тутумунда медициналык талдоо, илимий байкоо жана отчет "
            "даярдоо максатында иштетүүгө макулдук берем. Баламдын физикалык өнүгүүсүн "
            "текшерүү Хельсинки декларациясынын эрежелерине ылайык жүргүзүлүшүнө макулдук "
            "берем. Декларациянын тексти менен толук тааныштым."
        ),
        "use": "Маалыматтарды колдонуу",
        "use_items": [
            "Медициналык-антропометриялык талдоо жана клиникалык сунуштар.",
            "Уруксат берилген admin, superadmin же изилдөөчү тарабынан кароо.",
            "Мүмкүн болушунча минималдаштырылган илимий/статистикалык талдоо.",
        ],
        "signature": "Өкүлдүн колу",
        "system": "Тутум жазуусу",
    },
    "tg": {
        "title": "СТАНДАРТҲОИ МАХФИЯТ ВА ШАКЛИ РОЗИГӢ",
        "subtitle": "Коркарди маълумоти кӯдак/бемор дар MorphoCheck",
        "child": "Ному насаби кӯдак/бемор",
        "guardian": "Волид ё васии қонунӣ",
        "relationship": "Муносибат",
        "phone": "Телефон",
        "date": "Сана",
        "policy": "Версияи сиёсат",
        "standard": "Стандарти махфият",
        "standard_text": (
            "Низом маълумоти шахсӣ ва тиббиро мувофиқи принсипҳои ахлоқии Эъломияи Ҳелсинки коркард мекунад: "
            "истифодаи мақсаднок, дастрасии ҳадди ақал, сабти аудит ва намоиш танҳо ба "
            "корбарони иҷозатдор."
        ),
        "consent": "Матни розигӣ",
        "consent_text": (
            "Ман ҳамчун намояндаи қонунии кӯдак барои коркарди маълумоти шахсӣ, антропометрӣ "
            "ва тиббии ӯ дар MorphoCheck бо мақсади таҳлили тиббӣ, назорати илмӣ ва омодасозии "
            "ҳисобот розигӣ медиҳам. Ман розӣ ҳастам, ки санҷиши рушди ҷисмонии фарзанди "
            "ман тибқи қоидаҳои Эъломияи Ҳелсинки гузаронида шавад. Бо матни Эъломия пурра "
            "шинос шудам."
        ),
        "use": "Истифодаи маълумот",
        "use_items": [
            "Таҳлили тиббӣ-антропометрӣ ва тавсияҳои клиникӣ.",
            "Дидан аз ҷониби admin, superadmin ё таҳқиқгари иҷозатдор.",
            "Таҳлили илмӣ/оморӣ дар шакли то ҳадди имкон камшуда.",
        ],
        "signature": "Имзои васӣ",
        "system": "Сабти низом",
    },
}


def _copy(lang: str) -> dict:
    return CONSENT_I18N.get(lang, CONSENT_I18N["uz"])


def _add_heading(doc: Document, text: str, size: int, color: str = "0F766E"):
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    run.bold = True
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    return paragraph


def _add_label_value(table, label: str, value: str):
    row = table.add_row().cells
    row[0].text = label
    row[1].text = value or "-"
    for cell in row:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
    row[0].paragraphs[0].runs[0].bold = True


def _full_name(data: dict) -> str:
    full = data.get("full_name") or data.get("child_name")
    if full:
        return str(full).strip()
    return f"{data.get('first_name') or data.get('firstName') or ''} {data.get('last_name') or data.get('lastName') or ''}".strip()


def generate_consent_docx(data: dict, lang: str = "uz") -> io.BytesIO:
    c = _copy(lang)
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(1.7)
    section.right_margin = Cm(1.7)

    _add_heading(doc, c["title"], 15)
    subtitle = doc.add_paragraph(c["subtitle"])
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.runs[0].italic = True
    subtitle.runs[0].font.size = Pt(10)

    doc.add_paragraph()
    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"
    _add_label_value(table, c["child"], _full_name(data))
    _add_label_value(
        table,
        c["guardian"],
        data.get("guardian_name")
        or data.get("consent_guardian_name")
        or data.get("consentGuardianName"),
    )
    _add_label_value(
        table,
        c["relationship"],
        data.get("guardian_relationship")
        or data.get("consent_guardian_relationship")
        or data.get("consentGuardianRelationship"),
    )
    _add_label_value(
        table,
        c["phone"],
        data.get("guardian_phone")
        or data.get("consent_guardian_phone")
        or data.get("consentGuardianPhone")
        or data.get("parents_phone")
        or data.get("parentsPhone"),
    )
    _add_label_value(
        table,
        c["date"],
        str(
            data.get("confirmed_at")
            or data.get("consent_confirmed_at")
            or datetime.utcnow().strftime("%Y-%m-%d")
        ),
    )
    _add_label_value(
        table,
        c["policy"],
        data.get("consent_policy_version")
        or data.get("consentPolicyVersion")
        or "helsinki-declaration-consent-v1",
    )

    for title_key, text_key in (
        ("standard", "standard_text"),
        ("consent", "consent_text"),
    ):
        doc.add_paragraph()
        heading = doc.add_paragraph()
        run = heading.add_run(c[title_key])
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor.from_string("0F766E")
        paragraph = doc.add_paragraph(c[text_key])
        paragraph.paragraph_format.space_after = Pt(6)

    doc.add_paragraph()
    heading = doc.add_paragraph()
    run = heading.add_run(c["use"])
    run.bold = True
    run.font.size = Pt(12)
    for item in c["use_items"]:
        paragraph = doc.add_paragraph(style=None)
        paragraph.style = doc.styles["List Bullet"]
        paragraph.add_run(item).font.size = Pt(10)

    doc.add_paragraph()
    sig_table = doc.add_table(rows=2, cols=2)
    sig_table.style = "Table Grid"
    sig_table.cell(0, 0).text = c["signature"]
    sig_table.cell(0, 1).text = "____________________________"
    sig_table.cell(1, 0).text = c["system"]
    sig_table.cell(
        1, 1
    ).text = f"MorphoCheck | {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
