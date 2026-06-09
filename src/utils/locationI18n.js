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

  if (lang === "en") {
    const clean = stripUzSuffix(value);
    const ascii = transliterateUzToAscii(value);
    if (key === "toshkent shahri" || /shahri$/i.test(value)) return `${ascii} city`;
    if (/respublikasi$/i.test(value)) return `Republic of ${ascii}`;
    if (/viloyati$/i.test(value) || level === 1) return `${ascii} region`;
    if (/tumani$/i.test(value) || level === 2) return `${ascii} district`;
    return clean;
  }

  return displayLocationName(value);
};
