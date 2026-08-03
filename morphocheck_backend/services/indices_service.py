import math
from typing import Any, Dict

from services.ky_localization import report_text

_T = {
    # HMAI tavsiflari
    "hmai_optimal": {
        "uz": "muhitga nisbatan optimal morfologik moslashuv",
        "ru": "оптимальная морфологическая адаптация к среде",
        "en": "optimal morphological adaptation to the environment",
        "tg": "мутобиқшавии оптималии морфологӣ нисбат ба муҳит",
        "kz": "қоршаған ортаға оңтайлы морфологиялық бейімделу",
        "tm": "dasky gurshawa garanda optimal morfologik uygunlasma",
        "tr": "cevreye gore optimal morfolojik uyum",
    },
    "hmai_accel": {
        "uz": "akseleratsiya / yuqori morfologik rivojlanish",
        "ru": "акселерация / высокое морфологическое развитие",
        "en": "acceleration / high morphological development",
        "tg": "акселератсия / рушди баланди морфологӣ",
        "kz": "акселерация / жоғары морфологиялық дамуы",
        "tm": "akselerasiya / yokary morfologik osus",
        "tr": "akselerasyon / yuksek morfolojik gelisim",
    },
    "hmai_stress": {
        "uz": "moslashuv stresi yoki rivojlanishning sekinlashishi",
        "ru": "адаптационный стресс или замедление развития",
        "en": "adaptation stress or developmental delay",
        "tg": "стресси мутобиқшавӣ ё сустшавии рушд",
        "kz": "бейімделу стрессі немесе дамуының баяулауы",
        "tm": "uygunlasma stresi ya-da osusin hayallamagy",
        "tr": "uyum stresi veya gelisimin yavaslamasi",
    },
    # MII tavsiflari
    "mii_high": {
        "uz": "somatik komponentlarning yuqori integratsiyasi",
        "ru": "высокая интеграция соматических компонентов",
        "en": "high integration of somatic components",
        "tg": "интегратсияи баланди ҷузъҳои соматикӣ",
        "kz": "соматикалық компоненттердің жоғары интеграциясы",
        "tm": "somatik komponentlerin yokary integrasiyasy",
        "tr": "somatik bilesenlerin yuksek entegrasyonu",
    },
    "mii_normal": {
        "uz": "normal o'rtacha morfologik muvozanat",
        "ru": "нормальный средний морфологический баланс",
        "en": "normal average morphological balance",
        "tg": "мувозинати миёнаи морфологии меъёрӣ",
        "kz": "қалыпты орташа морфологиялық тепе-теңдік",
        "tm": "kadaly orta morfologik denagramlylyk",
        "tr": "normal ortalama morfolojik denge",
    },
    "mii_low": {
        "uz": "past morfologik nomutanosiblik",
        "ru": "низкая морфологическая диспропорция",
        "en": "low morphological imbalance",
        "tg": "номувофиқати пасти морфологӣ",
        "kz": "төмен морфологиялық диспропорция",
        "tm": "pes morfologik nomutanosiplik",
        "tr": "dusuk morfolojik uyumsuzluk",
    },
    # ADI tavsiflari
    "adi_harmony": {
        "uz": "uyg'un rivojlanish",
        "ru": "гармоничное развитие",
        "en": "harmonious development",
        "tg": "рушди ҳамоҳанг",
        "kz": "үйлесімді даму",
        "tm": "uygun osus",
        "tr": "uyumlu gelisim",
    },
    "adi_mid": {
        "uz": "o'rtacha nomutanosiblik",
        "ru": "умеренная диспропорция",
        "en": "moderate disharmony",
        "tg": "номувофиқати миёна",
        "kz": "орташа диспропорция",
        "tm": "orta nomutanosiplik",
        "tr": "orta uyumsuzluk",
    },
    "adi_high": {
        "uz": "yuqori darajadagi nomutanosiblik",
        "ru": "высокая степень диспропорции",
        "en": "high degree of disharmony",
        "tg": "номувофиқати дараҷаи баланд",
        "kz": "жоғары дәрежелі диспропорция",
        "tm": "yokary derejeli nomutanosiplik",
        "tr": "yuksek duzeyde uyumsuzluk",
    },
    # Tip va holat tavsiflari
    "astenik": {
        "uz": "astenik",
        "ru": "астенический",
        "en": "asthenic",
        "kz": "астеникалық",
        "tm": "astenik",
        "tr": "astenik",
    },
    "normostenik": {
        "uz": "normostenik",
        "ru": "нормостенический",
        "en": "normosthenic",
        "kz": "нормостеникалық",
        "tm": "normostenik",
        "tr": "normostenik",
    },
    "giperstenik": {
        "uz": "giperstenik",
        "ru": "гиперстенический",
        "en": "hypersthenic",
        "kz": "гиперстеникалық",
        "tm": "hiperstenik",
        "tr": "hiperstenik",
    },
    "mos": {
        "uz": "mos",
        "ru": "соответствует",
        "en": "matches",
        "kz": "сәйкес келеді",
        "tm": "gabat gelyar",
        "tr": "uygun",
    },
    "mos_emas": {
        "uz": "mos emas",
        "ru": "не соответствует",
        "en": "does not match",
        "kz": "сәйкес келмейді",
        "tm": "gabat gelenok",
        "tr": "uygun degil",
    },
    "yoq": {
        "uz": "yo'q",
        "ru": "отсутствует",
        "en": "none",
        "kz": "жоқ",
        "tm": "yok",
        "tr": "yok",
    },
    "mavjud": {
        "uz": "mavjud",
        "ru": "присутствует",
        "en": "present",
        "kz": "бар",
        "tm": "bar",
        "tr": "var",
    },
    # Maslahatlar
    "adv_body_len_high": {
        "uz": "{sub_pos} tana uzunligi ushbu yosh uchun me'yordan ancha yuqori (gipermetriya).",
        "ru": "Длина тела {sub_pos_lc} значительно выше нормы для данного возраста (гиперметрия).",
        "en": "Body length is significantly above the norm for this age (hypermetry).",
        "kz": "{sub_pos} дене ұзындығы осы жас үшін нормадан әлдеқайда жоғары (gipermetriya).",
        "tm": "{sub_pos} beden uzynlygy bu yas ucin kadadan ep-esli yokary (gipermetriya).",
        "tr": "{sub_pos} vucut uzunlugu bu yas icin normun cok uzerinde (hipermetri).",
    },
    "adv_body_len_low": {
        "uz": "{sub_pos} tana uzunligi me'yordan ancha past. Bu rivojlanishning sekinlashishi belgisi bo'lishi mumkin, mutaxassis ko'rigi tavsiya etiladi.",
        "ru": "Длина тела {sub_pos_lc} значительно ниже нормы. Это может быть признаком замедления развития — рекомендуется консультация специалиста.",
        "en": "Body length is significantly below normal. This may indicate developmental delay — specialist consultation is recommended.",
        "kz": "{sub_pos} дене ұзындығы нормадан әлдеқайда төмен. Бұл дамудың баяулауының белгісі болуы мүмкін, маман кеңесі ұсынылады.",
        "tm": "{sub_pos} beden uzynlygy kadadan ep-esli pes. Bu osusin hayallamagynyn alamaty bolup biler, barlag maslahat berilyar.",
        "tr": "{sub_pos} vucut uzunlugu normun cok altinda. Bu gelisimin yavaslamasinin bir isareti olabilir, uzman muayenesi onerilir.",
    },
    "adv_body_len_ok": {
        "uz": "{sub_pos} tana uzunligi yoshga mos va me'yor atrofida.",
        "ru": "Длина тела {sub_pos_lc} соответствует возрасту и находится в пределах нормы.",
        "en": "Body length is age-appropriate and within the normal range.",
        "kz": "{sub_pos} дене ұзындығы жасқа сәйкес және норма шеңберінде.",
        "tm": "{sub_pos} beden uzynlygy yasa gabat gelyar we kada yakyn.",
        "tr": "{sub_pos} vucut uzunlugu yasa uygun and norm civarinda.",
    },
    "adv_hmai_very_high": {
        "uz": "{sub_loc} o'sish va rivojlanish jarayoni juda jadal (akseleratsiya) kechmoqda. Bu davrda suyak va mushak tizimini qo'llab-quvvatlash uchun oqsil, kalsiy va D vitamini juda muhim.",
        "ru": "Процесс роста и развития {sub_loc_lc} протекает очень интенсивно (акселерация). В этот период крайне важны белок, кальций и витамин D для поддержки костной и мышечной систем.",
        "en": "Growth and development is very intensive (acceleration). Protein, calcium and vitamin D are crucial during this period to support the skeletal and muscular systems.",
        "kz": "{sub_loc} өсу мен даму процесі өте қарқынды (акселерация) жүруде. Бұл кезеңде сүйек пен бұлшық ет жүйесін қолдау үшін ақуыз, кальций және D дәрумені өте маңызды.",
        "tm": "{sub_loc} osus we osup yetisik dury juda calt (akselerasiya) gecyar. Bu dowurde sunki we muskul ulgamyny goldamak ucin belok, kalsiy we D vitamini oran wajypdyr.",
        "tr": "{sub_loc} buyume ve gelisme sureci cok hizli (akselerasyon) ilerliyor. This donemde iskelet ve kas sistemini desteklemek icin protein, kalsiyum ve D vitamini cok onemlidir.",
    },
    "adv_hmai_high": {
        "uz": "{sub_loc} o'sish sur'atlari yuqori. Ratsionda vitamin va minerallar miqdorini oshirish va jismoniy faollikni muvofiqlashtirish tavsiya etiladi.",
        "ru": "Темпы роста {sub_loc_lc} высокие. Рекомендуется увеличить количество витаминов и минералов в рационе и скоординировать физическую активность.",
        "en": "Growth rates are high. It is recommended to increase vitamins and minerals in the diet and coordinate physical activity.",
        "kz": "{sub_loc} өсу қарқыны жоғары. Рационда дәрумендер мен минералдар мөлшерін арттыру және дене белсенділігін үйлестіру ұсынылады.",
        "tm": "{sub_loc} osus depginleri yokary. Iymitlenmede vitamin we minerallaryn mukdaryny artdyrmak we fiziki isjenligi ugrukdyrmak maslahat berilyar.",
        "tr": "{sub_loc} buyume hizi yuksek. Beslenmede vitamin ve mineral miktarinin artirilmasi and fiziksel aktivitenin koordine edilmesi onerilir.",
    },
    "adv_hmai_very_low": {
        "uz": "Organizmda moslashuv stresi yoki rivojlanishning biroz orqada qolishi belgilari bor. Kun tartibi, toza havoda sayr va hissiy xotirjamlikka alohida e'tibor bering.",
        "ru": "Наблюдаются признаки адаптационного стресса или незначительного отставания в развитии. Особое внимание уделите режиму дня, прогулкам на свежем воздухе и эмоциональному спокойствию.",
        "en": "Signs of adaptation stress or slight developmental delay are present. Pay special attention to daily routine, outdoor walks and emotional well-being.",
        "kz": "Бейімделу стрессінің немесе дамудың сәл кешігуінің белгілері бар. Күн тәртібіне, таза ауада серуендеуге және эмоционалдық тыныштыққа ерекше назар аударыңыз.",
        "tm": "Organizmde uygunlasma stresi ya-da osusin salnysmaly hayallamagynyn alamatlary bar. Kun tertibine, arassa howada gezim etme we emosional asuda-parahatlyga arajyk goldaw berin.",
        "tr": "Vucutta uyum stresi veya gelisimin biraz geride kalmasi belirtileri var. Gunluk rutine, temiz havada yuruyuslere ve duygusal huzura ozel onem verin.",
    },
    "adv_hmai_low": {
        "uz": "Moslashuv jarayoni biroz sekinlashgan. Immunitetni mustahkamlash, chiniqtirish muolajalari va to'g'ri dam olishni tashkil qiling.",
        "ru": "Процесс адаптации несколько замедлен. Уделите внимание укреплению иммунитета, закаливанию и правильному отдыху.",
        "en": "The adaptation process is slightly slowed. Focus on strengthening immunity, hardening procedures and proper rest.",
        "kz": "Бейімделу процесі сәл баяулады. Иммунитетті нығайтуға, шынықтыру рәсімдеріне және дұрыс демалысқа назар аударыңыз.",
        "tm": "Uygunlasma dury biraz hayallan. Immuniteti berkitmek, berkitme cäreleri we dogry dync almagy guramak maslahat berilyar.",
        "tr": "Uyum sureci biraz yavaslamis. Bagisikligi guclendirmeye, vucudu zinde tutmaya ve dogru dinlenmeye odaklanin.",
    },
    "adv_hmai_ok": {
        "uz": "{sub_pos} tashqi muhitga moslashuv me'yorda. Hozirgi sog'lom turmush tarzini {v_keep}.",
        "ru": "Адаптация к внешней среде в норме. Продолжайте вести здоровый образ жизни.",
        "en": "Adaptation to the environment is normal. Continue maintaining a healthy lifestyle.",
        "kz": "{sub_pos} сыртқы ортаға бейімделуі қалыпты. Қазіргі салауатты өмір салтын жалғастырыңыз.",
        "tm": "{sub_pos} dasky gurshawa uygunlasmagy kadaly. Hazirki sagdyn durmus yorelgesini {v_keep}.",
        "tr": "{sub_pos} cevreye uyumu normal. Mevcut saglikli yasam tarzini {v_keep}.",
    },
    "adv_mii_very_low": {
        "uz": "Tana komponentlari o'rtasida yaqqol nomutanosiblik kuzatilyapti. Maxsus jismoniy mashqlar majmuasi va mutaxassis maslahati zarur.",
        "ru": "Выявлена выраженная диспропорция между компонентами тела. Необходим специальный комплекс физических упражнений и консультация специалиста.",
        "en": "A pronounced imbalance between body components has been identified. A special set of physical exercises and specialist consultation are necessary.",
        "kz": "Дене компоненттері арасында айқын диспропорция байқалуда. Арнайы жаттығулар кешені мен маман кеңесі қажет.",
        "tm": "Bena komponentlerinin arasynda aydyn nomutanosiplik gozyetim gelyar. Yörite fiziki maşklar we maslahat zerur.",
        "tr": "Vucut bilesenleri arasinda belirgin bir uyumsuzluk gozleniyor. Ozel egzersiz programi ve uzman danismanligi gereklidir.",
    },
    "adv_mii_low": {
        "uz": "Morfologik muvozanat biroz buzilgan. Jismoniy faollikni oshirish (suzish, gimnastika) va oqsilli taomlar iste'molini ko'paytirish tavsiya etiladi.",
        "ru": "Морфологический баланс немного нарушен. Рекомендуется увеличить физическую активность (плавание, гимнастика) и увеличить потребление белковой пищи.",
        "en": "Morphological balance is slightly disturbed. It is recommended to increase physical activity (swimming, gymnastics) and protein food consumption.",
        "kz": "Морфологиялық тепе-теңдік сәл бұзылған. Дене белсенділігін арттыру (жүзу, гимнастика) және ақуызды тамақ тұтынуды көбейту ұсынылады.",
        "tm": "Morfologik denagramlylyk biraz bozulan. Fiziki isjenligi artdyrmak (yuzmek, gimnastika) we beloga bay iymitleri artdyrmak maslahat berilyar.",
        "tr": "Morfolojik denge biraz bozulmus. Fiziksel aktiviteyi artirmak (yuzme, jimnastik) and proteinli gidalari artirmak onerilir.",
    },
    "adv_mii_high": {
        "uz": "Tuzilish komponentlari juda yaxshi integratsiyalashgan, jismoniy rivojlanish darajasi yuqori.",
        "ru": "Компоненты телосложения очень хорошо интегрированы, уровень физического развития высокий.",
        "en": "Body composition components are very well integrated, the level of physical development is high.",
        "kz": "Дене тұрқының компоненттері өте жақсы интеграцияланған, дене дамуының деңгейі жоғары.",
        "tm": "Gurlus komponentleri gowy integrasirlenen, fiziki osus derejesi yokary.",
        "tr": "Yapisal bilesenler cok iyi entegre edilmis, fiziksel gelisim duzeyi yuksek.",
    },
    "adv_adi_very_high": {
        "uz": "Rivojlanishda yuqori darajadagi nomutanosiblik aniqlandi. Endokrinolog ko'rigi tavsiya etiladi.",
        "ru": "Выявлена высокая степень диспропорции в развитии. Рекомендуется консультация эндокринолога.",
        "en": "A high degree of developmental disharmony was identified. Endocrinologist consultation is recommended.",
        "kz": "Дамуда жоғары дәрежелі диспропорция анықталды. Эндокринолог кеңесі ұсынылады.",
        "tm": "Osusde yokary derejeli nomutanosiplik anyklanyldy. Endokrinolog barlagy maslahat berilyar.",
        "tr": "Gelisimde yuksek duzeyde uyumsuzluk belirlendi. Endokrinolog muayenesi onerilir.",
    },
    "adv_adi_high": {
        "uz": "Rivojlanishda o'rtacha nomutanosiblik kuzatilmoqda. Bo'y va vazn o'zgarishini muntazam kuzatib boring va ovqatlanishni tartibga soling.",
        "ru": "Наблюдается умеренная диспропорция в развитии. Регулярно контролируйте изменения роста и веса, нормализуйте питание.",
        "en": "Moderate developmental disharmony is observed. Regularly monitor height and weight changes and normalize nutrition.",
        "kz": "Дамуда орташа диспропорция байқалуда. Бой мен салмақ өзгерістерін үнемі бақылаңыз және тамақтануды реттеңіз.",
        "tm": "Osusde orta nomutanosiplik gozlenilyar. Boy we agram uytgemesini yzygiderli yzarlaň we iymitlenis rejimini duzen.",
        "tr": "Gelisimde orta duzeyde uyumsuzluk gozleniyor. Boy ve kilo degisimini duzenli olarak takip edin and beslenmeyi duzenleyin.",
    },
    "adv_adi_ok": {
        "uz": "{sub_term_cap} rivojlanishi uyg'un (mutanosib) holatda.",
        "ru": "Развитие гармоничное (пропорциональное).",
        "en": "Development is harmonious (proportional).",
        "kz": "Даму үйлесімді (пропорционал) жағдайда.",
        "tm": "{sub_term_cap} osusi uygun (denagramly) yagdayda.",
        "tr": "{sub_term_cap} gelisimi uyumlu (orantili) durumda.",
    },
    "adv_bmi_very_low": {
        "uz": "⚠️ {sub_loc} tana vazni yetishmovchiligi yaqqol namoyon bo'lmoqda. Bu sog'liqqa salbiy ta'sir qilishi mumkin. Yuqori kaloriyali oqsilli ovqatlanish va shifokor ko'rigi tavsiya etiladi.",
        "ru": "⚠️ У {sub_loc_lc} явно выражен дефицит массы тела. Это может негативно сказаться на здоровье. Рекомендуется высококалорийное белковое питание и консультация врача.",
        "en": "⚠️ A pronounced body weight deficit is observed. This may negatively affect health. High-calorie protein nutrition and a doctor's consultation are recommended.",
        "kz": "⚠️ {sub_loc} дене салмағының жетіспеушілігі айқын байқалуда. Бұл денсаулыққа кері әсер етуі мүмкін. Жоғары калориялы ақуызды тамақтану және дәрігер кеңесі ұсынылады.",
        "tm": "⚠️ {sub_loc} beden agramynyn yetmezciligi aydyn anyklanylyar. Bu saglyga erbet tasir edip biler. Yokary kaloriyaly belokly iymitlenme we lukman barlagy maslahat berilyar.",
        "tr": "⚠️ {sub_loc} belirgin kilo eksikligi gorulmektedir. Bu durum sagligi olumsuz etkileyebilir. Yuksek kalorili proteinli beslenme and doktor muayenesi onerilir.",
    },
    "adv_bmi_low": {
        "uz": "⚠️ {sub_loc} vazn yetishmasligi kuzatilmoqda. Ratsion quvvatini oshirish va to'yimli ovqatlantirishni ta'minlash lozim.",
        "ru": "⚠️ У {sub_loc_lc} наблюдается недостаточная масса тела. Необходимо увеличить калорийность рациона и обеспечить полноценное питание.",
        "en": "⚠️ Insufficient body weight is observed. It is necessary to increase calorie intake and ensure adequate nutrition.",
        "kz": "⚠️ {sub_loc} салмақ жетіспеушілігі байқалуда. Рацион қуаттылығын арттыру және толыққанды тамақтануды қамтамасыз ету қажет.",
        "tm": "⚠️ {sub_loc} agram yetmezciligi gozlenilyar. Iymitlenis mukdaryny we gymmatyny artdyrmak gerek.",
        "tr": "⚠️ {sub_loc} kilo eksikligi gozleniyor. Beslenme kalorisini artirmak and besleyici gidalar saglamak gerekir.",
    },
    "adv_bmi_very_high": {
        "uz": "⚠️ {sub_loc} vazn me'yordan sezilarli darajada yuqori (semizlik). Shirinliklar va fast-fudlarni cheklash, jismoniy faollik rejimini kuchaytirish kerak.",
        "ru": "⚠️ Масса тела {sub_loc_lc} значительно превышает норму (ожирение). Необходимо ограничить сладкое и фастфуд, усилить режим физической активности.",
        "en": "⚠️ Body weight is significantly above normal (obesity). It is necessary to limit sweets and fast food, and increase the physical activity regimen.",
        "kz": "⚠️ {sub_loc} салмағы нормадан айтарлықтай жоғары (семіздік). Тәттілер мен фастфудты шектеу, дене белсенділігі режимін күшейту қажет.",
        "tm": "⚠️ {sub_loc} agramy kadadan ep-esli yokary (semizlik). Suyjulikleri we fast-fudlary seklendirmek, fiziki isjenlik rejimini guyclendirmek gerek.",
        "tr": "⚠️ {sub_loc} kilosu normun belirgin sekilde uzerinde (obezite). Tatlilari ve fast-food'u sinirlamak, fiziksel aktiviteyi artirmak gerekir.",
    },
    "adv_bmi_high": {
        "uz": "⚠️ {sub_loc} vazn biroz ortiqcha. Ratsionni muvozanatlashtirish va jismoniy yuklamalarni oshirish tavsiya etiladi.",
        "ru": "⚠️ У {sub_loc_lc} масса тела немного выше нормы. Рекомендуется сбалансировать рацион и увеличить физические нагрузки.",
        "en": "⚠️ Body weight is slightly above normal. It is recommended to balance the diet and increase physical activity.",
        "kz": "⚠️ {sub_loc} салмағы сәл артық. Рационды теңестіру және дене жүктемелерін арттыру ұсынылады.",
        "tm": "⚠️ {sub_loc} agramy biraz artyk. Iymitlenmeyi denagramlasdyrmak we fiziki yukleri artdyrmak maslahat berilyar.",
        "tr": "⚠️ {sub_loc} kilosu biraz fazla. Beslenmeyi dengelemek and fiziksel yukleri artirmak onerilir.",
    },
    "adv_soma_astenik": {
        "uz": "🎨 {sub_pos} astenik tana tuzilishiga ega: moddalar almashinuvi juda tez. Mushaklarni mustahkamlash uchun kuch mashqlari va oqsilli parhez muhim.",
        "ru": "🎨 {sub_pos_nom} астенического типа телосложения: обмен веществ очень быстрый. Для укрепления мышц важны силовые упражнения и белковая диета.",
        "en": "🎨 Asthenic body type with a very fast metabolism. Strength exercises and a protein diet are important for building muscles.",
        "kz": "🎨 {sub_pos} астеникалық дене тұрқысы: зат алмасу өте жылдам. Бұлшық еттерді нығайту үшін күш жаттығулары мен ақуызды тамақтану маңызды.",
        "tm": "🎨 {sub_pos} astenik beden gurlusyna eye: moddalaryn calt calsmasy bar. Muskullary berkitmek ucin guycli masklar we belokly iymitlenme wajypdyr.",
        "tr": "🎨 {sub_pos} astenik vucut yapisina sahip: metabolizma cok hizli. Kaslari guclendirmek icin direnc egzersizleri and proteinli diyet onemlidir.",
    },
    "adv_soma_giper": {
        "uz": "🎨 {sub_pos} giperstenik tip: vazn yig'ishga moyillik bor. Faol jismoniy yuklamalar (yugurish, suzish) va uglevodlarni kamroq iste'mol qilish salomatlikni saqlashga yordam beradi.",
        "ru": "🎨 {sub_pos_nom} гиперстенического типа: склонность к набору веса. Активные физические нагрузки (бег, плавание) и снижение потребления углеводов помогут сохранить здоровье.",
        "en": "🎨 Hypersthenic body type with a tendency to gain weight. Active physical activity (running, swimming) and reduced carbohydrate intake will help maintain health.",
        "kz": "🎨 {sub_pos} гиперстеникалық тип: салмақ жиюға бейімділік бар. Белсенді дене жүктемелері (жүгіру, жүзу) және көмірсуларды азайту дене саулығын сақтауға көмектеседі.",
        "tm": "🎨 {sub_pos} hiperstenik tip: agram yygmaga beyimlik bar. Isjen fiziki yukler (yugurmek, yuzmek) we uglewodlary azaltmak saglygy saklamaga komek eder.",
        "tr": "🎨 {sub_pos} hiperstenik tip: kilo almaya meyilli. Aktif fiziksel egzersizler (kosu, yuzme) and karbonhidratlarin azaltilmasi sagligi korumaya yardimci olur.",
    },
    "adv_soma_normo": {
        "uz": "🎨 {sub_pos} normostenik tip: uyg'un rivojlanmoqda. Holatni saqlash uchun muvozanatli ovqatlanish rejimiga amal qiling.",
        "ru": "🎨 {sub_pos_nom} нормостенического типа: гармоничное развитие. Придерживайтесь сбалансированного питания для поддержания формы.",
        "en": "🎨 Normosthenic body type: harmonious development. Follow a balanced diet to maintain condition.",
        "tg": "{sub_pos} навъи нормостеник дорад: рушд ҳамоҳанг аст. Барои нигоҳ доштани ҳолат ба реҷаи ғизои мутавозин риоя кунед.",
        "kz": "🎨 {sub_pos} нормостеникалық тип: үйлесімді дамуда. Жағдайды сақтау үшін теңдестірілген тамақтану режиміне сүйеніңіз.",
        "tm": "🎨 {sub_pos} normostenik tip: uygun osyar. Yagdayy saklamak ucin denagramly iymitlenme rezimine amal edin.",
        "tr": "🎨 {sub_pos} normostenik tip: uyumlu gelisiyor. Durumu korumak icin dengeli beslenme duzenine uyun.",
    },
    "adv_fat_high": {
        "uz": "Tanadagi yog' miqdori me'yordan yuqori. Shirinliklar, gazli ichimliklar va xamir ovqatlarni cheklang, ko'proq sabzavot va mevalar {v_suffix}.",
        "ru": "Количество жира в теле выше нормы. Ограничьте сладкое, газированные напитки и мучное, употребляйте больше овощей и фруктов.",
        "en": "The amount of body fat is above normal. Limit sweets, carbonated drinks and flour products, eat more vegetables and fruits.",
        "kz": "Денедегі май мөлшері нормадан жоғары. Тәттілерді, газдалған сусындарды және ұнды тамақтарды шектеңіз, көбірек көкөніс пен жемістер {v_suffix}.",
        "tm": "Bendedaki yag mukdary kadadan yokary. Suyjulikleri, gazly suwlary we hamyr iymitlerini seklendirin, koprak gok-onum we miwe {v_suffix}.",
        "tr": "Vucuttaki yag orani normun uzerinde. Tatlilari, gazli icecekleri and unlu mamulleri sinirlayin, daha fazla sebze ve meyve {v_suffix}.",
    },
    "adv_fat_low": {
        "uz": "Yog' massasi me'yordan past. Ratsionda sog'lom yog'lar (yong'oqlar, zaytun moyi) miqdorini biroz oshirish tavsiya etiladi.",
        "ru": "Жировая масса ниже нормы. Рекомендуется немного увеличить потребление здоровых жиров (орехи, оливковое масло) в рационе.",
        "en": "Fat mass is below normal. It is recommended to slightly increase the intake of healthy fats (nuts, olive oil) in the diet.",
        "kz": "Май массасы нормадан төмен. Рационда пайдалы майлар (жаңғақтар, зәйтүн майы) мөлшерін сәл арттыру ұсынылады.",
        "tm": "Yag massasy kadadan pes. Iymitlenmede sagdyn yaglary (hozlar, zeýtun yagy) biraz artdyrmak maslahat berilyar.",
        "tr": "Yag kutlesi normun altinda. Beslenmede saglikli yaglarin (findik, zeytinyagi) miktarini biraz artirmak onerilir.",
    },
    "adv_muscle_low": {
        "uz": "Mushak massasi yetarli emas. Jismoniy faollikni (sport to'garaklari) va oqsilli taomlar iste'molini oshirish lozim.",
        "ru": "Мышечная масса недостаточна. Необходимо увеличить физическую активность (спортивные секции) и потребление белковой пищи.",
        "en": "Muscle mass is insufficient. It is necessary to increase physical activity (sports clubs) and protein food consumption.",
        "kz": "Бұлшық ет массасы жеткіліксіз. Дене белсенділігін (спорт секциялары) және ақуызды тамақ тұтынуды арттыру қажет.",
        "tm": "Muskul massasy yetersiz. Fiziki isjenligi (sport gurnaklary) we belokly iymitlenmeyi artdyrmak gerek.",
        "tr": "Kas kutlesi yetersiz. Fiziksel aktiviteyi (spor etkinlikleri) and proteinli gidalarin tuketimini artirmak gerekir.",
    },
    "adv_water_low": {
        "uz": "Organizmda suv miqdori (gidratsiya) past. Kun davomida toza suv ichish rejimiga amal qiling.",
        "ru": "Уровень воды (гидратации) в организме низкий. Соблюдайте режим употребления чистой воды в течение дня.",
        "en": "The body's hydration level is low. Follow a daily clean water intake regimen.",
        "kz": "Организмдегі су мөлшері (гидратация) төмен. Күні бойы таза су ішу режиміне сүйеніңіз.",
        "tm": "Organizmde suw mukdary pes. Gun dowamynda arassa suw icmek rezimine eyerin.",
        "tr": "Vucuttaki su orani dusuk. Gun boyunca temiz su icme duzenine uyun.",
    },
    "adv_visceral_high": {
        "uz": "Visseral (ichki) yog' darajasi yuqori. Bu moddalar almashinuvi buzilishiga olib kelishi mumkin. Sog'lom parhez va kardio mashqlar zarur.",
        "ru": "Уровень висцерального (внутреннего) жира высокий. Это может привести к нарушению обмена веществ. Необходимы здоровое питание и кардиоупражнения.",
        "en": "Visceral (internal) fat level is high. This may lead to metabolic disorders. A healthy diet and cardio exercises are necessary.",
        "kz": "Висцеральды (ішкі) май деңгейі жоғары. Бұл зат алмасу бұзылысына әкелуі мүмкін. Салауатты тамақтану және кардио жаттығулар қажет.",
        "tm": "Visseral (icki) yag derejesi yokary. Bu moddalaryn calsyk bozulmagyna eltip biler. Sagdyn iymitlenme we kardio masklar zerur.",
        "tr": "Visseral (ic) yag orani yuksek. Bu metabolizma bozukluguna yol acabilir. Saglikli beslenme and kardiyo egzersizleri gereklidir.",
    },
    "mcri_optimal": {
        "uz": "Xavf past",
        "ru": "Низкий риск",
        "en": "Low risk",
        "tg": "Хавфи паст",
        "kz": "Қауіп төмен",
        "tm": "Pes howp",
        "tr": "Dusuk risk",
    },
    "mcri_moderate": {
        "uz": "O'rtacha xavf (Adipoz fenotip bosqichi)",
        "ru": "Умеренный риск (Стадия адипозного фенотипа)",
        "en": "Moderate risk (Adipose phenotype stage)",
        "tg": "Хавфи миёна (марҳилаи фенотипи адипозӣ)",
        "kz": "Орташа қауіп",
        "tm": "Orta howp (adipoz fenotip tapgyry)",
        "tr": "Orta risk (adipoz fenotip asamasi)",
    },
    "mcri_high": {
        "uz": "Yuqori xavf (Ortiqcha yog' va mushak yetishmovchiligi)",
        "ru": "Высокий риск (Избыток жира и дефицит мышц)",
        "en": "High risk (Fat excess and muscle deficit)",
        "tg": "Хавфи баланд (зиёдатии чарб ва норасоии мушак)",
        "kz": "Жоғары қауіп",
        "tm": "Yokary howp (artyk yag we muskul yetmezciligi)",
        "tr": "Yuksek risk (fazla yag ve kas eksikligi)",
    },
    "adv_mcri_high": {
        "uz": "⚠️ Внимание! MCRI (Kompleks risk indeksi) yuqori. Moddalar almashinuvida adipoz fenotip aniqlandi, mutaxassis (endokrinolog, diyetolog) ko'rigi zudlik bilan tavsiya etiladi.",
        "ru": "⚠️ Внимание! MCRI (Комплекс Риск Индекс) высокий. Выявлен адипозный фенотип в обмене веществ, настоятельно рекомендуется консультация специалиста (эндокринолог, диетолог).",
        "en": "⚠️ Attention! High MCRI. An adipose phenotype in metabolism has been identified, specialist consultation is strongly recommended.",
        "kz": "⚠️ Назар аударыңыз! MCRI жоғары. Зат алмасуда адипозды фенотип анықталды, маман кеңесі қатаң ұсынылады.",
        "tm": "⚠️ Uns berin! MCRI yokary. Calysykda adipoz fenotip anyklanyldy, hünärmen (endokrinolog, dietolog) barlagy gyssagly maslahat berilyar.",
        "tr": "⚠️ Dikkat! MCRI yuksek. Metabolizmada adipoz fenotip belirlendi, en kisa surede uzman (endokrinolog, diyetisyen) muayenesi onerilir.",
    },
    "cm": {
        "uz": "см",
        "ru": "см",
        "en": "cm",
        "kz": "см",
        "tm": "sm",
        "tr": "cm",
    },
    "kg": {
        "uz": "кг",
        "ru": "кг",
        "en": "kg",
        "kz": "кг",
        "tm": "kg",
        "tr": "kg",
    },
}


def _t(key: str, lang: str, **kwargs) -> str:
    """Lug'atdan matnni oladi va {placeholder}larni almashtiradi."""
    base = _T.get(key, {})
    text = base.get(lang) or base.get("uz") or key
    if kwargs:
        try:
            text = text.format(**kwargs)
        except KeyError:
            pass
    return report_text(text, lang)


def _is_male_gender(gender: str) -> bool:
    value = (gender or "").strip().lower()
    return any(
        marker in value
        for marker in (
            "erkak",
            "male",
            "boy",
            "o'g'il",
            "ogil",
            "\u045e\u0493\u0438\u043b",
            "\u043c\u0430\u043b\u044c\u0447\u0438\u043a",
        )
    )


def get_ideal_height_by_age_and_gender(age: int, gender: str) -> float:
    gender = (gender or "").strip().lower()
    boys_heights = {
        2: 87.8,
        3: 96.1,
        4: 103.3,
        5: 110.0,
        6: 116.0,
        7: 121.7,
        8: 127.3,
        9: 132.6,
        10: 137.8,
        11: 143.1,
        12: 149.1,
        13: 156.0,
        14: 163.8,
        15: 170.1,
        16: 173.4,
        17: 175.2,
        18: 176.1,
    }
    girls_heights = {
        2: 86.4,
        3: 95.1,
        4: 102.7,
        5: 109.4,
        6: 115.1,
        7: 120.8,
        8: 126.6,
        9: 132.5,
        10: 138.6,
        11: 145.0,
        12: 151.2,
        13: 157.1,
        14: 160.4,
        15: 162.1,
        16: 163.1,
        17: 163.5,
        18: 163.7,
    }

    if age <= 21:
        if _is_male_gender(gender):
            return boys_heights.get(age, 110.0 if age < 5 else 170.0)
        else:
            return girls_heights.get(age, 109.0 if age < 5 else 162.0)

    return 175.0 if _is_male_gender(gender) else 163.0


def get_fm_percent_norm(age: int, gender: str) -> tuple:
    gender = (gender or "").lower()
    is_male = _is_male_gender(gender)

    boys_fm = {
        2: (12, 21),
        3: (12, 21),
        4: (12, 21),
        5: (11, 20),
        6: (11, 20),
        7: (10, 20),
        8: (10, 20),
        9: (10, 21),
        10: (11, 22),
        11: (11, 23),
        12: (11, 23),
        13: (11, 23),
        14: (11, 23),
        15: (11, 23),
        16: (11, 23),
        17: (11, 23),
        18: (11, 23),
    }
    girls_fm = {
        2: (13, 23),
        3: (13, 23),
        4: (13, 23),
        5: (13, 23),
        6: (13, 23),
        7: (12, 24),
        8: (12, 24),
        9: (13, 25),
        10: (14, 26),
        11: (15, 27),
        12: (16, 28),
        13: (17, 29),
        14: (18, 30),
        15: (19, 31),
        16: (20, 32),
        17: (20, 32),
        18: (21, 33),
    }

    table = boys_fm if is_male else girls_fm
    age_key = min(max(age, 2), 18)

    if age > 18:
        return (10, 22) if is_male else (20, 30)

    return table.get(age_key, (10, 25))


def get_tbw_percent_norm(age: int, gender: str) -> tuple:
    """Yoshga qarab umumiy suv (TBW %) me'yorini qaytaradi."""
    gender = (gender or "").lower()
    is_male = _is_male_gender(gender)

    if age < 13:
        return (60, 75)
    elif age <= 18:
        return (60, 70) if is_male else (55, 65)
    else:
        return (60, 65) if is_male else (50, 60)


def get_muscle_percent_norm(age: int, gender: str) -> tuple:
    """Yoshga qarab muskul massa (%) me'yorini qaytaradi."""
    gender = (gender or "").lower()
    is_male = _is_male_gender(gender)

    if age < 13:
        return (35, 45)
    elif age <= 18:
        return (40, 55) if is_male else (30, 38)
    else:
        return (38, 50) if is_male else (30, 39)


def get_bone_percent_norm(age: int) -> tuple:
    """Yoshga qarab suyak massa (%) me'yorini qaytaradi."""
    if age < 13:
        return (3, 5)
    else:
        return (4, 6)


def get_visceral_norm(age: int) -> tuple:
    """Yoshga qarab visseral yog' darajasi me'yorini qaytaradi."""
    if age < 13:
        return (1, 3)
    elif age <= 18:
        return (1, 4)
    else:
        return (1, 9)


def get_ecological_factor(m: Dict[str, Any]) -> float:
    """Yashash hududiga asoslangan ekologik koeffitsientni (E) aniqlaydi."""
    if not m:
        return 1.05
    region = str(m.get("region", "")).lower()
    district = str(m.get("district", "")).lower()
    address = str(m.get("address", "")).lower()
    combined = f"{region} {district} {address}"

    # Shahar (Urban)
    is_city = any(
        k in combined for k in ("shahar", "shahri", "шаҳар", "city", "қала", "город")
    )
    if is_city:
        return 1.00

    # Cho'l - yarim cho'l
    if any(
        k in region
        for k in (
            "navoi",
            "навои",
            "buxor",
            "бухор",
            "xorazm",
            "хоразм",
            "qoraqalpoq",
            "қорақалпоқ",
            "karakalpak",
        )
    ):
        return 1.10

    # Tog'
    if any(
        k in region
        for k in (
            "toshkent",
            "тошкент",
            "namangan",
            "наманган",
            "samarqand",
            "самарқанд",
            "andijon",
            "андижон",
            "farg'ona",
            "фарғона",
            "fargona",
        )
    ):
        return 1.15

    # Dasht (Jizzax, Sirdaryo, Qashqadaryo, Surxondaryo va default qishloq/tumanlar)
    return 1.05


def get_centile_from_z(z: float) -> str:
    """Z-score asosida WHO sentil intervalini qaytaradi."""
    if z is None:
        return ""
    if z < -1.88:
        return "< 3"
    elif z < -1.04:
        return "3 - 15"
    elif z < 1.04:
        return "15 - 85"
    elif z < 1.88:
        return "85 - 97"
    else:
        return "> 97"


def get_corridor_from_z(z: float, lang: str) -> str:
    """Z-score asosida sog'lomlik yo'lagini quaytaradi."""
    if z is None:
        return ""
    corridors = {
        "uz": [
            "Juda kam vazn (<3-sentil)",
            "Kam vazn (3-15-sentil)",
            "Me'yor (15-85-sentil)",
            "Ortiqcha vazn (85-97-sentil)",
            "Semizlik (>97-sentil)",
        ],
        "ru": [
            "Крайний дефицит массы (<3-центиль)",
            "Дефицит массы (3-15-центиль)",
            "Норма (15-85-центиль)",
            "Избыточная масса (85-97-центиль)",
            "Ожирение (>97-центиль)",
        ],
        "en": [
            "Severe underweight (<3rd centile)",
            "Underweight (3rd-15th centile)",
            "Normal (15th-85th centile)",
            "Overweight (85th-97th centile)",
            "Obesity (>97th centile)",
        ],
        "tg": [
            "Камвазнии шадид (<3-сентил)",
            "Камвазнӣ (3-15-сентил)",
            "Меъёр (15-85-сентил)",
            "Вазни зиёдатӣ (85-97-сентил)",
            "Фарбеҳӣ (>97-сентил)",
        ],
        "ky": [
            "Өтө төмөн салмак (<3-сентиль)",
            "Төмөн салмак (3-15-сентиль)",
            "Норма (15-85-сентиль)",
            "Ашыкча салмак (85-97-сентиль)",
            "Семирүү (>97-сентиль)",
        ],
        "kz": [
            "Салмақтың өте төмендігі (<3-центиль)",
            "Салмақ тапшылығы (3-15-центиль)",
            "Норма (15-85-центиль)",
            "Артық салмақ (85-97-центиль)",
            "Семіздік (>97-центиль)",
        ],
        "tm": [
            "Pes agram (<3-persentil)",
            "Agram yetmezciligi (3-15-persentil)",
            "Kada (15-85-persentil)",
            "Artyk agram (85-97-persentil)",
            "Semizlik (>97-persentil)",
        ],
        "tr": [
            "Cok zayif (<3. persentil)",
            "Zayif (3-15. persentil)",
            "Normal (15-85. persentil)",
            "Fazla kilolu (85-97. persentil)",
            "Obezite (>97. persentil)",
        ],
    }
    texts = corridors.get(lang, corridors["uz"])
    if z < -1.88:
        return texts[0]
    elif z < -1.04:
        return texts[1]
    elif z < 1.04:
        return texts[2]
    elif z < 1.88:
        return texts[3]
    else:
        return texts[4]


def calculate_detailed_indices(
    age: int,
    gender: str,
    height: float,
    weight: float,
    bmi: float,
    manual_data: Dict[str, Any] = None,
    lang: str = "uz",
    all_settings: Dict[str, Any] = None,
) -> Dict[str, Any]:
    # Dinamik tarjimalar uchun yordamchi
    def _local_t(key, l, **kwargs):
        if all_settings:
            # Key: 'interp_astenik', 'adv_body_len_high', etc.
            # Avval interp_ prefixi bilan qidiramiz
            s_key = f"interp_{key}"
            if s_key not in all_settings:
                # Keyni o'zini qidiramiz (adv_ bilan boshlangan bo'lishi mumkin)
                s_key = key

            val = all_settings.get(s_key)
            if val and isinstance(val, dict):
                text = val.get(l) or val.get("uz", key)
                if kwargs:
                    try:
                        text = text.format(**kwargs)
                    except (KeyError, IndexError, ValueError) as exc:
                        text = f"{text} (format xatosi: {exc})"
                return report_text(text, l)

        # Fallback to hardcoded _T
        return _t(key, l, **kwargs)

    gender_norm = (gender or "").strip().lower()
    is_male = _is_male_gender(gender_norm)
    m = manual_data or {}

    # Tilga qarab murojaat shakli
    is_adult = age >= 21

    # Har bir til uchun addressing so'zlari
    _ADDR = {
        "uz": {
            "child": {
                "sub_pos": "Bolada",
                "sub_pos_nom": "Bola",
                "sub_pos_lc": "bolada",
                "sub_loc": "Bolaning",
                "sub_loc_lc": "bolaning",
                "sub_term": "farzandingizning",
                "sub_term_cap": "Farzandingizning",
                "sub_to": "bolaga",
                "v_suffix": "bering",
                "v_keep": "davom ettiring",
            },
            "adult": {
                "sub_pos": "Sizda",
                "sub_pos_nom": "Siz",
                "sub_pos_lc": "sizda",
                "sub_loc": "Sizning",
                "sub_loc_lc": "sizning",
                "sub_term": "o'zingizning",
                "sub_term_cap": "O'zingizning",
                "sub_to": "sizga",
                "v_suffix": "iste'mol qiling",
                "v_keep": "davom ettiring",
            },
        },
        "ru": {
            "child": {
                "sub_pos": "У ребёнка",
                "sub_pos_nom": "Ребёнок",
                "sub_pos_lc": "у ребёнка",
                "sub_loc": "У ребёнка",
                "sub_loc_lc": "ребёнка",
                "sub_term": "вашего ребёнка",
                "sub_term_cap": "Вашего ребёнка",
                "sub_to": "ребёнку",
                "v_suffix": "употребляйте",
                "v_keep": "продолжайте",
            },
            "adult": {
                "sub_pos": "У вас",
                "sub_pos_nom": "Вы",
                "sub_pos_lc": "у вас",
                "sub_loc": "У вас",
                "sub_loc_lc": "вас",
                "sub_term": "вашего",
                "sub_term_cap": "Вашего",
                "sub_to": "вам",
                "v_suffix": "употребляйте",
                "v_keep": "продолжайте",
            },
        },
        "en": {
            "child": {
                "sub_pos": "The child has",
                "sub_pos_nom": "The child",
                "sub_pos_lc": "the child has",
                "sub_loc": "The child's",
                "sub_loc_lc": "the child's",
                "sub_term": "your child's",
                "sub_term_cap": "Your child's",
                "sub_to": "the child",
                "v_suffix": "consume",
                "v_keep": "continue",
            },
            "adult": {
                "sub_pos": "You have",
                "sub_pos_nom": "You",
                "sub_pos_lc": "you have",
                "sub_loc": "Your",
                "sub_loc_lc": "your",
                "sub_term": "your own",
                "sub_term_cap": "Your own",
                "sub_to": "you",
                "v_suffix": "consume",
                "v_keep": "continue",
            },
        },
        "kz": {
            "child": {
                "sub_pos": "Балада",
                "sub_pos_nom": "Бала",
                "sub_pos_lc": "балада",
                "sub_loc": "Баланың",
                "sub_loc_lc": "баланың",
                "sub_term": "балаңыздың",
                "sub_term_cap": "Балаңыздың",
                "sub_to": "балаға",
                "v_suffix": "қолданыңыз",
                "v_keep": "жалғастырыңыз",
            },
            "adult": {
                "sub_pos": "Сізде",
                "sub_pos_nom": "Сіз",
                "sub_pos_lc": "сізде",
                "sub_loc": "Сіздің",
                "sub_loc_lc": "сіздің",
                "sub_term": "өзіңіздің",
                "sub_term_cap": "Өзіңіздің",
                "sub_to": "сізге",
                "v_suffix": "қолданыңыз",
                "v_keep": "жалғастырыңыз",
            },
        },
        "tm": {
            "child": {
                "sub_pos": "Cagada",
                "sub_pos_nom": "Caga",
                "sub_pos_lc": "cagada",
                "sub_loc": "Caganyn",
                "sub_loc_lc": "caganyn",
                "sub_term": "caganyzyn",
                "sub_term_cap": "Caganyzyn",
                "sub_to": "caga",
                "v_suffix": "berin",
                "v_keep": "dowam edin",
            },
            "adult": {
                "sub_pos": "Sizde",
                "sub_pos_nom": "Siz",
                "sub_pos_lc": "sizde",
                "sub_loc": "Sizinin",
                "sub_loc_lc": "sizinin",
                "sub_term": "ozunizinin",
                "sub_term_cap": "Ozunizinin",
                "sub_to": "size",
                "v_suffix": "ullanyn",
                "v_keep": "dowam edin",
            },
        },
        "tr": {
            "child": {
                "sub_pos": "Cocukta",
                "sub_pos_nom": "Cocuk",
                "sub_pos_lc": "cocukta",
                "sub_loc": "Cocugun",
                "sub_loc_lc": "cocugun",
                "sub_term": "cocugunuzun",
                "sub_term_cap": "Cocugunuzun",
                "sub_to": "cocuga",
                "v_suffix": "verin",
                "v_keep": "devam edin",
            },
            "adult": {
                "sub_pos": "Sizde",
                "sub_pos_nom": "Siz",
                "sub_pos_lc": "sizde",
                "sub_loc": "Sizin",
                "sub_loc_lc": "sizin",
                "sub_term": "kendinizin",
                "sub_term_cap": "Kendinizin",
                "sub_to": "size",
                "v_suffix": "tuketin",
                "v_keep": "devam edin",
            },
        },
        "ky": {
            "child": {
                "sub_pos": "Балада",
                "sub_pos_nom": "Бала",
                "sub_pos_lc": "балада",
                "sub_loc": "Баланын",
                "sub_loc_lc": "баланын",
                "sub_term": "балаңыздын",
                "sub_term_cap": "Балаңыздын",
                "sub_to": "балага",
                "v_suffix": "бериңиз",
                "v_keep": "улантыңыз",
            },
            "adult": {
                "sub_pos": "Сизде",
                "sub_pos_nom": "Сиз",
                "sub_pos_lc": "сизде",
                "sub_loc": "Сиздин",
                "sub_loc_lc": "сиздин",
                "sub_term": "өзүңүздүн",
                "sub_term_cap": "Өзүңүздүн",
                "sub_to": "сизге",
                "v_suffix": "колдонуңуз",
                "v_keep": "улантыңыз",
            },
        },
        "tg": {
            "child": {
                "sub_pos": "Дар кӯдак",
                "sub_pos_nom": "Кӯдак",
                "sub_pos_lc": "дар кӯдак",
                "sub_loc": "Кӯдак",
                "sub_loc_lc": "кӯдак",
                "sub_term": "кӯдаки шумо",
                "sub_term_cap": "Кӯдаки шумо",
                "sub_to": "ба кӯдак",
                "v_suffix": "диҳед",
                "v_keep": "идома диҳед",
            },
            "adult": {
                "sub_pos": "Дар шумо",
                "sub_pos_nom": "Шумо",
                "sub_pos_lc": "дар шумо",
                "sub_loc": "Шумо",
                "sub_loc_lc": "шумо",
                "sub_term": "худатон",
                "sub_term_cap": "Худатон",
                "sub_to": "ба шумо",
                "v_suffix": "истеъмол кунед",
                "v_keep": "идома диҳед",
            },
        },
    }

    addr_lang = _ADDR.get(lang, _ADDR["uz"])
    addr = addr_lang["adult"] if is_adult else addr_lang["child"]
    fmt = dict(addr)

    # 1. Ideal ko'rsatkichlar
    ideal_h = get_ideal_height_by_age_and_gender(age, gender_norm)
    if age <= 21:
        if is_male:
            boys_weights = {
                2: 12.0,
                3: 14.3,
                4: 16.3,
                5: 18.3,
                6: 20.5,
                7: 22.9,
                8: 25.6,
                9: 28.5,
                10: 31.9,
                11: 35.6,
                12: 39.9,
                13: 45.3,
                14: 50.8,
                15: 56.5,
                16: 61.5,
                17: 66.0,
                18: 70.3,
                19: 72.0,
                20: 74.0,
                21: 75.0,
            }
            ideal_w = boys_weights.get(age, 70.0)
        else:
            girls_weights = {
                2: 11.5,
                3: 13.9,
                4: 15.7,
                5: 17.6,
                6: 19.7,
                7: 22.0,
                8: 24.5,
                9: 27.2,
                10: 30.1,
                11: 33.4,
                12: 37.0,
                13: 41.1,
                14: 45.3,
                15: 49.1,
                16: 52.1,
                17: 54.4,
                18: 56.0,
                19: 57.0,
                20: 58.0,
                21: 59.0,
            }
            ideal_w = girls_weights.get(age, 55.0)
    else:
        target_bmi = 22.0 if is_male else 21.0
        ideal_w = target_bmi * ((height / 100) ** 2)

    ideal_bmi = ideal_w / ((ideal_h / 100) ** 2)

    # 2. Body Composition
    if m.get("total_body_water") is not None:
        tbw = float(m["total_body_water"])
    else:
        if is_male:
            if height > 132.7:
                tbw = -21.993 + (0.406 * weight) + (0.209 * height)
            else:
                tbw = -1.927 + (0.465 * weight) + (0.045 * height)
        else:
            if height > 110.8:
                tbw = -10.313 + (0.252 * weight) + (0.154 * height)
            else:
                tbw = 0.076 + (0.507 * weight) + (0.013 * height)

    ideal_tbw = 0.61 * ideal_w if is_male else 0.58 * ideal_w
    ffm = tbw / 0.732

    if m.get("fat_mass") is not None:
        fm = float(m["fat_mass"])
    else:
        fm = max(0, weight - ffm)

    ffm_percent = (ffm / weight) * 100 if weight > 0 else 0

    if m.get("fat_percent") is not None:
        fm_percent = float(m["fat_percent"])
    else:
        fm_percent = (fm / weight) * 100 if weight > 0 else 0

    if m.get("muscle_mass") is not None:
        muscle_mass = float(m["muscle_mass"])
    else:
        muscle_mass = ffm * 0.8

    if m.get("bone_mass") is not None:
        bone_mass = float(m["bone_mass"])
    else:
        bone_mass = ffm * 0.15

    low_fm, high_fm = get_fm_percent_norm(age, gender_norm)
    normal_fm = (low_fm + high_fm) / 2.0
    fm_norm_str = f"{low_fm}-{high_fm}%"
    fm_kg_low = round(weight * (low_fm / 100), 1)
    fm_kg_high = round(weight * (high_fm / 100), 1)
    fm_kg_norm_str = f"{fm_kg_low}-{fm_kg_high} {_t('kg', lang)}"
    fm_norm = fm_norm_str

    if m.get("acm") is not None:
        acm = float(m["acm"])
    else:
        base_acm_ratio = 0.52 + (min(age, 20) * 0.003) + (0.01 if is_male else 0.0)
        fat_adj_acm = (normal_fm - fm_percent) * 0.003
        acm_ratio = max(0.48, min(0.62, base_acm_ratio + fat_adj_acm))
        acm = tbw * acm_ratio

    if m.get("visceral_fat") is not None:
        visceral_fat = float(m["visceral_fat"])
    else:
        base_vf = 1.0 if age < 10 else (1.5 if age <= 15 else (2.0 if age <= 20 else 3.0))
        age_adj_vf = max(0, age - 5) * 0.08
        fat_adj_vf = (fm_percent - normal_fm) / 3.5
        visceral_fat = round(max(1.0, min(15.0, base_vf + age_adj_vf + fat_adj_vf)), 1)

    tbw_min, tbw_max = get_tbw_percent_norm(age, gender_norm)
    tbw_norm_str = f"{int(tbw_min)}-{int(tbw_max)}%"

    muscle_min, muscle_max = get_muscle_percent_norm(age, gender_norm)
    muscle_kg_low = round(weight * (muscle_min / 100), 1)
    muscle_kg_high = round(weight * (muscle_max / 100), 1)
    muscle_norm_str = f"{muscle_kg_low}-{muscle_kg_high} {_t('kg', lang)}"

    bone_min, bone_max = get_bone_percent_norm(age)
    bone_kg_low = round(weight * (bone_min / 100), 1)
    bone_kg_high = round(weight * (bone_max / 100), 1)
    bone_norm = f"{bone_kg_low}-{bone_kg_high} {_t('kg', lang)}"

    acm_norm = "50-60%"
    visceral_min, visceral_max = get_visceral_norm(age)
    visceral_norm = f"{visceral_min}-{visceral_max}"

    # 4. Z-scores (WHO Standards Approximation)
    if age < 5:
        sd_h = 3.5 + (age * 0.3)
        sd_w = ideal_w * 0.12 if ideal_w > 0 else 1.0
        sd_bmi = 1.2
    elif age < 12:
        sd_h = 5.0 + ((age - 5) * 0.4)
        sd_w = ideal_w * 0.14 if ideal_w > 0 else 1.2
        sd_bmi = 1.4
    else:
        sd_h = 7.0 + ((age - 12) * 0.2)
        sd_w = ideal_w * 0.16 if ideal_w > 0 else 1.5
        sd_bmi = 1.8

    sd_tbw = ideal_tbw * 0.12 if ideal_tbw > 0 else 1.0

    z_h = round((height - ideal_h) / sd_h, 2) if sd_h > 0 else 0

    body_length = m.get("body_length")
    z_body_length = None
    if body_length:
        # Interpolating body trunk length standard deviation proportionally from height
        ideal_body_len = ideal_h * 0.45  # approximation of trunk ratio
        sd_body_len = sd_h * 0.45
        z_body_length = (
            round((float(body_length) - ideal_body_len) / sd_body_len, 2)
            if sd_body_len > 0
            else 0
        )

    z_w = round((weight - ideal_w) / sd_w, 2) if sd_w > 0 else 0
    z_bmi = round((bmi - ideal_bmi) / sd_bmi, 2) if sd_bmi > 0 else 0
    z_tbw = round((tbw - ideal_tbw) / sd_tbw, 2) if sd_tbw > 0 else 0

    # 4.1 FM_z, MM_z and MCRI calculation
    median_fm_p = (low_fm + high_fm) / 2
    sd_fm_p = (high_fm - low_fm) / 4 if (high_fm - low_fm) > 0 else 1.0
    fm_z = round((fm_percent - median_fm_p) / sd_fm_p, 2)

    median_mm_p = (muscle_min + muscle_max) / 2
    sd_mm_p = (muscle_max - muscle_min) / 4 if (muscle_max - muscle_min) > 0 else 1.0
    muscle_p = (muscle_mass / weight) * 100 if weight > 0 else 0
    mm_z = round((muscle_p - median_mm_p) / sd_mm_p, 2)

    mcri = round((z_bmi + fm_z - mm_z) / 3, 2)

    # 4.2 Z_chest calculation for MII
    chest_val = float(m.get("chest") or 0)
    if chest_val > 0 and ideal_h > 0:
        ideal_chest = ideal_h * 0.5
        sd_chest = ideal_chest * 0.1
        z_chest = round((chest_val - ideal_chest) / sd_chest, 2)
    else:
        z_chest = 0

    # 5. Centile and Corridor (WHO based on BMI Z-score)
    centile = get_centile_from_z(z_bmi)
    corridor = get_corridor_from_z(z_bmi, lang)

    # 6. Main Indices

    # HMAI (Hududiy Morfologik Adaptatsiya Indeksi)
    e_factor = get_ecological_factor(m)
    if fm_percent > 0 and bmi > 0:
        hmai = round((muscle_p / (fm_percent * bmi)) * e_factor, 3)
    else:
        hmai = 0.0

    # MII (Morfologik Integratsiya Indeksi) Individual Concordance variant
    sim_h_w = math.exp(-abs(z_h - z_w))
    sim_w_c = math.exp(-abs(z_w - z_chest))
    sim_bmi_fm = math.exp(-abs(z_bmi - fm_z))
    mii = round((sim_h_w + sim_w_c + sim_bmi_fm) / 3, 2)

    adi = round(abs(z_h) + abs(z_w) + abs(z_bmi), 2)

    # Interpretation — 4 tilda
    if 0.1 <= hmai <= 0.3:
        hmai_desc = _local_t("hmai_optimal", lang)
    elif hmai > 0.3:
        hmai_desc = _local_t("hmai_accel", lang)
    else:
        hmai_desc = _local_t("hmai_stress", lang)

    if mii >= 0.8:
        mii_desc = _local_t("mii_high", lang)
    elif mii >= 0.5:
        mii_desc = _local_t("mii_normal", lang)
    else:
        mii_desc = _local_t("mii_low", lang)

    if adi <= 1:
        adi_desc = _local_t("adi_harmony", lang)
    elif 1 < adi <= 2:
        adi_desc = _local_t("adi_mid", lang)
    else:
        adi_desc = _local_t("adi_high", lang)

    if mcri < 0.5:
        mcri_desc = _local_t("mcri_optimal", lang)
    elif mcri <= 1.5:
        mcri_desc = _local_t("mcri_moderate", lang)
    else:
        mcri_desc = _local_t("mcri_high", lang)

    # 6. Morphological Type
    if z_bmi < -1.5 or (z_h > 1.0 and z_bmi < -0.5):
        morph_type_key = "astenik"
    elif z_bmi > 1.5 or (z_h < -0.5 and z_bmi > 1.0):
        morph_type_key = "giperstenik"
    else:
        morph_type_key = "normostenik"

    morphological_type = _local_t(morph_type_key, lang)

    if -1.0 <= z_h <= 1.0:
        bio_age_key = "mos"
    else:
        bio_age_key = "mos_emas"

    biological_age_status = _local_t(bio_age_key, lang)

    secular_trend_key = "mavjud" if z_h > 1.0 else "yo'q"
    secular_trend = _local_t(secular_trend_key, lang)

    # 7. Personalized Advice — 4 tilda
    advice = []

    if z_body_length is not None:
        if z_body_length > 2.0:
            advice.append(_local_t("adv_body_len_high", lang, **fmt))
        elif z_body_length < -2.0:
            advice.append(_local_t("adv_body_len_low", lang, **fmt))
        elif -1.0 <= z_body_length <= 1.0:
            advice.append(_local_t("adv_body_len_ok", lang, **fmt))

    # HMAI
    if hmai > 0.5:
        advice.append(_local_t("adv_hmai_very_high", lang, **fmt))
    elif hmai > 0.3:
        advice.append(_local_t("adv_hmai_high", lang, **fmt))
    elif hmai < 0.05:
        advice.append(_local_t("adv_hmai_very_low", lang, **fmt))
    elif hmai < 0.1:
        advice.append(_local_t("adv_hmai_low", lang, **fmt))
    else:
        advice.append(_local_t("adv_hmai_ok", lang, **fmt))

    # MII
    if mii < 0.3:
        advice.append(_local_t("adv_mii_very_low", lang, **fmt))
    elif mii < 0.5:
        advice.append(_local_t("adv_mii_low", lang, **fmt))
    elif mii >= 0.8:
        advice.append(_local_t("adv_mii_high", lang, **fmt))

    # ADI and MCRI
    if adi > 3.0:
        advice.append(_local_t("adv_adi_very_high", lang, **fmt))
    elif adi > 2.0:
        advice.append(_local_t("adv_adi_high", lang, **fmt))
    elif adi <= 1.0:
        advice.append(_local_t("adv_adi_ok", lang, **fmt))

    if mcri > 1.5:
        advice.append(_local_t("adv_mcri_high", lang, **fmt))

    # BMI
    if z_bmi < -2.0:
        advice.append(_local_t("adv_bmi_very_low", lang, **fmt))
    elif z_bmi < -1.0:
        advice.append(_local_t("adv_bmi_low", lang, **fmt))
    elif z_bmi > 2.0:
        advice.append(_local_t("adv_bmi_very_high", lang, **fmt))
    elif z_bmi > 1.0:
        advice.append(_local_t("adv_bmi_high", lang, **fmt))

    # Somatotype
    if morph_type_key == "astenik":
        advice.append(_local_t("adv_soma_astenik", lang, **fmt))
    elif morph_type_key == "giperstenik":
        advice.append(_local_t("adv_soma_giper", lang, **fmt))
    else:
        advice.append(_local_t("adv_soma_normo", lang, **fmt))

    # Bioimpedance
    fm_p = (fm / weight) * 100 if weight > 0 else 0
    if fm_p > high_fm:
        advice.append(_local_t("adv_fat_high", lang, **fmt))
    elif fm_p < low_fm:
        advice.append(_local_t("adv_fat_low", lang, **fmt))

    m_p = (muscle_mass / weight) * 100 if weight > 0 else 0
    if m_p < muscle_min:
        advice.append(_local_t("adv_muscle_low", lang, **fmt))

    tbw_p = (tbw / weight) * 100 if weight > 0 else 0
    if tbw_p < tbw_min:
        advice.append(_local_t("adv_water_low", lang, **fmt))

    if visceral_fat > visceral_max:
        advice.append(_local_t("adv_visceral_high", lang, **fmt))

    return {
        "z_h": z_h,
        "z_w": z_w,
        "z_bmi": z_bmi,
        "z_tbw": z_tbw,
        "z_body_length": z_body_length,
        "body_length": body_length,
        "tbw": round(tbw, 1),
        "tbw_percent": round((tbw / weight) * 100, 1) if weight > 0 else 0,
        "tbw_norm": tbw_norm_str,
        "ffm": round(ffm, 1),
        "fm": round(fm, 1),
        "fm_percent": round(fm_percent, 1),
        "fm_norm": fm_norm,
        "fm_kg_norm": fm_kg_norm_str,
        "muscle_mass": round(muscle_mass, 1),
        "muscle_norm": muscle_norm_str,
        "bone_mass": round(bone_mass, 1),
        "bone_norm": bone_norm,
        "acm": round(acm, 1),
        "acm_percent": round((acm / tbw) * 100, 1) if tbw > 0 else 0,
        "acm_norm": acm_norm,
        "visceral_fat": visceral_fat,
        "visceral_norm": visceral_norm,
        "centile": centile,
        "corridor": corridor,
        "hmai": hmai,
        "hmai_desc": hmai_desc,
        "mii": mii,
        "mii_desc": mii_desc,
        "adi": adi,
        "adi_desc": adi_desc,
        "mcri": mcri,
        "mcri_desc": mcri_desc,
        "morphological_type": morphological_type,
        "morphological_type_key": morph_type_key,
        "biological_age_status": biological_age_status,
        "biological_age_status_key": bio_age_key,
        "secular_trend": secular_trend,
        "secular_trend_key": secular_trend_key,
        "advice": advice,
    }
