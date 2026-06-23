const copy = {
  uz: {
    intelligence: 'KLINIK TAFAKKUR',
    eyebrow: "HAR BIR O'LCHOVDA ANIQLIK",
    headline: "Butun manzarani ko'rsatadigan ma'lumotlar.",
    description:
      'Antropometrik tahlil, ilmiy aniqlik va xavfsiz boshqaruv — yagona muhitda.',
    science: 'Ilm-fan',
    analytics: 'Tahlil',
    secure: 'Xavfsiz',
    protected: 'Himoyalangan va shifrlangan kirish',
    verification: 'Tasdiqlash kodi',
    showPassword: "Parolni ko'rsatish",
  },
  ru: {
    intelligence: 'КЛИНИЧЕСКАЯ АНАЛИТИКА',
    eyebrow: 'ТОЧНОСТЬ В КАЖДОМ ИЗМЕРЕНИИ',
    headline: 'Данные, которые показывают полную картину.',
    description:
      'Антропометрический анализ, научная точность и безопасное управление — в единой среде.',
    science: 'Наука',
    analytics: 'Аналитика',
    secure: 'Защита',
    protected: 'Защищённый и зашифрованный вход',
    verification: 'Код подтверждения',
    showPassword: 'Показать пароль',
  },
  en: {
    intelligence: 'CLINICAL INTELLIGENCE',
    eyebrow: 'PRECISION IN EVERY MEASURE',
    headline: 'Data that sees the whole picture.',
    description:
      'Anthropometric analysis, scientific precision and secure management — in one environment.',
    science: 'Science',
    analytics: 'Analytics',
    secure: 'Secure',
    protected: 'Protected and encrypted sign-in',
    verification: 'Verification code',
    showPassword: 'Show password',
  },
  kz: {
    intelligence: 'КЛИНИКАЛЫҚ ТАЛДАУ',
    eyebrow: 'ӘР ӨЛШЕМДЕГІ ДӘЛДІК',
    headline: 'Толық көріністі көрсететін деректер.',
    description:
      'Антропометриялық талдау, ғылыми дәлдік және қауіпсіз басқару — бір ортада.',
    science: 'Ғылым',
    analytics: 'Талдау',
    secure: 'Қауіпсіз',
    protected: 'Қорғалған және шифрланған кіру',
    verification: 'Растау коды',
    showPassword: 'Құпиясөзді көрсету',
  },
  ky: {
    intelligence: 'КЛИНИКАЛЫК ТАЛДОО',
    eyebrow: 'АР БИР ӨЛЧӨМДӨГҮ ТАКТЫК',
    headline: 'Толук көрүнүштү көрсөткөн маалыматтар.',
    description:
      'Антропометриялык талдоо, илимий тактык жана коопсуз башкаруу — бир чөйрөдө.',
    science: 'Илим',
    analytics: 'Талдоо',
    secure: 'Коопсуз',
    protected: 'Корголгон жана шифрленген кирүү',
    verification: 'Ырастоо коду',
    showPassword: 'Сырсөздү көрсөтүү',
  },
  tg: {
    intelligence: 'ТАҲЛИЛИ КЛИНИКӢ',
    eyebrow: 'ДАҚИҚӢ ДАР ҲАР ЯК ЧЕНАК',
    headline: 'Маълумоте, ки манзараи пурраро нишон медиҳад.',
    description:
      'Таҳлили антропометрӣ, дақиқии илмӣ ва идоракунии бехатар — дар як муҳит.',
    science: 'Илм',
    analytics: 'Таҳлил',
    secure: 'Бехатар',
    protected: 'Вуруди ҳифзшуда ва рамзгузоришуда',
    verification: 'Рамзи тасдиқ',
    showPassword: 'Нишон додани парол',
  },
  tm: {
    intelligence: 'KLINIKI SELJERME',
    eyebrow: 'HER ÖLÇEGDE TAKYKLYK',
    headline: 'Doly görnüşi görkezýän maglumatlar.',
    description:
      'Antropometrik seljerme, ylmy takyklyk we howpsuz dolandyryş — bir gurşawda.',
    science: 'Ylym',
    analytics: 'Seljerme',
    secure: 'Howpsuz',
    protected: 'Goralan we şifrlenen giriş',
    verification: 'Tassyklama kody',
    showPassword: 'Paroly görkez',
  },
  tr: {
    intelligence: 'KLİNİK ZEKÂ',
    eyebrow: 'HER ÖLÇÜMDE HASSASİYET',
    headline: 'Bütün resmi gösteren veriler.',
    description:
      'Antropometrik analiz, bilimsel hassasiyet ve güvenli yönetim — tek bir ortamda.',
    science: 'Bilim',
    analytics: 'Analiz',
    secure: 'Güvenli',
    protected: 'Korumalı ve şifreli giriş',
    verification: 'Doğrulama kodu',
    showPassword: 'Şifreyi göster',
  },
};

export const getLoginExperienceCopy = (lang) =>
  copy[
    String(lang || 'en')
      .toLowerCase()
      .split(/[-_]/)[0]
  ] || copy.en;
