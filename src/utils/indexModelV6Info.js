const formulas = {
  HMAI: 'AM=100[1−min(1,(|HAZ|+|BAZ|)/6)]; GM=100[1−min(1,|HAZ−WAZ|/3)]; HMAI=(AM+GM)/2',
  MII: 'MII=100[1−(d(zFMI)+d(zFFMI)+d(zFMI−zFFMI))/3]',
  ADI: 'ADI=100[d(zlnTh)+d(zlnCa)+d(zlnAr)]/3',
  MCRI: 'MCRI=0.30R(BAZ)+0.30R(zFMI)+0.20R(−zFFMI)+0.10ADI+0.10(100−MII)',
};

const meanings = {
  uz: {
    HMAI: 'WHO bo‘y, vazn va BMI referensiga yaqinlik. Yuqori ball referensga yaqinroq natijani bildiradi.',
    MII: 'Yosh va jins bo‘yicha standartlashtirilgan FMI va FFMI komponentlarining mutanosibligi.',
    ADI: 'Bo‘yga nisbatan son, boldir va yelka aylanalari logarifmlarining standartlashtirilgan og‘ishi.',
    MCRI: 'Musbat BAZ va FMI og‘ishi, FFMI tanqisligi, ADI hamda teskari MII ning vaznlangan yig‘indisi.',
    note: 'V6.0: 30–90 oy, 0–100 ball. Tadqiqot modeli, mustaqil klinik validatsiya o‘tkazilmagan. FFM va aylana o‘lchovlari yetishmasa, tegishli indeks hisoblanmaydi.',
  },
  ru: {
    HMAI: 'Близость к референсу WHO по росту, весу и BMI. Более высокий балл означает большую близость к референсу.',
    MII: 'Согласованность FMI и FFMI после стандартизации по возрасту и полу.',
    ADI: 'Стандартизированные отклонения логарифмов окружностей бедра, голени и плеча относительно роста.',
    MCRI: 'Взвешенная сумма положительных отклонений BAZ и FMI, дефицита FFMI, ADI и обратного MII.',
    note: 'V6.0: 30–90 месяцев, 0–100 баллов. Исследовательская модель без независимой клинической валидации. При отсутствии FFM или окружностей соответствующий индекс не рассчитывается.',
  },
  en: {
    HMAI: 'Closeness to the WHO height, weight and BMI reference. Higher scores indicate closer agreement.',
    MII: 'Harmony of FMI and FFMI after age and sex standardization.',
    ADI: 'Standardized deviations of log thigh, calf and upper arm circumferences relative to height.',
    MCRI: 'Weighted positive BAZ and FMI deviations, FFMI deficit, ADI and inverse MII.',
    note: 'V6.0: 30–90 months, 0–100 points. Research model without independent clinical validation. Missing FFM or circumferences leave the dependent index unavailable.',
  },
};

export function indexModelV6Info(key, lang) {
  const text = meanings[lang] || meanings.en;
  return {
    title: `${key}-6`,
    subtitle: 'v6.0 · 0–100',
    formula: formulas[key],
    meaning: text[key],
    deep: text.note,
    factors:
      key === 'HMAI'
        ? ['HAZ', 'WAZ', 'BAZ', 'K=3']
        : key === 'MII'
          ? ['FMI=(W−FFM)/H²', 'FFMI=FFM/H²', 'd(z)=min(1,|z|/3)']
          : key === 'ADI'
            ? [
                'lnTh=ln(Th/H)',
                'lnCa=ln(Ca/H)',
                'lnAr=ln(Ar/H)',
                'd(z)=min(1,|z|/3)',
              ]
            : ['R(x)=100min(1,max(0,x)/3)', '0.30 / 0.30 / 0.20 / 0.10 / 0.10'],
    zones:
      key === 'ADI'
        ? ['0–<37.5', '37.5–<75', '75–100']
        : key === 'MCRI'
          ? ['0–<30', '30–<50', '50–<70', '70–100']
          : ['0–<40', '40–<60', '60–<80', '80–100'],
  };
}
