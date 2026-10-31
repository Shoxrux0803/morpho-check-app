export const MEASUREMENT_REVIEW_VERSION = 'measurement-review-1.0';

const number = (value) =>
  value === '' || value == null ? null : Number(value);

// Structural checks only: these messages are requests to review source data,
// not clinical classifications or population reference intervals.
export function reviewMeasurements(data = {}) {
  const height = number(data.height ?? data.chest_standing_height);
  const weight = number(data.weight);
  const issues = [];
  const missing = [];
  const fields = [
    ['height', height, 'cm'],
    ['weight', weight, 'kg'],
    ['shoulder', number(data.shoulderBreadth ?? data.shoulder_width), 'cm'],
    [
      'thigh',
      number(data.thighCircumference ?? data.thigh_circumference),
      'cm',
    ],
  ];
  fields.forEach(([key, value, unit]) => {
    if (value == null) {
      if (key === 'height' || key === 'weight') missing.push(key);
    } else if (!Number.isFinite(value) || value <= 0)
      issues.push({ key, reason: 'positive', unit });
  });
  if (height > 0) {
    fields.slice(2).forEach(([key, value, unit]) => {
      if (value > height) issues.push({ key, reason: 'unit', unit });
    });
  }
  if (height > 250) issues.push({ key: 'height', reason: 'unit', unit: 'cm' });
  if (weight > 300) issues.push({ key: 'weight', reason: 'unit', unit: 'kg' });
  const bmi =
    height > 0 &&
    weight > 0 &&
    Number.isFinite(height) &&
    Number.isFinite(weight)
      ? weight / (height / 100) ** 2
      : null;
  return { issues, missing, bmi, version: MEASUREMENT_REVIEW_VERSION };
}
