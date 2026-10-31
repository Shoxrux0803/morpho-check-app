import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, Ruler, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const content = {
  uz: {
    workspace: 'TAHLIL MAYDONI',
    title: 'Aniq o‘lchov.',
    accent: 'Tushunarli natija.',
    description:
      'Ma’lumotlarni bosqichma-bosqich kiriting. O‘sish va tana ko‘rsatkichlarini bir joyda tahlil qiling.',
    resultTitle: 'Natijalar tayyor.',
    resultAccent: 'Har bir ko‘rsatkich muhim.',
    resultDescription:
      'O‘lchovlar, rivojlanish dinamikasi va hisoblangan ko‘rsatkichlarni ko‘rib chiqing.',
    measurement: 'Antropometriya',
    privacy: 'Ma’lumotlar maxfiyligi',
    profile: 'O‘LCHOVDAN TAHLILGA',
  },
  ru: {
    workspace: 'РАБОЧАЯ ОБЛАСТЬ',
    title: 'Точные измерения.',
    accent: 'Понятные результаты.',
    description:
      'Заполните данные шаг за шагом. Анализируйте рост и показатели тела в одном месте.',
    resultTitle: 'Результаты готовы.',
    resultAccent: 'Каждый показатель важен.',
    resultDescription:
      'Изучите измерения, динамику развития и рассчитанные показатели.',
    measurement: 'Антропометрия',
    privacy: 'Конфиденциальность данных',
    profile: 'ОТ ИЗМЕРЕНИЙ К АНАЛИЗУ',
  },
  en: {
    workspace: 'ANALYSIS WORKSPACE',
    title: 'Precise measurements.',
    accent: 'Clear insights.',
    description:
      'Enter your data step by step. Explore growth and body measurements in one place.',
    resultTitle: 'Your results are ready.',
    resultAccent: 'Every measurement matters.',
    resultDescription:
      'Review measurements, growth patterns and calculated indicators.',
    measurement: 'Anthropometry',
    privacy: 'Data privacy',
    profile: 'FROM MEASUREMENT TO INSIGHT',
  },
};

export default function AnalysisPageHeader({ showingResults }) {
  const { lang } = useLanguage();
  const c = content[lang] || content.en;
  const reduced = useReducedMotion();
  return (
    <motion.header
      className="analysis-intro"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="analysis-intro-copy">
        <div className="analysis-eyebrow">
          <span className="analysis-live-dot" />
          MORPHOCHECK PRO <span className="analysis-eyebrow-divider">/</span>
          {c.workspace}
        </div>
        <h1>
          {showingResults ? c.resultTitle : c.title}
          <span>{showingResults ? c.resultAccent : c.accent}</span>
        </h1>
        <p>{showingResults ? c.resultDescription : c.description}</p>
        <div className="analysis-intro-tags">
          <span>
            <Ruler size={15} />
            {c.measurement}
          </span>
          <span>
            <ShieldCheck size={15} />
            {c.privacy}
          </span>
        </div>
      </div>
      <div className="analysis-art" aria-hidden="true">
        <div className="analysis-art-grid" />
        <div className="analysis-art-ring analysis-art-ring-outer" />
        <div className="analysis-art-ring analysis-art-ring-inner" />
        <div className="analysis-art-core">
          <Activity size={34} strokeWidth={1.5} />
        </div>
        <div className="analysis-art-node analysis-art-node-one">
          <Ruler size={18} />
        </div>
        <div className="analysis-art-node analysis-art-node-two">
          <ShieldCheck size={18} />
        </div>
        <svg className="analysis-art-wave" viewBox="0 0 300 100" fill="none">
          <path d="M0 52H52L67 42L81 61L99 22L119 80L140 36L153 52H205L225 42L242 52H300" />
        </svg>
        <span className="analysis-art-caption">
          {c.profile}
          <ArrowUpRight size={13} />
        </span>
      </div>
    </motion.header>
  );
}
