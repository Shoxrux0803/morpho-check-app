const normalizeLocationKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const displayLocationName = (value = "") => {
  const text = String(value || "");
  return normalizeLocationKey(text).replace(/\bsergeli\b/g, "sirgali") === "sirgali"
    ? "Sergeli tumani"
    : text;
};

const stripUzSuffix = (value = "") =>
  displayLocationName(value)
    .replace(/\s+(respublikasi|viloyati|tumani|shahri|mahallasi)$/i, "")
    .trim();

const transliterateUzToAscii = (value = "") =>
  stripUzSuffix(value)
    .replace(/[‘’`]/g, "'")
    .replace(/g'/gi, (match) => (match[0] === "G" ? "Gh" : "gh"))
    .replace(/o'/gi, (match) => (match[0] === "O" ? "O" : "o"))
    .replace(/Q/g, "K")
    .replace(/q/g, "k")
    .replace(/X/g, "Kh")
    .replace(/x/g, "kh");

const REGION_LABELS_RU = {
  "toshkent shahri": "г. Ташкент",
  toshkent: "Ташкентская область",
  "toshkent viloyati": "Ташкентская область",
  qoraqalpogiston: "Республика Каракалпакстан",
  "qoraqalpog'iston": "Республика Каракалпакстан",
  "qoraqalpog'iston respublikasi": "Республика Каракалпакстан",
  andijon: "Андижанская область",
  "andijon viloyati": "Андижанская область",
  buxoro: "Бухарская область",
  "buxoro viloyati": "Бухарская область",
  fargona: "Ферганская область",
  "farg'ona": "Ферганская область",
  "farg'ona viloyati": "Ферганская область",
  jizzax: "Джизакская область",
  "jizzax viloyati": "Джизакская область",
  xorazm: "Хорезмская область",
  "xorazm viloyati": "Хорезмская область",
  namangan: "Наманганская область",
  "namangan viloyati": "Наманганская область",
  navoiy: "Навоийская область",
  "navoiy viloyati": "Навоийская область",
  qashqadaryo: "Кашкадарьинская область",
  "qashqadaryo viloyati": "Кашкадарьинская область",
  samarqand: "Самаркандская область",
  "samarqand viloyati": "Самаркандская область",
  sirdaryo: "Сырдарьинская область",
  "sirdaryo viloyati": "Сырдарьинская область",
  surxondaryo: "Сурхандарьинская область",
  "surxondaryo viloyati": "Сурхандарьинская область",
};

const REGION_LABELS_TM = {
  "toshkent shahri": "Toshkent saheri",
  toshkent: "Toshkent welayaty",
  "toshkent viloyati": "Toshkent welayaty",
  qoraqalpogiston: "Garagalpagystan Respublikasy",
  "qoraqalpog'iston": "Garagalpagystan Respublikasy",
  "qoraqalpog'iston respublikasi": "Garagalpagystan Respublikasy",
  andijon: "Andijan welayaty",
  "andijon viloyati": "Andijan welayaty",
  buxoro: "Buhara welayaty",
  "buxoro viloyati": "Buhara welayaty",
  fargona: "Fergana welayaty",
  "farg'ona": "Fergana welayaty",
  "farg'ona viloyati": "Fergana welayaty",
  jizzax: "Jizzah welayaty",
  "jizzax viloyati": "Jizzah welayaty",
  xorazm: "Horezm welayaty",
  "xorazm viloyati": "Horezm welayaty",
  namangan: "Namangan welayaty",
  "namangan viloyati": "Namangan welayaty",
  navoiy: "Nowayi welayaty",
  "navoiy viloyati": "Nowayi welayaty",
  qashqadaryo: "Gashgaderya welayaty",
  "qashqadaryo viloyati": "Gashgaderya welayaty",
  samarqand: "Samarkand welayaty",
  "samarqand viloyati": "Samarkand welayaty",
  sirdaryo: "Syrderya welayaty",
  "sirdaryo viloyati": "Syrderya welayaty",
  surxondaryo: "Surhanderya welayaty",
  "surxondaryo viloyati": "Surhanderya welayaty",
};

const REGION_LABELS_TG = {
  "toshkent shahri": "шаҳри Тошканд",
  toshkent: "вилояти Тошканд",
  "toshkent viloyati": "вилояти Тошканд",
  qoraqalpogiston: "Ҷумҳурии Қарақалпоғистон",
  "qoraqalpog'iston": "Ҷумҳурии Қарақалпоғистон",
  "qoraqalpog'iston respublikasi": "Ҷумҳурии Қарақалпоғистон",
  andijon: "вилояти Андиҷон",
  "andijon viloyati": "вилояти Андиҷон",
  buxoro: "вилояти Бухоро",
  "buxoro viloyati": "вилояти Бухоро",
  fargona: "вилояти Фарғона",
  "farg'ona": "вилояти Фарғона",
  "farg'ona viloyati": "вилояти Фарғона",
  jizzax: "вилояти Ҷиззах",
  "jizzax viloyati": "вилояти Ҷиззах",
  xorazm: "вилояти Хоразм",
  "xorazm viloyati": "вилояти Хоразм",
  namangan: "вилояти Наманган",
  "namangan viloyati": "вилояти Наманган",
  navoiy: "вилояти Навоӣ",
  "navoiy viloyati": "вилояти Навоӣ",
  qashqadaryo: "вилояти Қашқадарё",
  "qashqadaryo viloyati": "вилояти Қашқадарё",
  samarqand: "вилояти Самарқанд",
  "samarqand viloyati": "вилояти Самарқанд",
  sirdaryo: "вилояти Сирдарё",
  "sirdaryo viloyati": "вилояти Сирдарё",
  surxondaryo: "вилояти Сурхондарё",
  "surxondaryo viloyati": "вилояти Сурхондарё",
};

const REGION_LABELS_KZ = {
  "toshkent shahri": "Ташкент қаласы",
  toshkent: "Ташкент облысы",
  "toshkent viloyati": "Ташкент облысы",
  qoraqalpogiston: "Қарақалпақстан Республикасы",
  "qoraqalpog'iston": "Қарақалпақстан Республикасы",
  "qoraqalpog'iston respublikasi": "Қарақалпақстан Республикасы",
  andijon: "Әндіжан облысы",
  "andijon viloyati": "Әндіжан облысы",
  buxoro: "Бұхара облысы",
  "buxoro viloyati": "Бұхара облысы",
  fargona: "Ферғана облысы",
  "farg'ona": "Ферғана облысы",
  "farg'ona viloyati": "Ферғана облысы",
  jizzax: "Жызақ облысы",
  "jizzax viloyati": "Жызақ облысы",
  xorazm: "Хорезм облысы",
  "xorazm viloyati": "Хорезм облысы",
  namangan: "Наманган облысы",
  "namangan viloyati": "Наманган облысы",
  navoiy: "Науаи облысы",
  "navoiy viloyati": "Науаи облысы",
  qashqadaryo: "Қашқадарья облысы",
  "qashqadaryo viloyati": "Қашқадарья облысы",
  samarqand: "Самарқанд облысы",
  "samarqand viloyati": "Самарқанд облысы",
  sirdaryo: "Сырдарья облысы",
  "sirdaryo viloyati": "Сырдарья облысы",
  surxondaryo: "Сурхандарья облысы",
  "surxondaryo viloyati": "Сурхандарья облысы",
};

export const getLocalizedLocationLabel = (value, lang, level = 1) => {
  if (!value) return "-";
  const key = normalizeLocationKey(value);

  if (lang === "ru") return REGION_LABELS_RU[key] || displayLocationName(value);

  if (lang === "tm") {
    const clean = stripUzSuffix(value);
    const ascii = transliterateUzToAscii(value);
    if (REGION_LABELS_TM[key]) return REGION_LABELS_TM[key];
    if (key === "toshkent shahri" || /shahri$/i.test(value)) return `${ascii} saheri`;
    if (/respublikasi$/i.test(value)) return `${ascii} Respublikasy`;
    if (/viloyati$/i.test(value) || level === 1) return `${ascii} welayaty`;
    if (/tumani$/i.test(value) || level === 2) return `${ascii} etraby`;
    if (/mahallasi$/i.test(value) || level === 3) return `${clean} mahallasy`;
    return clean;
  }

  if (lang === "tg") {
    const clean = stripUzSuffix(value);
    const ascii = transliterateUzToAscii(value);
    if (REGION_LABELS_TG[key]) return REGION_LABELS_TG[key];
    if (key === "toshkent shahri" || /shahri$/i.test(value)) return `шаҳри ${ascii}`;
    if (/respublikasi$/i.test(value)) return `Ҷумҳурии ${ascii}`;
    if (/viloyati$/i.test(value) || level === 1) return `вилояти ${ascii}`;
    if (/tumani$/i.test(value) || level === 2) return `ноҳияи ${ascii}`;
    return clean;
  }

  if (lang === "en") {
    const clean = stripUzSuffix(value);
    const ascii = transliterateUzToAscii(value);
    if (key === "toshkent shahri" || /shahri$/i.test(value)) return `${ascii} city`;
    if (/respublikasi$/i.test(value)) return `Republic of ${ascii}`;
    if (/viloyati$/i.test(value) || level === 1) return `${ascii} region`;
    if (/tumani$/i.test(value) || level === 2) return `${ascii} district`;
    return clean;
  }

  if (lang === "kz") {
    const clean = stripUzSuffix(value);
    const ascii = transliterateUzToAscii(value);
    if (REGION_LABELS_KZ[key]) return REGION_LABELS_KZ[key];
    if (key === "toshkent shahri" || /shahri$/i.test(value)) return `${ascii} қаласы`;
    if (/respublikasi$/i.test(value)) return `${ascii} Республикасы`;
    if (/viloyati$/i.test(value) || level === 1) return `${ascii} облысы`;
    if (/tumani$/i.test(value) || level === 2) return `${ascii} ауданы`;
    if (/mahallasi$/i.test(value) || level === 3) return `${clean} махалласы`;
    return clean;
  }

  return displayLocationName(value);
};
