import { LMS_DATA } from './whoLMS';

/**
 * Interpolates LMS values between age points
 */
const getLMS = (type, gender, ageInMonths) => {
  const data = LMS_DATA[gender]?.[type];
  if (!data) return null;

  // Find exact match or bounding points
  let lower = null;
  let upper = null;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === ageInMonths)
      return { l: data[i][1], m: data[i][2], s: data[i][3] };
    if (data[i][0] < ageInMonths) lower = data[i];
    if (data[i][0] > ageInMonths) {
      upper = data[i];
      break;
    }
  }

  if (!lower && upper) return { l: upper[1], m: upper[2], s: upper[3] };
  if (lower && !upper) return { l: lower[1], m: lower[2], s: lower[3] };
  if (!lower && !upper) return null;

  // Linear interpolation
  const [t1, l1, m1, s1] = lower;
  const [t2, l2, m2, s2] = upper;

  const fraction = (ageInMonths - t1) / (t2 - t1);

  return {
    l: l1 + fraction * (l2 - l1),
    m: m1 + fraction * (m2 - m1),
    s: s1 + fraction * (s2 - s1),
  };
};

/**
 * Calculates Z-score using LMS formula: Z = [((y/M)^L) - 1] / (L * S)
 * If L=0: Z = ln(y/M) / S
 */
export const calculateZScore = (type, value, gender, ageInMonths) => {
  const lms = getLMS(type, gender, ageInMonths);
  if (!lms || !value) return null;

  const { l, m, s } = lms;
  let z;

  if (Math.abs(l) < 0.01) {
    z = Math.log(value / m) / s;
  } else {
    z = (Math.pow(value / m, l) - 1) / (l * s);
  }

  return parseFloat(z.toFixed(2));
};

/**
 * Returns percentile corresponding to a Z-score
 */
export const zToPercentile = (z) => {
  if (z === null) return null;
  // Standard normal cumulative distribution function approximation
  const p = 0.5 * (1 + Math.sign(z) * erf(Math.abs(z) / Math.sqrt(2)));
  return Math.round(p * 100);
};

// Error function approximation
function erf(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return y;
}

/**
 * Returns status color and text based on Z-score
 */
export const getZScoreStatus = (z) => {
  const absZ = Math.abs(z);
  if (absZ < 1) return { color: '#10b981', status: 'Normal', code: 'normal' }; // Green
  if (absZ < 2) return { color: '#f59e0b', status: 'Monitor', code: 'monitor' }; // Yellow
  if (absZ < 3) return { color: '#ef4444', status: 'Risk', code: 'risk' }; // Red
  return { color: '#991b1b', status: 'Severe', code: 'severe' }; // Dark Red
};
