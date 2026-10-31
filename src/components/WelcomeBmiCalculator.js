import React, { useState } from 'react';
import { Activity, Calculator, Info, RotateCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/welcome-bmi.css';

const copy = {
  uz: {
    eyebrow: 'O‘ZINGIZ SINAB KO‘RING',
    heading: 'Kichik o‘lchov.',
    accent: 'Bir zumda hisob.',
    description:
      'Yosh, bo‘y va vaznni slayderlar orqali o‘zgartiring. Tana massasi indeksi avtomatik hisoblanadi.',
    title: 'Antropometrik BMI kalkulyatori',
    sample: 'Namuna',
    age: 'Bolaning yoshi',
    height: 'Bo‘yi',
    weight: 'Vazni',
    years: 'yosh',
    cm: 'sm',
    kg: 'kg',
    result: 'Hisoblangan tana massasi indeksi (BMI)',
    formula: 'BMI = vazn (kg) / bo‘y (m)²',
    reset: 'Qayta boshlash',
    note: 'Bu oddiy hisoblash namunasi. Yosh BMI formulasiga kirmaydi. Bolalarda natijani baholash uchun yosh, jins va tegishli o‘sish standartlari kerak.',
  },
  en: {
    eyebrow: 'TRY IT YOURSELF',
    heading: 'A simple measurement.',
    accent: 'An instant calculation.',
    description:
      'Adjust age, height and weight with the sliders. Body mass index updates automatically.',
    title: 'Anthropometric BMI calculator',
    sample: 'Sample',
    age: 'Child’s age',
    height: 'Height',
    weight: 'Weight',
    years: 'years',
    cm: 'cm',
    kg: 'kg',
    result: 'Calculated body mass index (BMI)',
    formula: 'BMI = weight (kg) / height (m)²',
    reset: 'Reset values',
    note: 'This is a calculation example. Age is not part of the BMI formula. Assessing a child’s result requires age, sex and appropriate growth references.',
  },
  ru: {
    eyebrow: 'ПОПРОБУЙТЕ САМИ',
    heading: 'Простое измерение.',
    accent: 'Мгновенный расчёт.',
    description:
      'Изменяйте возраст, рост и вес с помощью ползунков. Индекс массы тела рассчитывается автоматически.',
    title: 'Антропометрический калькулятор ИМТ',
    sample: 'Пример',
    age: 'Возраст ребёнка',
    height: 'Рост',
    weight: 'Вес',
    years: 'лет',
    cm: 'см',
    kg: 'кг',
    result: 'Рассчитанный индекс массы тела (ИМТ)',
    formula: 'ИМТ = вес (кг) / рост (м)²',
    reset: 'Сбросить значения',
    note: 'Это пример расчёта. Возраст не входит в формулу ИМТ. Для оценки результата ребёнка нужны возраст, пол и соответствующие стандарты роста.',
  },
};

const defaults = { age: 6, height: 125, weight: 30 };

export default function WelcomeBmiCalculator() {
  const { lang } = useLanguage();
  const c = copy[lang] || copy.en;
  const [values, setValues] = useState(defaults);
  const bmi = (values.weight / (values.height / 100) ** 2).toFixed(2);
  const fields = [
    { key: 'age', min: 2, max: 18, step: 1, unit: c.years },
    { key: 'height', min: 70, max: 200, step: 1, unit: c.cm },
    { key: 'weight', min: 5, max: 120, step: 0.5, unit: c.kg },
  ];

  return (
    <section
      className="welcome-bmi welcome-container"
      aria-labelledby="welcome-bmi-heading"
    >
      <div className="welcome-bmi-intro">
        <p className="welcome-eyebrow">
          <Calculator size={16} />
          {c.eyebrow}
        </p>
        <h2 id="welcome-bmi-heading">
          {c.heading}
          <br />
          <span>{c.accent}</span>
        </h2>
        <p className="welcome-bmi-description">{c.description}</p>
        <div className="welcome-bmi-formula">
          <Activity size={18} />
          <span>{c.formula}</span>
        </div>
      </div>
      <div className="welcome-bmi-card">
        <div className="welcome-bmi-header">
          <h3>{c.title}</h3>
          <span className="welcome-bmi-badge">{c.sample}</span>
        </div>
        <div className="welcome-bmi-fields">
          {fields.map(({ key, min, max, step, unit }) => (
            <div className="welcome-bmi-field" key={key}>
              <div className="welcome-bmi-label">
                <label htmlFor={`welcome-bmi-${key}`}>{c[key]}</label>
                <output htmlFor={`welcome-bmi-${key}`}>
                  {values[key]} <span>{unit}</span>
                </output>
              </div>
              <input
                id={`welcome-bmi-${key}`}
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[key]}
                aria-valuetext={`${values[key]} ${unit}`}
                style={{
                  '--bmi-progress': `${((values[key] - min) / (max - min)) * 100}%`,
                }}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: Number(event.target.value),
                  }))
                }
              />
              <div className="welcome-bmi-limits" aria-hidden="true">
                <span>
                  {min} {unit}
                </span>
                <span>
                  {max} {unit}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="welcome-bmi-result"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{c.result}</span>
          <strong>{bmi}</strong>
          <span className="welcome-bmi-unit">kg/m²</span>
        </div>
        <div className="welcome-bmi-footer">
          <p>
            <Info size={16} aria-hidden="true" />
            <span>{c.note}</span>
          </p>
          <button type="button" onClick={() => setValues(defaults)}>
            <RotateCcw size={14} />
            {c.reset}
          </button>
        </div>
      </div>
    </section>
  );
}
