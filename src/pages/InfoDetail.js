// src/pages/InfoDetail.js
import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Dna,
  FileText,
  Gauge,
  HeartPulse,
  LineChart,
  Microscope,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../providers/ThemeProviderMUI';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/morphocheck-logo.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: 'easeOut' },
  }),
};

const zScoreBands = [
  { label: '< -3', color: '#dc2626', width: 14 },
  { label: '-3..-2', color: '#f97316', width: 14 },
  { label: '-2..+1', color: '#16a34a', width: 44 },
  { label: '+1..+2', color: '#f59e0b', width: 14 },
  { label: '> +2', color: '#dc2626', width: 14 },
];

const somatoTypes = [
  { label: 'Endomorf', value: 72, color: '#f97316' },
  { label: 'Mezomorf', value: 88, color: '#16a34a' },
  { label: 'Ektomorf', value: 54, color: '#0ea5e9' },
];

const indexCards = [
  {
    key: 'HMAI',
    title: 'Hududiy Morfologik Adaptatsiya Indeksi',
    subtitle: 'HMAI (мослашув)',
    icon: Gauge,
    color: '#0ea5e9',
    formula: 'HMAI = (MM% / FM%) x BMI x E',
    meaning:
      "Mushak va yog' komponentlari o'rtasidagi nisbatni BMI hamda hududiy ekologik koeffitsient bilan bog'lab, bolaning muhitga morfologik moslashuv darajasini ko'rsatadi.",
    deep: "Oddiy BMI tana tarkibini ajratmaydi. HMAI esa sog'lom mushak ustunligi, energetik zaxira va yashash muhiti ta'sirini bitta integrativ ko'rsatkichga jamlaydi. Urban, tog', cho'l yoki qishloq sharoitlarida bir xil BMI turlicha biologik ma'noga ega bo'lishi mumkin.",
    factors: [
      'MM% - mushak massasi',
      "FM% - yog' massasi",
      'BMI - tana massasi indeksi',
      'E - hududiy omil',
    ],
    zones: [
      'Past adaptatsiya',
      'Kompensatsiya',
      'Optimal moslashuv',
      'Sportiv fenotip',
    ],
  },
  {
    key: 'MII',
    title: 'Morfologik Integratsiya Indeksi',
    subtitle: 'MII (интеграция)',
    icon: Network,
    color: '#16a34a',
    formula: 'MII = (r(h,m) + r(m,CI) + r(BMI,FM%)) / 3',
    meaning:
      "Bo'y, vazn, ko'krak aylanasi, BMI va yog' foizi o'rtasidagi korrelyatsion uyg'unlikni baholab, organizmni yagona biologik tizim sifatida ko'rsatadi.",
    deep: "MII izolyatsiya qilingan raqamlar o'rniga tizimli uyg'unlikni o'lchaydi. Yuqori MII parametrlar bir-biriga mos rivojlanayotganini, past MII esa yashirin disbalans yoki rivojlanish sur'atlari nomutanosibligini ko'rsatishi mumkin.",
    factors: [
      "r(h,m) - bo'y/vazn",
      "r(m,CI) - vazn/ko'krak",
      'r(BMI,FM%) - indeks/tarkib',
    ],
    zones: [
      'Fragmentatsiya',
      "O'tish zonasi",
      "Uyg'un integratsiya",
      'Yuqori tizimlilik',
    ],
  },
  {
    key: 'ADI',
    title: 'Antropometrik Disgarmoniya Indeksi',
    subtitle: 'ADI (номутаносиблик)',
    icon: Target,
    color: '#f97316',
    formula: 'ADI = |Zh| + |Zw| + |ZBMI|',
    meaning:
      "Bo'y, vazn va BMI bo'yicha Z-score og'ishlarini birlashtirib, umumiy morfologik nomutanosiblik darajasini klinik skriningga qulay ko'rinishda beradi.",
    deep: "Z-score alohida o'qilganda klinik signal bo'laklarga ajralib ketadi. ADI esa og'ishlar yig'indisini ko'rsatadi: bir parametr ozgina, ikkinchisi sezilarli siljigan holatlarda umumiy riskni tezroq payqashga yordam beradi.",
    factors: ["Zh - bo'y Z-score", 'Zw - vazn Z-score', 'ZBMI - BMI Z-score'],
    zones: [
      'Normaga yaqin',
      'Yengil disbalans',
      "O'rta nomutanosiblik",
      'Kuchli disgarmoniya',
    ],
  },
  {
    key: 'MCRI',
    title: 'MorphoCheck Kompleks Risk Indeksi',
    subtitle: 'MCRI (Риск индекси)',
    icon: ShieldCheck,
    color: '#dc2626',
    formula: 'MCRI = (BMIz + FMz - MMz) / 3',
    meaning:
      "BMI, yog' massasi va mushak komponentini birgalikda hisoblab, adipostatik fenotip va metabolik xavfni erta bosqichda prognoz qilishga xizmat qiladi.",
    deep: "BMI yuqori bo'lishi har doim ham bir xil xavf degani emas: mushak massasi yuqori bolada klinik ma'no boshqacha, yog' massasi yuqori va mushak past bo'lsa risk kuchayadi. MCRI shu farqni raqamli qiladi.",
    factors: [
      'BMIz - BMI standarti',
      "FMz - yog' Z-score",
      'MMz - mushak Z-score',
    ],
    zones: ['Past risk', 'Kuzatuv', 'Profilaktika', 'Yuqori risk'],
  },
];

const clinicalLayers = [
  {
    icon: Activity,
    title: 'Z-Score standarti',
    value: 'WHO/BSST',
    color: '#0ea5e9',
  },
  {
    icon: Dna,
    title: 'Xit-Karter modeli',
    value: '3 komponent',
    color: '#16a34a',
  },
  {
    icon: BrainCircuit,
    title: 'AI talqin',
    value: 'Kontekstli',
    color: '#8b5cf6',
  },
  {
    icon: FileText,
    title: 'Hisobot',
    value: 'PDF/DOCX/XLSX',
    color: '#f97316',
  },
];

const infoCopy = {
  uz: {
    heroKicker: 'Ilmiy antropometriya, somatotip va raqamli risk tahlili',
    heroTitle: 'Morfofunksional tahlilning professional batafsil xaritasi',
    heroDesc:
      "Z-Score, Xit-Karter somatotipi, HMAI, MII, ADI va MCRI indekslari bitta konseptual modelga birlashadi: norma, uyg'unlik, moslashuv, nomutanosiblik va metabolik risk alohida emas, tizimli klinik profil sifatida baholanadi.",
    compositeOverline: 'Kompozit profil',
    compositeTitle: 'Indekslar paneli',
    zScoreTitle: 'Z-Score tahlili',
    zScoreDesc:
      'Z-score bolani faqat "normal" yoki "normal emas" deb ajratmaydi. U o\'sish trayektoriyasidagi aniq masofani ko\'rsatadi, shuning uchun skrining, dinamik monitoring va xavf guruhlarini ajratishda asosiy ilmiy o\'lchov bo\'lib xizmat qiladi.',
    zScoreNote:
      "Z-score bolaning o'lchovi yosh va jins bo'yicha referens populyatsiyadan nechta standart og'ish uzoqlashganini ko'rsatadi. MorphoCheck bo'y, vazn va BMI signalini birgalikda o'qib, ADI va MCRI uchun klinik asos yaratadi.",
    somatoTitle: 'Xit-Karter somatotipi',
    somatoDesc:
      "Somatotip endomorfiya, mezomorfiya va ektomorfiya nisbatini ko'rsatadi. MorphoCheck bu uch komponentni tana tarkibi va Z-score bilan solishtirib, fenotipning klinik izohini aniqroq qiladi.",
    authorOverline: 'Muallif indekslari',
    authorTitle:
      "HMAI, MII, ADI va MCRI bo'yicha chuqurlashtirilgan ilmiy blok",
    riskTitle: 'MorphoCheck Risk Score konsepsiyasi',
    riskDesc:
      "Platforma yakuniy talqinni bitta indeksga qamab qo'ymaydi. MCRI riskni oshiradi, ADI nomutanosiblikni kuchaytiradi, MII va HMAI esa uyg'unlik hamda adaptatsiya himoya omili sifatida qaraladi.",
    decisionTitle: 'Klinik qaror zanjiri',
    readyOverline: 'Tahlilga tayyor',
    readyTitle: 'Tahlilni amaliy natijaga aylantiring',
    readyDesc:
      "MorphoCheck Pro ilmiy formulalarni shifokor, tadqiqotchi va administrator uchun o'qilishi oson, eksport qilinadigan va kuzatib boriladigan raqamli hisobotga aylantiradi.",
    indexCards,
    clinicalLayers,
    somatoTypes,
    flowNodes: [
      { title: 'Antropometriya', desc: "bo'y, vazn, CI", color: '#0ea5e9' },
      { title: 'BIA tarkib', desc: 'FM%, MM%', color: '#16a34a' },
      { title: 'Muhit omili', desc: 'E, urban, altitude', color: '#8b5cf6' },
      { title: 'Indekslar', desc: 'HMAI, MII, ADI, MCRI', color: '#f97316' },
      { title: 'Xulosa', desc: 'profil, risk, tavsiya', color: '#dc2626' },
    ],
    riskFactors: [
      ['MCRI yuqori', 'risk ortadi', '#dc2626'],
      ['ADI yuqori', "disgarmoniya ko'payadi", '#f97316'],
      ['MII yuqori', "uyg'unlik himoya qiladi", '#16a34a'],
      ['HMAI yuqori', 'adaptatsiya kuchli', '#0ea5e9'],
    ],
    decisionSteps: [
      "O'lchovlar validatsiyasi va yosh-jins normasi bilan solishtirish",
      'Somatotip, tana tarkibi va Z-score kesishmasini aniqlash',
      'HMAI/MII/ADI/MCRI orqali adaptiv, strukturaviy va risk profilini chiqarish',
      "Skrining xulosasi, monitoring yo'nalishi va profilaktik tavsiyalarni shakllantirish",
    ],
  },
  ru: {
    heroKicker: 'Научная антропометрия, соматотип и цифровой анализ риска',
    heroTitle: 'Профессиональная подробная карта морфофункционального анализа',
    heroDesc:
      'Z-Score, соматотип Хит-Картера, индексы HMAI, MII, ADI и MCRI объединяются в единую концептуальную модель: норма, гармония, адаптация, дисбаланс и метаболический риск оцениваются как системный клинический профиль.',
    compositeOverline: 'Композитный профиль',
    compositeTitle: 'Панель индексов',
    zScoreTitle: 'Анализ Z-Score',
    zScoreDesc:
      'Z-score не просто делит ребенка на норму и отклонение. Он показывает точную дистанцию от траектории роста и служит научной основой для скрининга, динамического мониторинга и выделения групп риска.',
    zScoreNote:
      'Z-score показывает, на сколько стандартных отклонений показатель ребенка отличается от референсной популяции по возрасту и полу. MorphoCheck совместно читает сигналы роста, веса и BMI, формируя клиническую основу для ADI и MCRI.',
    somatoTitle: 'Соматотип Хит-Картера',
    somatoDesc:
      'Соматотип показывает соотношение эндоморфии, мезоморфии и эктоморфии. MorphoCheck сопоставляет эти три компонента с составом тела и Z-score, уточняя клиническую интерпретацию фенотипа.',
    authorOverline: 'Авторские индексы',
    authorTitle: 'Углубленный научный блок по HMAI, MII, ADI и MCRI',
    riskTitle: 'Концепция MorphoCheck Risk Score',
    riskDesc:
      'Платформа не сводит итоговую интерпретацию к одному индексу. MCRI усиливает риск, ADI отражает дисбаланс, а MII и HMAI рассматриваются как защитные факторы гармонии и адаптации.',
    decisionTitle: 'Цепочка клинического решения',
    readyOverline: 'Готово к анализу',
    readyTitle: 'Превратите анализ в практический результат',
    readyDesc:
      'MorphoCheck Pro превращает научные формулы в понятный, экспортируемый и отслеживаемый цифровой отчет для врача, исследователя и администратора.',
    indexCards: [
      {
        ...indexCards[0],
        title: 'Индекс региональной морфологической адаптации',
        subtitle: 'HMAI (адаптация)',
        meaning:
          'Связывает соотношение мышечного и жирового компонентов с BMI и региональным экологическим коэффициентом, показывая уровень морфологической адаптации ребенка к среде.',
        deep: 'Обычный BMI не разделяет состав тела. HMAI объединяет здоровое мышечное преимущество, энергетический резерв и влияние среды в один интегративный показатель.',
        factors: [
          'MM% - мышечная масса',
          'FM% - жировая масса',
          'BMI - индекс массы тела',
          'E - региональный фактор',
        ],
        zones: [
          'Низкая адаптация',
          'Компенсация',
          'Оптимальная адаптация',
          'Спортивный фенотип',
        ],
      },
      {
        ...indexCards[1],
        title: 'Индекс морфологической интеграции',
        subtitle: 'MII (интеграция)',
        meaning:
          'Оценивает корреляционную согласованность роста, веса, окружности груди, BMI и процента жира, показывая организм как единую биологическую систему.',
        deep: 'MII измеряет системную согласованность вместо изолированных чисел. Высокий MII указывает на согласованное развитие параметров, низкий MII может отражать скрытый дисбаланс.',
        factors: [
          'r(h,m) - рост/вес',
          'r(m,CI) - вес/грудь',
          'r(BMI,FM%) - индекс/состав',
        ],
        zones: [
          'Фрагментация',
          'Переходная зона',
          'Гармоничная интеграция',
          'Высокая системность',
        ],
      },
      {
        ...indexCards[2],
        title: 'Индекс антропометрической дисгармонии',
        subtitle: 'ADI (дисгармония)',
        meaning:
          'Объединяет отклонения Z-score по росту, весу и BMI, давая удобную для клинического скрининга оценку морфологической несогласованности.',
        deep: 'Когда Z-score читается отдельно, клинический сигнал дробится. ADI суммирует отклонения и помогает быстрее заметить общий риск.',
        factors: [
          'Zh - Z-score роста',
          'Zw - Z-score веса',
          'ZBMI - Z-score BMI',
        ],
        zones: [
          'Близко к норме',
          'Легкий дисбаланс',
          'Средняя дисгармония',
          'Сильная дисгармония',
        ],
      },
      {
        ...indexCards[3],
        title: 'Комплексный индекс риска MorphoCheck',
        subtitle: 'MCRI (индекс риска)',
        meaning:
          'Совместно учитывает BMI, жировую массу и мышечный компонент, помогая прогнозировать адипостатический фенотип и метаболический риск на раннем этапе.',
        deep: 'Высокий BMI не всегда означает одинаковый риск: при высокой мышечной массе клинический смысл один, при высокой жировой массе и низких мышцах риск усиливается.',
        factors: [
          'BMIz - стандарт BMI',
          'FMz - Z-score жира',
          'MMz - Z-score мышц',
        ],
        zones: ['Низкий риск', 'Наблюдение', 'Профилактика', 'Высокий риск'],
      },
    ],
    clinicalLayers: [
      {
        icon: Activity,
        title: 'Стандарт Z-Score',
        value: 'WHO/ВОЗ',
        color: '#0ea5e9',
      },
      {
        icon: Dna,
        title: 'Модель Хит-Картера',
        value: '3 компонента',
        color: '#16a34a',
      },
      {
        icon: BrainCircuit,
        title: 'AI-интерпретация',
        value: 'Контекстная',
        color: '#8b5cf6',
      },
      {
        icon: FileText,
        title: 'Отчет',
        value: 'PDF/DOCX/XLSX',
        color: '#f97316',
      },
    ],
    somatoTypes: [
      { label: 'Эндоморф', value: 72, color: '#f97316' },
      { label: 'Мезоморф', value: 88, color: '#16a34a' },
      { label: 'Эктоморф', value: 54, color: '#0ea5e9' },
    ],
    flowNodes: [
      { title: 'Антропометрия', desc: 'рост, вес, CI', color: '#0ea5e9' },
      { title: 'Состав BIA', desc: 'FM%, MM%', color: '#16a34a' },
      { title: 'Фактор среды', desc: 'E, urban, altitude', color: '#8b5cf6' },
      { title: 'Индексы', desc: 'HMAI, MII, ADI, MCRI', color: '#f97316' },
      {
        title: 'Заключение',
        desc: 'профиль, риск, рекомендация',
        color: '#dc2626',
      },
    ],
    riskFactors: [
      ['Высокий MCRI', 'риск повышается', '#dc2626'],
      ['Высокий ADI', 'дисгармония усиливается', '#f97316'],
      ['Высокий MII', 'гармония защищает', '#16a34a'],
      ['Высокий HMAI', 'адаптация сильная', '#0ea5e9'],
    ],
    decisionSteps: [
      'Валидация измерений и сравнение с возрастно-половыми нормами',
      'Определение пересечения соматотипа, состава тела и Z-score',
      'Вывод адаптивного, структурного и риск-профиля через HMAI/MII/ADI/MCRI',
      'Формирование скринингового вывода, направления мониторинга и профилактических рекомендаций',
    ],
  },
  en: {
    heroKicker:
      'Scientific anthropometry, somatotype, and digital risk analysis',
    heroTitle: 'A professional detailed map of morphofunctional analysis',
    heroDesc:
      'Z-Score, Heath-Carter somatotype, HMAI, MII, ADI, and MCRI indices are combined into one conceptual model: norm, harmony, adaptation, disharmony, and metabolic risk are evaluated as a system-level clinical profile.',
    compositeOverline: 'Composite profile',
    compositeTitle: 'Index panel',
    zScoreTitle: 'Z-Score analysis',
    zScoreDesc:
      'Z-score does more than label a child as normal or abnormal. It shows the exact distance from the growth trajectory, making it a core scientific measure for screening, dynamic monitoring, and risk-group detection.',
    zScoreNote:
      "Z-score shows how many standard deviations a child's measurement differs from the age- and sex-specific reference population. MorphoCheck reads height, weight, and BMI signals together to build the clinical basis for ADI and MCRI.",
    somatoTitle: 'Heath-Carter somatotype',
    somatoDesc:
      'Somatotype shows the balance of endomorphy, mesomorphy, and ectomorphy. MorphoCheck compares these three components with body composition and Z-score to make the clinical interpretation of phenotype clearer.',
    authorOverline: 'Author indices',
    authorTitle: 'Advanced scientific block for HMAI, MII, ADI, and MCRI',
    riskTitle: 'MorphoCheck Risk Score concept',
    riskDesc:
      'The platform does not compress the final interpretation into a single index. MCRI increases risk, ADI strengthens the disharmony signal, while MII and HMAI are treated as protective factors of harmony and adaptation.',
    decisionTitle: 'Clinical decision chain',
    readyOverline: 'Ready for analysis',
    readyTitle: 'Turn analysis into a practical result',
    readyDesc:
      'MorphoCheck Pro turns scientific formulas into a readable, exportable, and trackable digital report for physicians, researchers, and administrators.',
    indexCards: [
      {
        ...indexCards[0],
        title: 'Regional Morphological Adaptation Index',
        subtitle: 'HMAI (adaptation)',
        meaning:
          "Links the ratio between muscle and fat components with BMI and the regional ecological coefficient, showing how well the child's morphology adapts to the environment.",
        deep: 'Simple BMI does not separate body composition. HMAI combines healthy muscle dominance, energy reserve, and environmental influence into one integrative indicator.',
        factors: [
          'MM% - muscle mass',
          'FM% - fat mass',
          'BMI - body mass index',
          'E - regional factor',
        ],
        zones: [
          'Low adaptation',
          'Compensation',
          'Optimal adaptation',
          'Sport phenotype',
        ],
      },
      {
        ...indexCards[1],
        title: 'Morphological Integration Index',
        subtitle: 'MII (integration)',
        meaning:
          'Evaluates the correlation harmony among height, weight, chest circumference, BMI, and fat percentage, showing the body as a single biological system.',
        deep: 'MII measures systemic harmony instead of isolated numbers. A high MII shows coordinated development, while a low MII can indicate hidden imbalance.',
        factors: [
          'r(h,m) - height/weight',
          'r(m,CI) - weight/chest',
          'r(BMI,FM%) - index/composition',
        ],
        zones: [
          'Fragmentation',
          'Transition zone',
          'Harmonious integration',
          'High systemicity',
        ],
      },
      {
        ...indexCards[2],
        title: 'Anthropometric Disharmony Index',
        subtitle: 'ADI (disharmony)',
        meaning:
          'Combines Z-score deviations for height, weight, and BMI into a clinically convenient measure of overall morphological imbalance.',
        deep: 'When Z-scores are read separately, the clinical signal becomes fragmented. ADI sums deviations and helps detect total risk faster.',
        factors: [
          'Zh - height Z-score',
          'Zw - weight Z-score',
          'ZBMI - BMI Z-score',
        ],
        zones: [
          'Near normal',
          'Mild imbalance',
          'Moderate disharmony',
          'Severe disharmony',
        ],
      },
      {
        ...indexCards[3],
        title: 'MorphoCheck Complex Risk Index',
        subtitle: 'MCRI (risk index)',
        meaning:
          'Combines BMI, fat mass, and muscle component to forecast adipostatic phenotype and metabolic risk at an early stage.',
        deep: 'High BMI does not always mean the same risk: a child with high muscle mass has a different clinical meaning than one with high fat mass and low muscle mass.',
        factors: [
          'BMIz - BMI standard',
          'FMz - fat Z-score',
          'MMz - muscle Z-score',
        ],
        zones: ['Low risk', 'Monitoring', 'Prevention', 'High risk'],
      },
    ],
    clinicalLayers: [
      {
        icon: Activity,
        title: 'Z-Score standard',
        value: 'WHO',
        color: '#0ea5e9',
      },
      {
        icon: Dna,
        title: 'Heath-Carter model',
        value: '3 components',
        color: '#16a34a',
      },
      {
        icon: BrainCircuit,
        title: 'AI interpretation',
        value: 'Contextual',
        color: '#8b5cf6',
      },
      {
        icon: FileText,
        title: 'Report',
        value: 'PDF/DOCX/XLSX',
        color: '#f97316',
      },
    ],
    somatoTypes: [
      { label: 'Endomorph', value: 72, color: '#f97316' },
      { label: 'Mesomorph', value: 88, color: '#16a34a' },
      { label: 'Ectomorph', value: 54, color: '#0ea5e9' },
    ],
    flowNodes: [
      { title: 'Anthropometry', desc: 'height, weight, CI', color: '#0ea5e9' },
      { title: 'BIA composition', desc: 'FM%, MM%', color: '#16a34a' },
      {
        title: 'Environment factor',
        desc: 'E, urban, altitude',
        color: '#8b5cf6',
      },
      { title: 'Indices', desc: 'HMAI, MII, ADI, MCRI', color: '#f97316' },
      { title: 'Conclusion', desc: 'profile, risk, advice', color: '#dc2626' },
    ],
    riskFactors: [
      ['High MCRI', 'risk increases', '#dc2626'],
      ['High ADI', 'disharmony increases', '#f97316'],
      ['High MII', 'harmony is protective', '#16a34a'],
      ['High HMAI', 'adaptation is strong', '#0ea5e9'],
    ],
    decisionSteps: [
      'Validate measurements and compare them with age-sex norms',
      'Identify the intersection of somatotype, body composition, and Z-score',
      'Produce adaptive, structural, and risk profiles through HMAI/MII/ADI/MCRI',
      'Generate screening conclusions, monitoring direction, and preventive recommendations',
    ],
  },
  kz: {
    heroKicker: 'Ғылыми антропометрия, соматотип және цифрлық қауіп талдауы',
    heroTitle: 'Морфофункционалдық талдаудың кәсіби толық картасы',
    heroDesc:
      'Z-Score, Хит-Картер соматотипі, HMAI, MII, ADI және MCRI индекстері бір тұжырымдамалық модельге бірігеді: норма, үйлесім, бейімделу, үйлесімсіздік және метаболикалық қауіп жүйелі клиникалық профиль ретінде бағаланады.',
    compositeOverline: 'Композиттік профиль',
    compositeTitle: 'Индекстер панелі',
    zScoreTitle: 'Z-Score талдауы',
    zScoreDesc:
      'Z-score баланы тек норма немесе ауытқу деп бөлмейді. Ол өсу траекториясынан нақты қашықтықты көрсетеді, сондықтан скрининг, динамикалық мониторинг және қауіп топтарын анықтауда негізгі ғылыми өлшем болып табылады.',
    zScoreNote:
      'Z-score баланың көрсеткіші жас пен жыныс бойынша референстік популяциядан қанша стандартты ауытқуға алыстағанын көрсетеді. MorphoCheck бой, салмақ және BMI сигналдарын бірге оқып, ADI және MCRI үшін клиникалық негіз қалыптастырады.',
    somatoTitle: 'Хит-Картер соматотипі',
    somatoDesc:
      'Соматотип эндоморфия, мезоморфия және эктоморфия арақатынасын көрсетеді. MorphoCheck бұл үш компонентті дене құрамы және Z-score көрсеткішімен салыстырып, фенотиптің клиникалық түсіндірмесін нақтылайды.',
    authorOverline: 'Авторлық индекстер',
    authorTitle: 'HMAI, MII, ADI және MCRI бойынша тереңдетілген ғылыми блок',
    riskTitle: 'MorphoCheck Risk Score тұжырымдамасы',
    riskDesc:
      'Платформа қорытынды интерпретацияны бір ғана индекске байлап қоймайды. MCRI қауіпті арттырады, ADI үйлесімсіздікті күшейтеді, ал MII және HMAI үйлесім мен бейімделудің қорғаныс факторлары ретінде қаралады.',
    decisionTitle: 'Клиникалық шешім тізбегі',
    readyOverline: 'Талдауға дайын',
    readyTitle: 'Талдауды практикалық нәтижеге айналдырыңыз',
    readyDesc:
      'MorphoCheck Pro ғылыми формулаларды дәрігер, зерттеуші және әкімші үшін оқуға жеңіл, экспортталатын және бақылауға болатын цифрлық есепке айналдырады.',
    indexCards: [
      {
        ...indexCards[0],
        title: 'Аймақтық морфологиялық бейімделу индексі',
        subtitle: 'HMAI (бейімделу)',
        meaning:
          'Бұлшықет пен май компоненттерінің қатынасын BMI және аймақтық экологиялық коэффициентпен байланыстырып, баланың ортаға морфологиялық бейімделу деңгейін көрсетеді.',
        deep: 'Қарапайым BMI дене құрамын ажыратпайды. HMAI сау бұлшықет басымдығын, энергетикалық қорды және орта әсерін бір интегративті көрсеткішке біріктіреді.',
        factors: [
          'MM% - бұлшықет массасы',
          'FM% - май массасы',
          'BMI - дене массасы индексі',
          'E - аймақтық фактор',
        ],
        zones: [
          'Төмен бейімделу',
          'Компенсация',
          'Оңтайлы бейімделу',
          'Спорттық фенотип',
        ],
      },
      {
        ...indexCards[1],
        title: 'Морфологиялық интеграция индексі',
        subtitle: 'MII (интеграция)',
        meaning:
          'Бой, салмақ, кеуде шеңбері, BMI және май пайызы арасындағы корреляциялық үйлесімді бағалап, ағзаны біртұтас биологиялық жүйе ретінде көрсетеді.',
        deep: 'MII оқшау сандардың орнына жүйелік үйлесімді өлшейді. Жоғары MII параметрлердің үйлесімді дамуын, төмен MII жасырын дисбалансты көрсетуі мүмкін.',
        factors: [
          'r(h,m) - бой/салмақ',
          'r(m,CI) - салмақ/кеуде',
          'r(BMI,FM%) - индекс/құрам',
        ],
        zones: [
          'Фрагментация',
          'Өтпелі аймақ',
          'Үйлесімді интеграция',
          'Жоғары жүйелілік',
        ],
      },
      {
        ...indexCards[2],
        title: 'Антропометриялық үйлесімсіздік индексі',
        subtitle: 'ADI (үйлесімсіздік)',
        meaning:
          'Бой, салмақ және BMI бойынша Z-score ауытқуларын біріктіріп, жалпы морфологиялық үйлесімсіздік деңгейін клиникалық скринингке ыңғайлы түрде береді.',
        deep: 'Z-score жеке оқылғанда клиникалық сигнал бөлшектенеді. ADI ауытқулар қосындысын көрсетіп, жалпы қауіпті тезірек байқауға көмектеседі.',
        factors: [
          'Zh - бой Z-score',
          'Zw - салмақ Z-score',
          'ZBMI - BMI Z-score',
        ],
        zones: [
          'Нормаға жақын',
          'Жеңіл дисбаланс',
          'Орташа үйлесімсіздік',
          'Күшті үйлесімсіздік',
        ],
      },
      {
        ...indexCards[3],
        title: 'MorphoCheck кешенді қауіп индексі',
        subtitle: 'MCRI (қауіп индексі)',
        meaning:
          'BMI, май массасы және бұлшықет компонентін бірге есептеп, адипостатикалық фенотип пен метаболикалық қауіпті ерте кезеңде болжауға көмектеседі.',
        deep: 'BMI жоғары болуы әрдайым бірдей қауіп дегенді білдірмейді: бұлшықет массасы жоғары балада клиникалық мән басқа, май массасы жоғары әрі бұлшықет төмен болса қауіп күшейеді.',
        factors: [
          'BMIz - BMI стандарты',
          'FMz - май Z-score',
          'MMz - бұлшықет Z-score',
        ],
        zones: ['Төмен қауіп', 'Бақылау', 'Профилактика', 'Жоғары қауіп'],
      },
    ],
    clinicalLayers: [
      {
        icon: Activity,
        title: 'Z-Score стандарты',
        value: 'WHO/ДДҰ',
        color: '#0ea5e9',
      },
      {
        icon: Dna,
        title: 'Хит-Картер моделі',
        value: '3 компонент',
        color: '#16a34a',
      },
      {
        icon: BrainCircuit,
        title: 'AI түсіндіру',
        value: 'Контекстік',
        color: '#8b5cf6',
      },
      {
        icon: FileText,
        title: 'Есеп',
        value: 'PDF/DOCX/XLSX',
        color: '#f97316',
      },
    ],
    somatoTypes: [
      { label: 'Эндоморф', value: 72, color: '#f97316' },
      { label: 'Мезоморф', value: 88, color: '#16a34a' },
      { label: 'Эктоморф', value: 54, color: '#0ea5e9' },
    ],
    flowNodes: [
      { title: 'Антропометрия', desc: 'бой, салмақ, CI', color: '#0ea5e9' },
      { title: 'BIA құрамы', desc: 'FM%, MM%', color: '#16a34a' },
      { title: 'Орта факторы', desc: 'E, urban, altitude', color: '#8b5cf6' },
      { title: 'Индекстер', desc: 'HMAI, MII, ADI, MCRI', color: '#f97316' },
      { title: 'Қорытынды', desc: 'профиль, қауіп, ұсыныс', color: '#dc2626' },
    ],
    riskFactors: [
      ['MCRI жоғары', 'қауіп артады', '#dc2626'],
      ['ADI жоғары', 'үйлесімсіздік күшейеді', '#f97316'],
      ['MII жоғары', 'үйлесім қорғайды', '#16a34a'],
      ['HMAI жоғары', 'бейімделу күшті', '#0ea5e9'],
    ],
    decisionSteps: [
      'Өлшемдерді валидациялау және жас-жыныс нормаларымен салыстыру',
      'Соматотип, дене құрамы және Z-score қиылысын анықтау',
      'HMAI/MII/ADI/MCRI арқылы бейімделу, құрылымдық және қауіп профильдерін шығару',
      'Скрининг қорытындысын, мониторинг бағытын және профилактикалық ұсыныстарды қалыптастыру',
    ],
  },
};

function GlassPanel({ children, sx, hover = true }) {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, mode === 'dark' ? 0.5 : 0.8)}`,
        background:
          mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.9),
        boxShadow: `0 18px 50px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.22 : 0.08)}`,
        backdropFilter: 'blur(18px)',
        overflow: 'hidden',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 26px 70px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.32 : 0.12)}`,
            borderColor: alpha(theme.palette.primary.main, 0.32),
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function ZScoreScale({ copy }) {
  const theme = useTheme();

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ height: 18, borderRadius: 1, overflow: 'hidden', mb: 1.5 }}
      >
        {zScoreBands.map((band) => (
          <Box
            key={band.label}
            sx={{
              width: `${band.width}%`,
              bgcolor: band.color,
              opacity: 0.9,
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        {zScoreBands.map((band) => (
          <Typography
            key={band.label}
            variant="caption"
            color="text.secondary"
            fontWeight={800}
          >
            {band.label}
          </Typography>
        ))}
      </Stack>
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          border: `1px solid ${alpha(theme.palette.info.main, 0.16)}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {copy.zScoreNote}
        </Typography>
      </Box>
    </Box>
  );
}

function SomatoTriangle({ copy }) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'grid', placeItems: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width: 'min(100%, 320px)',
          aspectRatio: '1.08',
          mt: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: '6% 12% 18%',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            background: `linear-gradient(135deg, ${alpha('#f97316', 0.26)}, ${alpha(
              '#16a34a',
              0.3
            )} 50%, ${alpha('#0ea5e9', 0.26)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '48%',
            top: '42%',
            width: 18,
            height: 18,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.14)}`,
          }}
        />
        {[
          { text: 'Mezomorf', left: '50%', top: 0, color: '#16a34a' },
          { text: 'Endomorf', left: 0, top: '82%', color: '#f97316' },
          { text: 'Ektomorf', left: '77%', top: '82%', color: '#0ea5e9' },
        ].map((item) => (
          <Chip
            key={item.text}
            label={item.text}
            size="small"
            sx={{
              position: 'absolute',
              left: item.left,
              top: item.top,
              transform: 'translateX(-50%)',
              bgcolor: alpha(item.color, 0.12),
              color: item.color,
              fontWeight: 900,
              borderRadius: 1,
            }}
          />
        ))}
      </Box>
      <Stack spacing={1.4} sx={{ width: '100%' }}>
        {copy.somatoTypes.map((type) => (
          <Box key={type.label}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="body2" fontWeight={700}>
                {type.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={800}
              >
                {type.value}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={type.value}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: alpha(type.color, 0.14),
                '& .MuiLinearProgress-bar': {
                  bgcolor: type.color,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function IndexRadar() {
  const theme = useTheme();
  const points = [
    { label: 'MII', x: 50, y: 12, value: 76 },
    { label: 'HMAI', x: 88, y: 42, value: 68 },
    { label: 'MCRI', x: 70, y: 86, value: 34 },
    { label: 'ADI', x: 30, y: 86, value: 42 },
    { label: 'Z', x: 12, y: 42, value: 72 },
  ];
  const polygon = points
    .map((p) => {
      const cx = 50 + ((p.x - 50) * p.value) / 100;
      const cy = 50 + ((p.y - 50) * p.value) / 100;
      return `${cx},${cy}`;
    })
    .join(' ');

  return (
    <Box sx={{ width: '100%', maxWidth: 360, mx: 'auto' }}>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        role="img"
        aria-label="MorphoCheck indeks radar diagrammasi"
      >
        {[20, 35, 50].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={alpha(theme.palette.text.primary, 0.14)}
            strokeWidth="0.7"
          />
        ))}
        {points.map((p) => (
          <g key={p.label}>
            <line
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke={alpha(theme.palette.text.primary, 0.14)}
              strokeWidth="0.7"
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="5"
              fontWeight="800"
              fill={theme.palette.text.secondary}
            >
              {p.label}
            </text>
          </g>
        ))}
        <polygon
          points={polygon}
          fill={alpha(theme.palette.primary.main, 0.24)}
          stroke={theme.palette.primary.main}
          strokeWidth="1.4"
        />
        <circle cx="50" cy="50" r="2" fill={theme.palette.primary.main} />
      </svg>
    </Box>
  );
}

function FlowDiagram({ copy }) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const nodes = copy.flowNodes;

  return (
    <Grid container spacing={1.5}>
      {nodes.map((node, index) => (
        <Grid
          item
          xs={12}
          sm={index === nodes.length - 1 ? 12 : 6}
          md
          key={node.title}
        >
          <Box
            sx={{
              height: '100%',
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${alpha(node.color, mode === 'dark' ? 0.36 : 0.22)}`,
              bgcolor: alpha(node.color, mode === 'dark' ? 0.12 : 0.08),
              position: 'relative',
              '&:after':
                index < nodes.length - 1
                  ? {
                      content: '""',
                      position: 'absolute',
                      right: { xs: '50%', md: -12 },
                      bottom: { xs: -12, md: '50%' },
                      width: { xs: 1, md: 24 },
                      height: { xs: 24, md: 1 },
                      bgcolor: alpha(theme.palette.text.primary, 0.22),
                    }
                  : {},
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <CircleDot size={16} color={node.color} />
              <Typography variant="subtitle2" fontWeight={800}>
                {node.title}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
            >
              {node.desc}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

function IndexDeepCard({ item, index }) {
  const theme = useTheme();
  const Icon = item.icon;

  return (
    <motion.div
      custom={0.08 * index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <GlassPanel>
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: item.color,
                bgcolor: alpha(item.color, 0.12),
                border: `1px solid ${alpha(item.color, 0.22)}`,
              }}
            >
              <Icon size={25} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: item.color, fontWeight: 800, lineHeight: 1 }}
              >
                {item.subtitle}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, lineHeight: 1.16 }}
              >
                {item.title}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              color: item.color,
              bgcolor: alpha(item.color, 0.09),
              border: `1px solid ${alpha(item.color, 0.16)}`,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontWeight: 900,
              fontSize: { xs: 13, sm: 14 },
              overflowWrap: 'anywhere',
            }}
          >
            {item.formula}
          </Box>

          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 700 }}>
            {item.meaning}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {item.deep}
          </Typography>

          <Grid container spacing={1.2}>
            {item.factors.map((factor) => (
              <Grid item xs={12} sm={6} key={factor}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 1.2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.text.primary, 0.035),
                  }}
                >
                  <CheckCircle2 size={16} color={item.color} />
                  <Typography variant="caption" fontWeight={800}>
                    {factor}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2.5 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {item.zones.map((zone) => (
              <Chip
                key={zone}
                label={zone}
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  bgcolor: alpha(item.color, 0.1),
                  color: item.color,
                }}
              />
            ))}
          </Stack>
        </Box>
      </GlassPanel>
    </motion.div>
  );
}

export default function InfoDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { lang, t } = useLanguage();
  const copy = infoCopy[lang] || infoCopy.uz;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        py: { xs: 4, md: 7 },
        overflow: 'hidden',
        background:
          mode === 'dark'
            ? `radial-gradient(circle at 18% 8%, ${alpha('#0ea5e9', 0.18)}, transparent 32%),
               radial-gradient(circle at 82% 18%, ${alpha('#16a34a', 0.14)}, transparent 28%),
               linear-gradient(180deg, ${theme.palette.background.default}, ${alpha('#020617', 0.96)})`
            : `radial-gradient(circle at 18% 8%, ${alpha('#0ea5e9', 0.16)}, transparent 32%),
               radial-gradient(circle at 82% 18%, ${alpha('#22c55e', 0.13)}, transparent 28%),
               linear-gradient(180deg, #f7fbff 0%, #ffffff 44%, #f8fafc 100%)`,
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate('/')}
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontWeight: 700,
              borderRadius: 1,
            }}
          >
            {t('backBtn')}
          </Button>
        </motion.div>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={7}>
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: { xs: 64, md: 76 },
                      height: { xs: 64, md: 76 },
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.background.paper, 0.86),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      boxShadow: `0 18px 45px ${alpha(theme.palette.primary.main, 0.14)}`,
                    }}
                  >
                    <Box
                      component="img"
                      src={logo}
                      alt="MorphoCheck Pro"
                      sx={{ width: '82%', height: '82%' }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ color: 'primary.main', fontWeight: 800 }}
                    >
                      MorphoCheck Pro
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      {copy.heroKicker}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="h1"
                  sx={{
                    maxWidth: 980,
                    fontWeight: 800,
                    letterSpacing: 0,
                    lineHeight: 0.98,
                    fontSize: { xs: '2.45rem', sm: '3.5rem', md: '5.2rem' },
                  }}
                >
                  {copy.heroTitle}
                </Typography>

                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 860, lineHeight: 1.65, fontWeight: 500 }}
                >
                  {copy.heroDesc}
                </Typography>

                <Grid container spacing={1.5}>
                  {copy.clinicalLayers.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Grid item xs={6} md={3} key={item.title}>
                        <motion.div
                          custom={0.1 + index * 0.06}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                        >
                          <GlassPanel sx={{ p: 2 }} hover={false}>
                            <Stack spacing={1.2}>
                              <Icon size={23} color={item.color} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                              >
                                {item.title}
                              </Typography>
                              <Typography
                                variant="h6"
                                fontWeight={800}
                                sx={{ color: item.color }}
                              >
                                {item.value}
                              </Typography>
                            </Stack>
                          </GlassPanel>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <motion.div
              custom={0.18}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <GlassPanel hover={false}>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: 'primary.main', fontWeight: 800 }}
                      >
                        {copy.compositeOverline}
                      </Typography>
                      <Typography variant="h4" fontWeight={800}>
                        {copy.compositeTitle}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<Sparkles size={16} />}
                      label="Pro"
                      sx={{
                        borderRadius: 1,
                        fontWeight: 900,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      }}
                    />
                  </Stack>
                  <IndexRadar />
                  <FlowDiagram copy={copy} />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 3, md: 5 } }}>
          <Grid item xs={12} md={6}>
            <motion.div
              custom={0.08}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <BarChart3 color="#0ea5e9" />
                    <Typography variant="h4" fontWeight={800}>
                      {copy.zScoreTitle}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {copy.zScoreDesc}
                  </Typography>
                  <ZScoreScale copy={copy} />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              custom={0.16}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <LineChart color="#16a34a" />
                    <Typography variant="h4" fontWeight={800}>
                      {copy.somatoTitle}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {copy.somatoDesc}
                  </Typography>
                  <SomatoTriangle copy={copy} />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 4, md: 6 } }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Microscope color={theme.palette.primary.main} />
            <Box>
              <Typography
                variant="overline"
                sx={{ color: 'primary.main', fontWeight: 800 }}
              >
                {copy.authorOverline}
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, lineHeight: 1.05 }}
              >
                {copy.authorTitle}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {copy.indexCards.map((item, index) => (
              <Grid item xs={12} lg={6} key={item.key}>
                <IndexDeepCard item={item} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
          <Grid item xs={12} lg={7}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <TrendingUp color="#8b5cf6" />
                    <Typography variant="h4" fontWeight={800}>
                      {copy.riskTitle}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2.5 }}
                  >
                    {copy.riskDesc}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha('#8b5cf6', 0.1),
                      border: `1px solid ${alpha('#8b5cf6', 0.18)}`,
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontWeight: 900,
                      color: '#8b5cf6',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    MC-Score = w1 x MCRI - w2 x MII - w3 x HMAI + w4 x ADI
                  </Box>
                  <Grid container spacing={1.5} sx={{ mt: 2 }}>
                    {copy.riskFactors.map(([title, desc, color]) => (
                      <Grid item xs={12} sm={6} key={title}>
                        <Box
                          sx={{
                            p: 1.6,
                            borderRadius: 1,
                            bgcolor: alpha(color, 0.09),
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            sx={{ color }}
                          >
                            {title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={800}
                          >
                            {desc}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <motion.div
              custom={0.12}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <HeartPulse color="#dc2626" />
                    <Typography variant="h4" fontWeight={800}>
                      {copy.decisionTitle}
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {copy.decisionSteps.map((text, index) => (
                      <Stack
                        key={text}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                            fontWeight: 800,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={750}
                        >
                          {text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <GlassPanel sx={{ mt: { xs: 4, md: 6 } }} hover={false}>
            <Box
              sx={{
                p: { xs: 2.5, md: 4 },
                display: 'flex',
                gap: 3,
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 800 }}
                >
                  {copy.readyOverline}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {copy.readyTitle}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 760 }}
                >
                  {copy.readyDesc}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Zap size={20} />}
                onClick={() => navigate('/morphocheck-pro')}
                sx={{
                  alignSelf: { xs: 'stretch', md: 'center' },
                  px: 4,
                  py: 1.6,
                  borderRadius: 1,
                  fontWeight: 800,
                  boxShadow: `0 18px 36px ${alpha(theme.palette.primary.main, 0.26)}`,
                }}
              >
                {t('tryNow')}
              </Button>
            </Box>
          </GlassPanel>
        </motion.div>
      </Container>
    </Box>
  );
}
