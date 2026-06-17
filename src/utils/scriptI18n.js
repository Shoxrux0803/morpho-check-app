const CYRILLIC_LANGS = new Set(['ru', 'kz', 'ky', 'tg']);
const LATIN_LANGS = new Set(['uz', 'en', 'tm', 'tr']);

const LATIN_MULTI = [
  ['shch', 'щ'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['ye', 'е'],
  ['ts', 'ц'],
  ["o'", 'ў'],
  ['o`', 'ў'],
  ['oʻ', 'ў'],
  ['o‘', 'ў'],
  ['o’', 'ў'],
  ['oʼ', 'ў'],
  ["g'", 'ғ'],
  ['g`', 'ғ'],
  ['gʻ', 'ғ'],
  ['g‘', 'ғ'],
  ['g’', 'ғ'],
  ['gʼ', 'ғ'],
];

const LATIN_SINGLE = {
  a: 'а',
  b: 'б',
  c: 'ц',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'ҳ',
  i: 'и',
  j: 'ж',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'қ',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'х',
  y: 'й',
  z: 'з',
};

const CYR_MULTI = {
  щ: 'shch',
  ш: 'sh',
  ч: 'ch',
  ё: 'yo',
  ю: 'yu',
  я: 'ya',
  ц: 'ts',
  ў: "o'",
  ғ: "g'",
  қ: 'q',
  ҳ: 'h',
  ҷ: 'j',
  ӯ: "o'",
};

const CYR_SINGLE = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ъ: "'",
  э: 'e',
  ы: 'i',
  ь: '',
  ә: 'a',
  і: 'i',
  ң: 'ng',
  ө: 'o',
  ү: 'u',
  ұ: 'u',
  һ: 'h',
  ї: 'i',
};

const SKIP_KEYS = new Set([
  'id',
  'idCode',
  'created_by_email',
  'email',
  'parentsPhone',
  'parents_phone',
  'date',
  'created_at',
  'birth_date',
  'examination_date',
]);

const matchCase = (source, target) => {
  if (!source) return target;
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
};

export const latinToCyrillic = (value) => {
  const text = String(value ?? '');
  let result = '';
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index);
    const found = LATIN_MULTI.find(([latin]) =>
      chunk.toLowerCase().startsWith(latin)
    );
    if (found) {
      const [latin, cyrillic] = found;
      result += matchCase(chunk.slice(0, latin.length), cyrillic);
      index += latin.length;
      continue;
    }

    const char = text[index];
    const mapped = LATIN_SINGLE[char.toLowerCase()];
    result += mapped ? matchCase(char, mapped) : char;
    index += 1;
  }
  return result;
};

export const cyrillicToLatin = (value) =>
  String(value ?? '')
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = CYR_MULTI[lower] || CYR_SINGLE[lower];
      return mapped ? matchCase(char, mapped) : char;
    })
    .join('');

const shouldSkipScriptNormalization = (key, value) => {
  const text = String(value ?? '');
  if (!text || text === '-') return true;
  if (SKIP_KEYS.has(key)) return true;
  if (/@/.test(text)) return true;
  if (/^[\d\s.,:+\-/#()]+$/.test(text)) return true;
  return false;
};

export const normalizePreviewScript = (key, value, lang) => {
  if (shouldSkipScriptNormalization(key, value)) return value;
  const text = String(value);
  if (CYRILLIC_LANGS.has(lang)) return latinToCyrillic(text);
  if (LATIN_LANGS.has(lang)) return cyrillicToLatin(text);
  return value;
};
