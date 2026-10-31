import { totalAgeMonths } from '../utils/ageMonths';
import { useMemo } from 'react';
import {
  calculateZScore,
  getZScoreStatus,
  zToPercentile,
} from '../utils/growthCalculator';

export const useGrowthAnalytics = (formData, canonicalMetrics = null) => {
  return useMemo(() => {
    if (canonicalMetrics) {
      return Object.fromEntries(
        ['height', 'weight', 'bmi']
          .filter((key) => canonicalMetrics[key])
          .map((key) => {
            const metric = canonicalMetrics[key];
            const z = metric.z_score;
            return [
              key,
              {
                value: metric.value,
                zScore: z,
                percentile: metric.percentile,
                status: getZScoreStatus(z),
                source: 'backend',
              },
            ];
          })
      );
    }
    if (!formData.age || !formData.gender) return null;

    // WHO standards use age in months
    const ageInMonths = totalAgeMonths(formData);
    const gender = formData.gender === 'erkak' ? 'boys' : 'girls';

    const results = {};

    // 1. Height-for-age
    if (formData.height) {
      const z = calculateZScore(
        'height',
        Number(formData.height),
        gender,
        ageInMonths
      );
      results.height = {
        zScore: z,
        percentile: zToPercentile(z),
        status: getZScoreStatus(z),
      };
    }

    // 2. Weight-for-age
    if (formData.weight) {
      const z = calculateZScore(
        'weight',
        Number(formData.weight),
        gender,
        ageInMonths
      );
      results.weight = {
        zScore: z,
        percentile: zToPercentile(z),
        status: getZScoreStatus(z),
      };
    }

    // 3. BMI-for-age
    if (formData.height && formData.weight) {
      const hMeters = Number(formData.height) / 100;
      const bmi = Number(formData.weight) / (hMeters * hMeters);
      const z = calculateZScore('bmi', bmi, gender, ageInMonths);
      results.bmi = {
        value: bmi.toFixed(1),
        zScore: z,
        percentile: zToPercentile(z),
        status: getZScoreStatus(z),
      };
    }

    return results;
  }, [formData, canonicalMetrics]);
};
