import React, { useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  FileText,
  Fingerprint,
  Leaf,
  Microscope,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../providers/ThemeProviderMUI';
import TubesBackground from '../components/TubesBackground';
import WelcomeBmiCalculator from '../components/WelcomeBmiCalculator';
import '../styles/welcome.css';

const copy = {
  uz: {
    eyebrow: 'ILM VA SALOMATLIK UCHRASHGAN JOY',
    title: 'Har bir o‘lchov.',
    accent: 'Katta imkoniyat.',
    desc: 'O‘sish va rivojlanishni chuqurroq tushuning. Antropometrik o‘lchovlar, aniq hisob-kitoblar va tushunarli natijalar — bir platformada.',
    start: 'Boshlash',
    explore: 'Qanday ishlaydi?',
    tag: 'Raqamli antropometriya platformasi',
    demo: 'NAMUNAVIY TAHLIL',
    demoNote: 'Interfeys namunasi · haqiqiy bemor ma’lumoti emas',
    profile: 'O‘sish profili',
    overview: 'Umumiy',
    growth: 'Dinamika',
    quality: 'Ma’lumot sifati',
    height: 'Bo‘y',
    weight: 'Vazn',
    measured: 'O‘lchangan',
    calculated: 'Hisoblangan',
    chart: 'O‘sish dinamikasi',
    chartNote: 'Namunaviy takroriy o‘lchovlar',
    months: ['Yan', 'Mar', 'May', 'Iyul', 'Sen'],
    checked: 'O‘lchovlar kiritildi',
    qualityNote: 'Qiymatlarning manbasi natija bilan birga ko‘rsatiladi.',
    report: 'Tushunarli hisobot',
    reportNote: 'O‘lchovdan xulosagacha',
    strip: [
      'Antropometrik tahlil',
      'O‘sish monitoringi',
      'Ilmiy tadqiqot',
      'PDF · DOCX · Excel',
    ],
    section: 'SALOMATLIKKA E’TIBOR. MA’LUMOTGA ANIQLIK.',
    sectionTitle: 'Murakkab tahlil.',
    sectionAccent: 'Sodda tajriba.',
    sectionDesc:
      'Shifokor va tadqiqotchilar uchun har bir bosqichda qulay ish muhiti.',
    features: [
      [
        'O‘lchovlar tartibda',
        'Asosiy va batafsil o‘lchovlarni bosqichma-bosqich kiriting. Birliklar va ma’lumot sifatini bir joyda tekshiring.',
      ],
      [
        'Rivojlanish ko‘rinadi',
        'Bo‘y, vazn va BMI ko‘rsatkichlarini tushunarli grafiklar yordamida kuzating.',
      ],
      [
        'Natijalar ulashishga tayyor',
        'Tahlil natijalarini ko‘rib chiqing va mavjud hisobot formatlarida yuklab oling.',
      ],
    ],
    process: 'UCH QADAMDA',
    processTitle: 'Aniq o‘lchovdan foydali natijagacha.',
    steps: [
      [
        'Ma’lumotni kiriting',
        'Yosh, jins va o‘lchangan antropometrik qiymatlarni qo‘shing.',
      ],
      [
        'Natijani ko‘rib chiqing',
        'Asosiy ko‘rsatkichlar va ma’lumot sifatini tekshiring.',
      ],
      [
        'Hisobotni saqlang',
        'Natijani yuklab oling va keyingi o‘lchovlar bilan taqqoslang.',
      ],
    ],
    trust: 'Ma’lumotga mas’uliyat bilan yondashamiz',
    trustDesc:
      'Rozilik boshqaruvi va rollarga asoslangan kirish orqali tartibli ish jarayoni.',
    privacy: 'Maxfiylik haqida',
    cta: 'Har bir qadam — yaxshiroq tushunish sari.',
    ctaDesc: 'O‘lchovlaringizga ma’no bering. MorphoCheck bilan boshlang.',
  },
  en: {
    eyebrow: 'WHERE SCIENCE MEETS WELLBEING',
    title: 'Every measurement.',
    accent: 'More possibility.',
    desc: 'Understand growth and development better. Anthropometric measurements, clear calculations and meaningful results — together in one platform.',
    start: 'Get started',
    explore: 'How it works',
    tag: 'Digital anthropometry platform',
    demo: 'SAMPLE ANALYSIS',
    demoNote: 'Interface preview · not real patient data',
    profile: 'Growth profile',
    overview: 'Overview',
    growth: 'Growth',
    quality: 'Data quality',
    height: 'Height',
    weight: 'Weight',
    measured: 'Measured',
    calculated: 'Calculated',
    chart: 'Growth over time',
    chartNote: 'Illustrative repeated measurements',
    months: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
    checked: 'Measurements entered',
    qualityNote: 'The source of each value is shown alongside results.',
    report: 'A clear report',
    reportNote: 'From measurement to insight',
    strip: [
      'Anthropometric analysis',
      'Growth monitoring',
      'Scientific research',
      'PDF · DOCX · Excel',
    ],
    section: 'CARE FOR PEOPLE. CLARITY IN DATA.',
    sectionTitle: 'Complex analysis.',
    sectionAccent: 'Simple experience.',
    sectionDesc:
      'A thoughtful workspace for clinicians and researchers at every step.',
    features: [
      [
        'Organized measurements',
        'Enter essential and detailed measurements step by step. Check units and data quality in one place.',
      ],
      [
        'Visible development',
        'Explore height, weight and BMI with clear growth visualizations.',
      ],
      [
        'Results ready to share',
        'Review your analysis and download the available report formats.',
      ],
    ],
    process: 'THREE SIMPLE STEPS',
    processTitle: 'From careful measurement to useful insight.',
    steps: [
      [
        'Enter measurements',
        'Add age, gender and measured anthropometric values.',
      ],
      [
        'Review the results',
        'Check key indicators and the quality of your data.',
      ],
      [
        'Save your report',
        'Download results and compare with future measurements.',
      ],
    ],
    trust: 'A responsible approach to your data',
    trustDesc:
      'Consent management and role-based access support an organized workflow.',
    privacy: 'About privacy',
    cta: 'Every step toward better understanding.',
    ctaDesc: 'Give your measurements meaning. Start with MorphoCheck.',
  },
  ru: {
    eyebrow: 'НАУКА И ЗДОРОВЬЕ',
    title: 'Каждое измерение.',
    accent: 'Больше возможностей.',
    desc: 'Понимайте рост и развитие глубже. Антропометрия, расчёты и понятные результаты на одной платформе.',
    start: 'Начать',
    explore: 'Как это работает',
    tag: 'Цифровая антропометрия',
    demo: 'ПРИМЕР АНАЛИЗА',
    demoNote: 'Образец интерфейса · не данные пациента',
    profile: 'Профиль роста',
    overview: 'Обзор',
    growth: 'Динамика',
    quality: 'Качество данных',
    height: 'Рост',
    weight: 'Вес',
    measured: 'Измерено',
    calculated: 'Рассчитано',
    chart: 'Динамика роста',
    chartNote: 'Пример повторных измерений',
    months: ['Янв', 'Мар', 'Май', 'Июл', 'Сен'],
    checked: 'Измерения введены',
    qualityNote: 'Источник значений отображается вместе с результатами.',
    report: 'Понятный отчёт',
    reportNote: 'От измерений к результатам',
    strip: [
      'Антропометрия',
      'Мониторинг роста',
      'Исследования',
      'PDF · DOCX · Excel',
    ],
    section: 'ЗАБОТА О ЛЮДЯХ. ТОЧНОСТЬ ДАННЫХ.',
    sectionTitle: 'Сложный анализ.',
    sectionAccent: 'Простой процесс.',
    sectionDesc: 'Удобная рабочая среда для врачей и исследователей.',
    features: [
      [
        'Измерения по порядку',
        'Вводите измерения пошагово, проверяйте единицы и качество данных.',
      ],
      [
        'Развитие наглядно',
        'Изучайте рост, вес и ИМТ с помощью понятных графиков.',
      ],
      [
        'Отчёты готовы',
        'Просматривайте результаты и скачивайте доступные форматы отчётов.',
      ],
    ],
    process: 'ТРИ ШАГА',
    processTitle: 'От измерения к полезному результату.',
    steps: [
      ['Введите данные', 'Добавьте возраст, пол и измеренные значения.'],
      ['Проверьте результаты', 'Изучите показатели и качество данных.'],
      [
        'Сохраните отчёт',
        'Скачайте результаты и сравните с будущими измерениями.',
      ],
    ],
    trust: 'Ответственный подход к данным',
    trustDesc: 'Управление согласием и доступом на основе ролей.',
    privacy: 'Конфиденциальность',
    cta: 'Каждый шаг к лучшему пониманию.',
    ctaDesc: 'Начните работу с MorphoCheck.',
  },
};

function GrowthPreview({ c, tall = false }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`welcome-chart ${tall ? 'welcome-chart-tall' : ''}`}>
      <div className="welcome-chart-heading">
        <div>
          <strong>{c.chart}</strong>
          <span>{c.chartNote}</span>
        </div>
        <span className="welcome-unit">cm</span>
      </div>
      <svg viewBox="0 0 440 160" role="img" aria-label={c.chartNote}>
        <defs>
          <linearGradient id="welcome-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity=".2" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 70, 110, 150].map((y, i) => (
          <g key={y}>
            <line
              x1="35"
              y1={y}
              x2="428"
              y2={y}
              stroke="currentColor"
              opacity=".09"
              strokeDasharray="4 5"
            />
            <text
              x="0"
              y={y + 4}
              fill="currentColor"
              opacity=".55"
              fontSize="10"
            >
              {145 - i * 5}
            </text>
          </g>
        ))}
        <path
          d="M40 134 C100 132 110 115 138 107 S205 95 235 83 S299 65 330 55 S390 34 420 22 L420 150 L40 150Z"
          fill="url(#welcome-chart-fill)"
        />
        <motion.path
          d="M40 134 C100 132 110 115 138 107 S205 95 235 83 S299 65 330 55 S390 34 420 22"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 1.6,
            ease: 'easeInOut',
            delay: 0.3,
          }}
          fill="none"
          stroke="#188878"
          strokeWidth="3"
        />
        {[
          [40, 134],
          [138, 107],
          [235, 83],
          [330, 55],
          [420, 22],
        ].map(([x, y]) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r="4.5"
            fill="#188878"
            stroke="var(--welcome-paper)"
            strokeWidth="3"
          />
        ))}
      </svg>
      <div className="welcome-chart-months">
        {c.months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export default function IntroPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const navigate = useNavigate();
  const c = copy[lang] || {
    ...copy.en,
    start: t('enterSystem'),
    desc: t('heroDesc'),
  };
  const [tab, setTab] = useState('overview');
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 22 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 25 });
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 32, filter: 'blur(6px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, amount: 0.15 },
    transition: {
      duration: reduceMotion ? 0 : 0.8,
      delay: reduceMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  });
  const movePreview = (event) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };
  const start = () =>
    navigate(
      user?.role === 'researcher' || user?.role === 'field_assistant'
        ? '/researcher'
        : '/morphocheck-pro'
    );
  const icons = [ClipboardList, TrendingUp, FileText];

  return (
    <main
      className="welcome-page"
      data-mode={mode}
      data-motion={reduceMotion ? 'reduced' : 'full'}
    >
      <div className="welcome-motion-backdrop" aria-hidden="true">
        <TubesBackground variant="welcome" />
        <div className="welcome-aurora welcome-aurora-one" />
        <div className="welcome-aurora welcome-aurora-two" />
        <div className="welcome-background-veil" />
      </div>
      <motion.div
        className="welcome-scroll-progress"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
      <section
        className="welcome-hero welcome-container"
        aria-labelledby="welcome-title"
        onPointerMove={movePreview}
        onPointerLeave={() => {
          pointerX.set(0);
          pointerY.set(0);
        }}
      >
        <div className="welcome-hero-copy">
          <motion.div className="welcome-eyebrow" {...reveal(0.05)}>
            <span className="welcome-status-dot" />
            {c.eyebrow}
          </motion.div>
          <motion.h1 id="welcome-title" {...reveal(0.15)}>
            {c.title}
            <br />
            <span>{c.accent}</span>
          </motion.h1>
          <motion.p className="welcome-lead" {...reveal(0.28)}>
            {c.desc}
          </motion.p>
          <motion.div className="welcome-actions" {...reveal(0.4)}>
            <button type="button" className="welcome-primary" onClick={start}>
              {c.start}
              <ArrowUpRight size={20} />
            </button>
            <a href="#welcome-process" className="welcome-secondary">
              {c.explore}
              <ArrowRight size={18} />
            </a>
            <button
              type="button"
              className="welcome-author-button"
              onClick={() => navigate('/author')}
            >
              <UserRound size={18} />
              {t('aboutAuthor')}
            </button>
          </motion.div>
          <motion.div className="welcome-hero-foot" {...reveal(0.5)}>
            <span className="welcome-mini-mark">
              <Activity size={19} />
            </span>
            <span>{c.tag}</span>
            <span className="welcome-version">PRO</span>
          </motion.div>
        </div>
        <motion.div
          className="welcome-showcase"
          {...reveal(0.25)}
          style={
            reduceMotion
              ? undefined
              : { rotateX, rotateY, transformPerspective: 1200 }
          }
        >
          <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
          <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />
          <div className="welcome-dashboard-float">
            <div className="welcome-dashboard">
              <div className="welcome-dashboard-top">
                <span>
                  <Activity size={18} /> MorphoCheck <b>Pro</b>
                </span>
                <span className="welcome-demo-badge">{c.demo}</span>
              </div>
              <div className="welcome-profile">
                <span className="welcome-profile-icon">
                  <Fingerprint size={28} />
                </span>
                <div>
                  <h2>{c.profile}</h2>
                  <p>{c.reportNote}</p>
                </div>
                <span className="welcome-profile-check">
                  <Check size={17} />
                </span>
              </div>
              <div
                className="welcome-tabs"
                role="tablist"
                aria-label={c.profile}
              >
                {['overview', 'growth', 'quality'].map((key) => (
                  <button
                    key={key}
                    id={`welcome-tab-${key}`}
                    aria-controls="welcome-preview-panel"
                    role="tab"
                    aria-selected={tab === key}
                    type="button"
                    onClick={() => setTab(key)}
                  >
                    {c[key]}
                  </button>
                ))}
              </div>
              <div
                id="welcome-preview-panel"
                role="tabpanel"
                aria-labelledby={`welcome-tab-${tab}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={tab}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  >
                    {tab === 'overview' && (
                      <>
                        <div className="welcome-metrics">
                          {[
                            [c.height, '138', 'cm', c.measured],
                            [c.weight, '32', 'kg', c.measured],
                            ['BMI', '16.8', 'kg/m²', c.calculated],
                          ].map(([label, value, unit, source]) => (
                            <div key={label}>
                              <span>{label}</span>
                              <strong>
                                {value}
                                <small>{unit}</small>
                              </strong>
                              <em>{source}</em>
                            </div>
                          ))}
                        </div>
                        <GrowthPreview c={c} />
                      </>
                    )}
                    {tab === 'growth' && <GrowthPreview c={c} tall />}
                    {tab === 'quality' && (
                      <div className="welcome-quality-preview">
                        <ShieldCheck size={36} />
                        <h3>{c.checked}</h3>
                        <p>{c.qualityNote}</p>
                        {[c.height, c.weight, 'BMI'].map((v, i) => (
                          <div key={v}>
                            <span>{v}</span>
                            <span>
                              <Check size={14} />
                              {i === 2 ? c.calculated : c.measured}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="welcome-preview-note">
                <span className="welcome-status-dot" />
                {c.demoNote}
              </div>
            </div>
          </div>
          <div className="welcome-floating-note">
            <span>
              <FileText size={22} />
            </span>
            <div>
              <strong>{c.report}</strong>
              <small>PDF · DOCX · Excel</small>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <span className="welcome-spark" aria-hidden="true">
            ✳
          </span>
        </motion.div>
      </section>
      <div className="welcome-capabilities">
        <div className="welcome-container">
          {c.strip.map((label, i) => {
            const Icon = [Activity, TrendingUp, Microscope, FileText][i];
            return (
              <span key={label}>
                <Icon size={19} />
                {label}
              </span>
            );
          })}
        </div>
      </div>
      <WelcomeBmiCalculator />
      <section
        className="welcome-features welcome-container"
        aria-labelledby="welcome-features-title"
      >
        <div className="welcome-section-heading">
          <div>
            <p className="welcome-eyebrow">{c.section}</p>
            <h2 id="welcome-features-title">
              {c.sectionTitle}
              <br />
              <span>{c.sectionAccent}</span>
            </h2>
          </div>
          <p>{c.sectionDesc}</p>
        </div>
        <div className="welcome-feature-grid">
          {c.features.map(([title, desc], i) => {
            const Icon = icons[i];
            return (
              <motion.article
                key={title}
                {...reveal(i * 0.12)}
                className={`welcome-feature welcome-feature-${i}`}
              >
                <div className="welcome-feature-top">
                  <span className="welcome-feature-icon">
                    <Icon size={25} />
                  </span>
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="welcome-feature-line" aria-hidden="true" />
              </motion.article>
            );
          })}
        </div>
      </section>
      <section
        id="welcome-process"
        className="welcome-process welcome-container"
        aria-labelledby="welcome-process-title"
      >
        <p className="welcome-eyebrow">{c.process}</p>
        <h2 id="welcome-process-title">{c.processTitle}</h2>
        <div className="welcome-steps">
          {c.steps.map(([title, desc], i) => (
            <motion.article key={title} {...reveal(i * 0.14)}>
              <span className="welcome-step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <motion.section className="welcome-trust welcome-container" {...reveal()}>
        <div className="welcome-trust-icon">
          <ShieldCheck size={30} />
        </div>
        <div>
          <h3>{c.trust}</h3>
          <p>{c.trustDesc}</p>
        </div>
        <button type="button" onClick={() => navigate('/privacy-compliance')}>
          {c.privacy}
          <ArrowUpRight size={17} />
        </button>
      </motion.section>
      <motion.section className="welcome-cta welcome-container" {...reveal()}>
        <Leaf size={32} />
        <h2>{c.cta}</h2>
        <p>{c.ctaDesc}</p>
        <button type="button" className="welcome-primary" onClick={start}>
          {c.start}
          <ArrowUpRight size={20} />
        </button>
        <span className="welcome-cta-ring" aria-hidden="true" />
      </motion.section>
    </main>
  );
}
