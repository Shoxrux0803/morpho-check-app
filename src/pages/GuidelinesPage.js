import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardCheck,
  MoveHorizontal,
  Ruler,
  Scale,
  ScanLine,
  ShieldCheck,
  Target,
  TriangleRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeMode } from '../providers/ThemeProviderMUI';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, delay, ease: 'easeOut' },
  }),
};

const toolMeta = [
  { icon: Ruler, color: '#0ea5e9' },
  { icon: Scale, color: '#16a34a' },
  { icon: MoveHorizontal, color: '#f97316' },
  { icon: ScanLine, color: '#8b5cf6' },
];

const landmarkMeta = [
  { top: '7%', left: '50%', color: '#0ea5e9' },
  { top: '22%', left: '34%', color: '#16a34a' },
  { top: '35%', left: '50%', color: '#f97316' },
  { top: '50%', left: '50%', color: '#ef4444' },
  { top: '57%', left: '36%', color: '#8b5cf6' },
  { top: '65%', left: '62%', color: '#14b8a6' },
  { top: '92%', left: '43%', color: '#64748b' },
];

const guidelineCopy = {
  uz: {
    back: 'Orqaga',
    badge: "Vizual qo'llanmalar",
    title: "Antropometrik o'lchovlar uchun professional yo'riqnoma",
    desc: "O'lchov asboblarini to'g'ri qo'llash, tana landmarklarini aniqlash va MorphoCheck tahliliga sifatli ma'lumot kiritish uchun qisqa klinik protokol.",
    metrics: [
      ['2x', "takroriy o'lchov"],
      ['0', 'asbob nol nazorati'],
      ['90°', 'vertikal holat'],
    ],
    landmarksTitle: 'Landmarklar',
    protocolTitle: "O'lchov protokoli",
    qualityTitle: 'Sifat nazorati',
    tools: [
      {
        title: 'Stadiometr',
        value: "Bo'y",
        guide:
          'Bosh Frankfort tekisligida, tovonlar bir chiziqda, orqa vertikal yuzaga yaqin.',
      },
      {
        title: 'Tibbiy tarozi',
        value: 'Vazn',
        guide:
          'Yengil kiyim, oyoq kiyimsiz, platforma markazida harakatsiz turiladi.',
      },
      {
        title: 'Antropometrik lenta',
        value: 'Aylana',
        guide:
          "Lenta gorizontal, terini siqmaydi; o'lchov odatiy nafas chiqarishdan keyin olinadi.",
      },
      {
        title: 'Kaliper',
        value: 'Teri burmasi',
        guide:
          "Burma bosh va ko'rsatkich barmoq bilan olinadi, kaliper 1 sm pastga qo'yiladi.",
      },
    ],
    landmarks: [
      ['Vertex', "bo'y o'lchovining yuqori nuqtasi"],
      ['Acromion', 'yelka kengligi orientiri'],
      ['Mesosternale', "ko'krak aylanasi tekisligi"],
      ['Omphalion', 'bel/qorin nazorati'],
      ['Iliocristale', "tos suyagi cho'qqisi"],
      ['Trochanterion', 'son proksimal landmarki'],
      ['Sphyrion', 'oyoq uzunligi pastki orientiri'],
    ],
    protocol: [
      'Asbobni tekis yuzaga joylashtiring va nol holatini tekshiring.',
      "Bolaning holatini standart pozitsiyaga keltiring: tik turish, yelka bo'sh, nigoh oldinga.",
      "Landmarkni palpatsiya qiling, keyin o'lchov chizig'ini shu nuqtadan o'tkazing.",
      "Har bir ko'rsatkichni kamida 2 marta o'lchang; farq katta bo'lsa, uchinchi o'lchovni oling.",
    ],
    quality: [
      ['Kalibrlash', 'Tarozi va stadiometr kun boshida tekshiriladi.'],
      [
        'Bir xil sharoit',
        "O'lchovlar bir xil xona, vaqt va kiyim standartida olinadi.",
      ],
      [
        'Qayd etish',
        'Natija darhol MorphoCheck formasiga birliklari bilan kiritiladi.',
      ],
    ],
  },
  en: {
    back: 'Back',
    badge: 'Visual guidelines',
    title: 'Professional guide for anthropometric measurements',
    desc: 'A concise clinical protocol for correct tool use, body landmark identification, and high-quality MorphoCheck data entry.',
    metrics: [
      ['2x', 'repeat measure'],
      ['0', 'zero check'],
      ['90°', 'vertical posture'],
    ],
    landmarksTitle: 'Landmarks',
    protocolTitle: 'Measurement protocol',
    qualityTitle: 'Quality control',
    tools: [
      {
        title: 'Stadiometer',
        value: 'Height',
        guide:
          'Keep the head in the Frankfort plane, heels aligned, and back close to the vertical surface.',
      },
      {
        title: 'Medical scale',
        value: 'Weight',
        guide:
          'Use light clothing, no shoes, and stand still at the center of the platform.',
      },
      {
        title: 'Anthropometric tape',
        value: 'Circumference',
        guide:
          'Keep the tape horizontal without compressing the skin; record after a normal exhalation.',
      },
      {
        title: 'Caliper',
        value: 'Skinfold',
        guide:
          'Lift the fold with thumb and index finger, then place the caliper about 1 cm below the grip.',
      },
    ],
    landmarks: [
      ['Vertex', 'upper reference point for height'],
      ['Acromion', 'shoulder breadth reference'],
      ['Mesosternale', 'chest circumference plane'],
      ['Omphalion', 'waist and abdomen control'],
      ['Iliocristale', 'iliac crest reference'],
      ['Trochanterion', 'proximal thigh landmark'],
      ['Sphyrion', 'lower reference for limb length'],
    ],
    protocol: [
      'Place the instrument on a flat surface and verify the zero position.',
      'Set the child in a standard posture: standing upright, shoulders relaxed, gaze forward.',
      'Palpate the landmark, then pass the measurement line through that point.',
      'Measure every indicator at least twice; if the difference is large, take a third measurement.',
    ],
    quality: [
      [
        'Calibration',
        'Check the scale and stadiometer at the beginning of the day.',
      ],
      [
        'Same conditions',
        'Take measurements in the same room, timing, and clothing standard.',
      ],
      [
        'Record immediately',
        'Enter the result in MorphoCheck with units right away.',
      ],
    ],
  },
};

guidelineCopy.ru = {
  ...guidelineCopy.en,
  back: 'Назад',
  badge: 'Визуальные инструкции',
  title: 'Профессиональная инструкция по антропометрическим измерениям',
  desc: 'Краткий клинический протокол для правильного использования инструментов, определения landmark-точек и качественного ввода данных в MorphoCheck.',
  metrics: [
    ['2x', 'повторное измерение'],
    ['0', 'проверка нуля'],
    ['90°', 'вертикальная поза'],
  ],
  landmarksTitle: 'Landmark-точки',
  protocolTitle: 'Протокол измерения',
  qualityTitle: 'Контроль качества',
  tools: [
    {
      title: 'Стадиометр',
      value: 'Рост',
      guide:
        'Голова в плоскости Франкфурта, пятки на одной линии, спина близко к вертикальной поверхности.',
    },
    {
      title: 'Медицинские весы',
      value: 'Вес',
      guide:
        'Легкая одежда, без обуви, неподвижное положение в центре платформы.',
    },
    {
      title: 'Антропометрическая лента',
      value: 'Окружность',
      guide:
        'Лента идет горизонтально и не сдавливает кожу; измерение фиксируется после обычного выдоха.',
    },
    {
      title: 'Калипер',
      value: 'Кожная складка',
      guide:
        'Складка берется большим и указательным пальцем, калипер ставится примерно на 1 см ниже.',
    },
  ],
  landmarks: [
    ['Vertex', 'верхняя точка измерения роста'],
    ['Acromion', 'ориентир ширины плеч'],
    ['Mesosternale', 'плоскость окружности груди'],
    ['Omphalion', 'контроль талии и живота'],
    ['Iliocristale', 'ориентир гребня подвздошной кости'],
    ['Trochanterion', 'проксимальный landmark бедра'],
    ['Sphyrion', 'нижний ориентир длины конечности'],
  ],
  protocol: [
    'Поставьте инструмент на ровную поверхность и проверьте нулевое положение.',
    'Расположите ребенка стандартно: стоя прямо, плечи расслаблены, взгляд вперед.',
    'Пальпируйте landmark-точку, затем проведите линию измерения через эту точку.',
    'Каждый показатель измеряйте минимум 2 раза; при большой разнице выполните третье измерение.',
  ],
  quality: [
    ['Калибровка', 'Весы и стадиометр проверяются в начале рабочего дня.'],
    [
      'Единые условия',
      'Измерения выполняются в одинаковой комнате, времени и стандарте одежды.',
    ],
    [
      'Фиксация',
      'Результат сразу вводится в форму MorphoCheck с единицами измерения.',
    ],
  ],
};

guidelineCopy.tg = {
  ...guidelineCopy.uz,
  back: 'Бозгашт',
  badge: 'Дастурҳои визуалӣ',
  title: 'Дастури касбӣ барои ченкуниҳои антропометрӣ',
  desc: 'Протоколи кӯтоҳи клиникӣ барои истифодаи дурусти асбобҳо, муайян кардани landmark-ҳои бадан ва ворид кардани маълумоти босифат ба MorphoCheck.',
  metrics: [
    ['2x', 'ченкунии такрорӣ'],
    ['0', 'назорати сифр'],
    ['90°', 'ҳолати амудӣ'],
  ],
  landmarksTitle: 'Landmark-ҳо',
  protocolTitle: 'Протоколи ченкунӣ',
  qualityTitle: 'Назорати сифат',
  tools: [
    {
      title: 'Стадиометр',
      value: 'Қад',
      guide:
        'Сар дар ҳамвории Франкфурт, пошнаҳо дар як хат, пушт ба сатҳи амудӣ наздик бошад.',
    },
    {
      title: 'Тарозуи тиббӣ',
      value: 'Вазн',
      guide:
        'Бо либоси сабук, бе пойафзол, дар маркази платформа беҳаракат истед.',
    },
    {
      title: 'Лентаи антропометрӣ',
      value: 'Давра',
      guide:
        'Лента уфуқӣ бошад ва пӯстро нафишорад; ченкунӣ пас аз нафасбарории оддӣ гирифта мешавад.',
    },
    {
      title: 'Калипер',
      value: 'Қабати пӯст',
      guide:
        'Қабат бо ангушти калон ва ишоратӣ гирифта шуда, калипер тақрибан 1 см поёнтар гузошта мешавад.',
    },
  ],
  landmarks: [
    ['Vertex', 'нуқтаи болоии ченкунии қад'],
    ['Acromion', 'ориентири паҳнои китф'],
    ['Mesosternale', 'ҳамвории давраи қафаси сина'],
    ['Omphalion', 'назорати миён ва шикам'],
    ['Iliocristale', 'ориентири қуллаи устухони кос'],
    ['Trochanterion', 'landmark-и қисми болоии рон'],
    ['Sphyrion', 'ориентири поёнии дарозии пой'],
  ],
  protocol: [
    'Асбобро ба сатҳи ҳамвор гузоред ва ҳолати сифрро санҷед.',
    'Кӯдакро ба ҳолати стандартӣ гузоред: рост истодан, китфҳо озод, нигоҳ ба пеш.',
    'Landmark-ро палпатсия кунед, сипас хати ченкуниро аз ҳамин нуқта гузаронед.',
    'Ҳар нишондиҳандаро камаш 2 маротиба чен кунед; агар фарқ калон бошад, ченкунии сеюмро гиред.',
  ],
  quality: [
    ['Калибркунӣ', 'Тарозу ва стадиометр дар аввали рӯз санҷида мешаванд.'],
    [
      'Шароити якхела',
      'Ченкунӣ дар як ҳуҷра, вақт ва стандарти либос гузаронида мешавад.',
    ],
    [
      'Сабт',
      'Натиҷа фавран бо воҳидҳо ба формаи MorphoCheck ворид карда мешавад.',
    ],
  ],
};

guidelineCopy.kz = {
  ...guidelineCopy.ru,
  back: 'Артқа',
  badge: 'Көрнекі нұсқаулықтар',
  title: 'Антропометриялық өлшеулерге арналған кәсіби нұсқаулық',
  desc: 'Құралдарды дұрыс қолдану, дене landmark-нүктелерін анықтау және MorphoCheck жүйесіне сапалы дерек енгізу үшін қысқа клиникалық протокол.',
  metrics: [
    ['2x', 'қайта өлшеу'],
    ['0', 'нөлді тексеру'],
    ['90°', 'тік қалып'],
  ],
  landmarksTitle: 'Landmark-нүктелер',
  protocolTitle: 'Өлшеу протоколы',
  qualityTitle: 'Сапаны бақылау',
  tools: [
    {
      title: 'Стадиометр',
      value: 'Бой',
      guide:
        'Бас Франкфурт жазықтығында, өкшелер бір сызықта, арқа тік бетке жақын болуы керек.',
    },
    {
      title: 'Медициналық таразы',
      value: 'Салмақ',
      guide:
        'Жеңіл киіммен, аяқ киімсіз, платформаның ортасында қозғалмай тұру қажет.',
    },
    {
      title: 'Антропометриялық таспа',
      value: 'Шеңбер',
      guide:
        'Таспа көлденең орналасады және теріні қыспайды; өлшеу қалыпты дем шығарғаннан кейін алынады.',
    },
    {
      title: 'Калипер',
      value: 'Тері қатпары',
      guide:
        'Қатпар бас және сұқ саусақпен алынады, калипер ұсталған жерден шамамен 1 см төмен қойылады.',
    },
  ],
  landmarks: [
    ['Vertex', 'бой өлшеудің жоғарғы нүктесі'],
    ['Acromion', 'иық енінің бағдар нүктесі'],
    ['Mesosternale', 'кеуде шеңбері жазықтығы'],
    ['Omphalion', 'бел және іш бақылауы'],
    ['Iliocristale', 'мықын сүйегі қырының бағдар нүктесі'],
    ['Trochanterion', 'санның проксималды landmark-нүктесі'],
    ['Sphyrion', 'аяқ ұзындығының төменгі бағдар нүктесі'],
  ],
  protocol: [
    'Құралды тегіс бетке қойып, нөлдік күйін тексеріңіз.',
    'Баланы стандартты қалыпқа келтіріңіз: тік тұру, иық бос, көзқарас алға.',
    'Landmark-нүктені пальпациялап, өлшеу сызығын сол нүктеден өткізіңіз.',
    'Әр көрсеткішті кемінде 2 рет өлшеңіз; айырма үлкен болса, үшінші өлшеуді алыңыз.',
  ],
  quality: [
    ['Калибрлеу', 'Таразы мен стадиометр жұмыс күні басында тексеріледі.'],
    [
      'Бірдей жағдай',
      'Өлшеулер бір бөлмеде, бір уақытта және бір киім стандартында алынады.',
    ],
    [
      'Тіркеу',
      'Нәтиже бірден өлшем бірліктерімен MorphoCheck формасына енгізіледі.',
    ],
  ],
};

guidelineCopy.ky = {
  ...guidelineCopy.ru,
  back: 'Артка',
  badge: 'Визуалдык колдонмолор',
  title: 'Антропометриялык өлчөөлөр үчүн кесиптик колдонмо',
  desc: 'Куралдарды туура колдонуу, денедеги landmark чекиттерин аныктоо жана MorphoCheckке сапаттуу маалымат киргизүү үчүн кыска клиникалык протокол.',
  metrics: [
    ['2x', 'кайталап өлчөө'],
    ['0', 'нөлдү текшерүү'],
    ['90°', 'тик абал'],
  ],
  landmarksTitle: 'Landmark чекиттери',
  protocolTitle: 'Өлчөө протоколу',
  qualityTitle: 'Сапатты көзөмөлдөө',
  tools: [
    {
      title: 'Стадиометр',
      value: 'Бой',
      guide:
        'Баш Франкфурт тегиздигинде, тамандар бир сызыкта, арка тик бетке жакын болушу керек.',
    },
    {
      title: 'Медициналык тараза',
      value: 'Салмак',
      guide:
        'Жеңил кийим менен, бут кийимсиз, платформанын ортосунда кыймылсыз турулат.',
    },
    {
      title: 'Антропометриялык лента',
      value: 'Айланасы',
      guide:
        'Лента горизонталдуу кармалат жана терини кыспайт; өлчөө кадимки дем чыгаргандан кийин алынат.',
    },
    {
      title: 'Калипер',
      value: 'Тери бүктөмү',
      guide:
        'Бүктөм баш жана сөөмөй менен алынат, калипер кармаган жерден болжол менен 1 см төмөн коюлат.',
    },
  ],
  landmarks: [
    ['Vertex', 'бой өлчөөнүн жогорку чекити'],
    ['Acromion', 'ийин кеңдигинин багыт чекити'],
    ['Mesosternale', 'көкүрөк айланасынын тегиздиги'],
    ['Omphalion', 'бел жана ич көзөмөлү'],
    ['Iliocristale', 'жамбаш сөөгүнүн кыр багыты'],
    ['Trochanterion', 'сандын проксималдык landmark чекити'],
    ['Sphyrion', 'бут узундугунун төмөнкү багыты'],
  ],
  protocol: [
    'Куралды тегиз жерге коюп, нөл абалын текшериңиз.',
    'Баланы стандарттуу абалга келтириңиз: тик туруу, ийин бош, көз караш алдыга.',
    'Landmark чекитин пальпациялап, өлчөө сызыгын ошол чекиттен өткөрүңүз.',
    'Ар бир көрсөткүчтү кеминде 2 жолу өлчөңүз; айырма чоң болсо, үчүнчү өлчөөнү алыңыз.',
  ],
  quality: [
    ['Калибрлөө', 'Тараза жана стадиометр күн башында текшерилет.'],
    [
      'Бирдей шарт',
      'Өлчөөлөр бир бөлмөдө, бир убакта жана бир кийим стандартында алынат.',
    ],
    [
      'Жазуу',
      'Натыйжа дароо бирдиктери менен MorphoCheck формасына киргизилет.',
    ],
  ],
};

guidelineCopy.tr = {
  ...guidelineCopy.en,
  back: 'Geri',
  badge: 'Gorsel kilavuzlar',
  title: 'Antropometrik olcumler icin profesyonel kilavuz',
  desc: 'Araclarin dogru kullanimi, vucut landmark noktalarinin belirlenmesi ve MorphoCheck verilerinin kaliteli girisi icin kisa klinik protokol.',
  metrics: [
    ['2x', 'tekrar olcum'],
    ['0', 'sifir kontrolu'],
    ['90°', 'dik durus'],
  ],
  landmarksTitle: 'Landmark noktalar',
  protocolTitle: 'Olcum protokolu',
  qualityTitle: 'Kalite kontrol',
  tools: [
    {
      title: 'Stadiometre',
      value: 'Boy',
      guide:
        'Basi Frankfort duzleminde tutun, topuklari hizalayin ve sirtin dik yuzeye yakin olmasini saglayin.',
    },
    {
      title: 'Tibbi tarti',
      value: 'Agirlik',
      guide:
        'Hafif kiyafet, ayakkabisiz durus ve platformun ortasinda hareketsiz pozisyon kullanin.',
    },
    {
      title: 'Antropometrik mezura',
      value: 'Cevre',
      guide:
        'Mezurayi deriyi sikistirmadan yatay tutun; sonucu normal nefes verme sonrasinda kaydedin.',
    },
    {
      title: 'Kaliper',
      value: 'Deri kivrimi',
      guide:
        'Kivrimi bas ve isaret parmagi ile kaldirin, kaliperi tutusun yaklasik 1 cm altina yerlestirin.',
    },
  ],
  landmarks: [
    ['Vertex', 'boy olcumu icin ust referans nokta'],
    ['Acromion', 'omuz genisligi referansi'],
    ['Mesosternale', 'gogus cevresi duzlemi'],
    ['Omphalion', 'bel ve karin kontrolu'],
    ['Iliocristale', 'iliak krest referansi'],
    ['Trochanterion', 'proksimal uyluk landmarki'],
    ['Sphyrion', 'ekstremite uzunlugu icin alt referans'],
  ],
  protocol: [
    'Araci duz bir yuzeye yerlestirin ve sifir konumunu kontrol edin.',
    'Cocugu standart posturde konumlandirin: dik durus, gevsek omuzlar, bakis ileri.',
    'Landmark noktasini palpe edin, sonra olcum hattini bu noktadan gecirin.',
    'Her gostergeyi en az iki kez olcun; fark buyukse ucuncu olcumu alin.',
  ],
  quality: [
    ['Kalibrasyon', 'Tarti ve stadiometre gun basinda kontrol edilir.'],
    [
      'Ayni kosullar',
      'Olcumleri ayni oda, zaman ve kiyafet standardinda yapin.',
    ],
    [
      'Hemen kayit',
      'Sonucu birimleriyle birlikte hemen MorphoCheck sistemine girin.',
    ],
  ],
};

function GlassPanel({ children, sx = {}, hover = true }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: alpha(
          theme.palette.background.paper,
          theme.palette.mode === 'dark' ? 0.72 : 0.86
        ),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 22px 70px ${alpha('#000', 0.34)}`
            : `0 22px 60px ${alpha('#0f172a', 0.1)}`,
        backdropFilter: 'blur(18px)',
        transition:
          'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
        ...(hover
          ? {
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: alpha(theme.palette.primary.main, 0.34),
              },
            }
          : {}),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function BodyLandmarkMap({ landmarks }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 480, md: 560 },
        display: 'grid',
        placeItems: 'center',
        perspective: 1200,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '6% 10%',
          borderRadius: 2,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(140deg, ${alpha('#0ea5e9', 0.14)}, ${alpha('#16a34a', 0.1)}, ${alpha('#f97316', 0.08)})`
              : `linear-gradient(140deg, ${alpha('#dbeafe', 0.86)}, ${alpha('#dcfce7', 0.78)}, ${alpha('#ffedd5', 0.62)})`,
          transform: 'rotateX(7deg) rotateY(-8deg)',
          boxShadow: `0 28px 70px ${alpha(theme.palette.primary.main, 0.18)}`,
        }}
      />

      <Box
        component="svg"
        viewBox="0 0 260 520"
        aria-label="Antropometrik landmarklar xaritasi"
        sx={{
          position: 'relative',
          zIndex: 2,
          width: { xs: 210, sm: 240, md: 260 },
          height: 'auto',
          filter: `drop-shadow(0 22px 34px ${alpha('#0f172a', 0.22)})`,
          animation: 'bodyFloat 5s ease-in-out infinite',
          '@keyframes bodyFloat': {
            '0%, 100%': { transform: 'translateY(0) rotateX(0deg)' },
            '50%': { transform: 'translateY(-8px) rotateX(2deg)' },
          },
        }}
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="45%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
        </defs>
        <circle
          cx="130"
          cy="55"
          r="34"
          fill="url(#bodyGradient)"
          stroke="#0f766e"
          strokeWidth="3"
        />
        <path
          d="M88 112 C98 92 162 92 172 112 L185 248 C188 275 166 294 148 270 L140 210 L120 210 L112 270 C94 294 72 275 75 248 Z"
          fill="url(#bodyGradient)"
          stroke="#0f766e"
          strokeWidth="3"
        />
        <path
          d="M85 135 C45 158 36 220 47 282"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M175 135 C215 158 224 220 213 282"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M111 272 C94 330 88 402 88 480"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M149 272 C166 330 172 402 172 480"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M76 181 H184"
          stroke="#f97316"
          strokeWidth="4"
          strokeDasharray="9 9"
        />
        <path
          d="M82 260 H178"
          stroke="#ef4444"
          strokeWidth="4"
          strokeDasharray="9 9"
        />
      </Box>

      {landmarks.map((point, index) => (
        <Box
          key={point.label}
          sx={{
            position: 'absolute',
            zIndex: 3,
            top: point.top,
            left: point.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: '50%',
              bgcolor: point.color,
              border: '3px solid',
              borderColor: theme.palette.background.paper,
              boxShadow: `0 0 0 8px ${alpha(point.color, 0.18)}`,
              animation: 'landmarkPulse 2.4s ease-in-out infinite',
              animationDelay: `${index * 0.16}s`,
              '@keyframes landmarkPulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  boxShadow: `0 0 0 7px ${alpha(point.color, 0.16)}`,
                },
                '50%': {
                  transform: 'scale(1.18)',
                  boxShadow: `0 0 0 13px ${alpha(point.color, 0.05)}`,
                },
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function LandmarkList({ landmarks }) {
  return (
    <Stack spacing={1.2}>
      {landmarks.map((point) => (
        <Stack
          key={point.label}
          direction="row"
          spacing={1.2}
          alignItems="flex-start"
          sx={{ minWidth: 0 }}
        >
          <Box
            sx={{
              mt: 0.45,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: point.color,
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={900} lineHeight={1.15}>
              {point.label}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              {point.desc}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export default function GuidelinesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { lang } = useLanguage();
  const copy = guidelineCopy[lang] || guidelineCopy.en;
  const tools = copy.tools.map((item, index) => ({
    ...item,
    ...toolMeta[index],
  }));
  const landmarks = copy.landmarks.map(([label, desc], index) => ({
    label,
    desc,
    ...landmarkMeta[index],
  }));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 7 },
        background:
          mode === 'dark'
            ? `radial-gradient(circle at 12% 8%, ${alpha('#0ea5e9', 0.18)}, transparent 30%),
               radial-gradient(circle at 86% 16%, ${alpha('#f97316', 0.12)}, transparent 26%),
               linear-gradient(180deg, ${theme.palette.background.default}, ${alpha('#020617', 0.96)})`
            : `radial-gradient(circle at 12% 8%, ${alpha('#bae6fd', 0.72)}, transparent 30%),
               radial-gradient(circle at 86% 16%, ${alpha('#fed7aa', 0.56)}, transparent 26%),
               linear-gradient(180deg, #f8fbff 0%, #ffffff 46%, #f8fafc 100%)`,
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontWeight: 800,
              borderRadius: 1,
            }}
          >
            {copy.back}
          </Button>
        </motion.div>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={6}>
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <Stack spacing={2.5} sx={{ maxWidth: 850 }}>
                <Chip
                  icon={<ShieldCheck size={16} />}
                  label={copy.badge}
                  sx={{
                    alignSelf: 'flex-start',
                    borderRadius: 1,
                    fontWeight: 900,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0,
                    lineHeight: 0.98,
                    fontSize: { xs: '2.35rem', sm: '3.4rem', md: '5rem' },
                  }}
                >
                  {copy.title}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 760, lineHeight: 1.65, fontWeight: 550 }}
                >
                  {copy.desc}
                </Typography>

                <Grid container spacing={1.4}>
                  {copy.metrics.map(([value, label]) => (
                    <Grid item xs={4} key={label}>
                      <GlassPanel sx={{ p: 1.8 }} hover={false}>
                        <Typography
                          variant="h4"
                          fontWeight={950}
                          color="primary.main"
                        >
                          {value}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={800}
                        >
                          {label}
                        </Typography>
                      </GlassPanel>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={6}>
            <motion.div
              custom={0.12}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <GlassPanel hover={false}>
                <Grid container spacing={0}>
                  <Grid item xs={12} md={8}>
                    <BodyLandmarkMap landmarks={landmarks} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Target size={20} color={theme.palette.primary.main} />
                        <Typography variant="h6" fontWeight={900}>
                          {copy.landmarksTitle}
                        </Typography>
                      </Stack>
                      <LandmarkList landmarks={landmarks} />
                    </Box>
                  </Grid>
                </Grid>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mt: { xs: 3, md: 5 } }}>
          {tools.map((item, index) => {
            const Icon = item.icon;
            return (
              <Grid item xs={12} sm={6} lg={3} key={item.title}>
                <motion.div
                  custom={0.08 * index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <GlassPanel>
                    <Box sx={{ p: 2.5 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            display: 'grid',
                            placeItems: 'center',
                            color: item.color,
                            bgcolor: alpha(item.color, 0.12),
                            border: `1px solid ${alpha(item.color, 0.22)}`,
                          }}
                        >
                          <Icon size={25} />
                        </Box>
                        <Chip
                          label={item.value}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontWeight: 900,
                            color: item.color,
                            bgcolor: alpha(item.color, 0.1),
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        sx={{ mt: 2, mb: 1 }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={650}
                      >
                        {item.guide}
                      </Typography>
                    </Box>
                  </GlassPanel>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 3, md: 5 } }}>
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
                    spacing={1.4}
                    alignItems="center"
                    sx={{ mb: 2.5 }}
                  >
                    <ClipboardCheck color="#16a34a" />
                    <Typography variant="h4" fontWeight={900}>
                      {copy.protocolTitle}
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {copy.protocol.map((step, index) => (
                      <Stack
                        key={step}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                            fontWeight: 950,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          fontWeight={750}
                        >
                          {step}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
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
                    spacing={1.4}
                    alignItems="center"
                    sx={{ mb: 2.5 }}
                  >
                    <BadgeCheck color="#f97316" />
                    <Typography variant="h4" fontWeight={900}>
                      {copy.qualityTitle}
                    </Typography>
                  </Stack>
                  {copy.quality.map(([title, desc]) => (
                    <Stack
                      key={title}
                      direction="row"
                      spacing={1.2}
                      sx={{ mb: 1.6 }}
                    >
                      <TriangleRight
                        size={18}
                        color={theme.palette.primary.main}
                      />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={900}>
                          {title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          {desc}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
