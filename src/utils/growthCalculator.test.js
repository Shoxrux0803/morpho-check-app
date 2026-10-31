import {
  calculateZScore,
  getZScoreStatus,
  zToPercentile,
} from './growthCalculator';

describe('growthCalculator reference boundaries', () => {
  test('matches the supplied v6 fractional-age workbook case', () => {
    const age = 47.788501;
    expect(calculateZScore('height', 101.12, 'boys', age)).toBe(-0.5);
    expect(calculateZScore('weight', 13.48, 'boys', age)).toBe(-1.51);
    expect(calculateZScore('bmi', 13.48 / 1.0112 ** 2, 'boys', age)).toBe(
      -1.89
    );
  });

  test('uses restricted BAZ extrapolation for the low-BMI workbook case', () => {
    expect(
      calculateZScore('bmi', 12.78 / 1.0608 ** 2, 'boys', 47.9856263)
    ).toBe(-3.77);
  });

  test('does not reuse the last LMS row outside its age range', () => {
    expect(calculateZScore('height', 180, 'boys', 241)).toBeNull();
    expect(calculateZScore('height', 50, 'boys', -1)).toBeNull();
  });

  test('marks missing results as insufficient data', () => {
    expect(getZScoreStatus(null).code).toBe('insufficient_data');
    expect(getZScoreStatus(undefined).code).toBe('insufficient_data');
    expect(zToPercentile(null)).toBeNull();
  });
});
