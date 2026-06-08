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

export const getLocalizedLocationLabel = (value, lang, level = 1) => {
  if (!value) return "-";
  const key = normalizeLocationKey(value);

  if (lang === "ru") return REGION_LABELS_RU[key] || displayLocationName(value);

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
