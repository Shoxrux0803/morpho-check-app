import { totalAgeMonths, formatAgeMonths } from './ageMonths';

test('preserves total months instead of treating them as years or remainder months', () => {
  expect(
    totalAgeMonths({
      age_total_months: 47.788501,
      age: 3,
      age_months: 11,
      age_days: 24,
    })
  ).toBe(47.788501);
  expect(formatAgeMonths({ ageTotalMonths: 47.788501 })).toBe('47.788501');
  expect(totalAgeMonths({ age: 3, ageMonths: 11 })).toBe(47);
  expect(totalAgeMonths({ age: 3, ageMonths: 11, ageDays: 24 })).toBeCloseTo(
    47 + 24 / 30.4375,
    10
  );
});

test('handles zero and missing ages explicitly', () => {
  expect(totalAgeMonths({ age: 0, ageMonths: 6 })).toBe(6);
  expect(totalAgeMonths({})).toBeNull();
  expect(formatAgeMonths({ age: '' })).toBe('');
});
