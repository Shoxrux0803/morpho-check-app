import { LMS_DATA } from './whoLMS';
import WHO_V6 from '../data/whoLmsV6.json';

const V6_INDICATORS = { height: 'HFA', weight: 'WFA', bmi: 'BFA' };
const V6_SEX = { boys: 'male', girls: 'female' };

/**
 * Interpolates LMS values between age points
 */
const getLMS = (type, gender, ageInMonths) => {
  const useV6 = ageInMonths >= 30 && ageInMonths <= 90;
  const data = useV6
    ? WHO_V6.filter(
        (row) =>
          row.sex === V6_SEX[gender] && row.indicator === V6_INDICATORS[type]
      ).map((row) => [row.month, row.L, row.M, row.S])
    : LMS_DATA[gender]?.[type];
  if (!data || !Number.isFinite(ageInMonths) || data.length === 0) return null;

  // Never extrapolate clinical reference data.  Returning the first/last row
  // made an out-of-range child look as if the reference applied to them.
  if (ageInMonths < data[0][0] || ageInMonths > data[data.length - 1][0]) {
    return null;
  }

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

  if (!lower && upper) return null;
  if (lower && !upper) return null;
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
  if (!lms || !Number.isFinite(value) || value <= 0) return null;

  const { l, m, s } = lms;
  let z;

  if (l === 0) {
    z = Math.log(value / m) / s;
  } else {
    z = (Math.pow(value / m, l) - 1) / (l * s);
  }

  if (['weight', 'bmi'].includes(type) && Math.abs(z) > 3) {
    const measurement = (sd) =>
      l === 0 ? m * Math.exp(s * sd) : m * Math.pow(1 + l * s * sd, 1 / l);
    z =
      z > 3
        ? 3 + (value - measurement(3)) / (measurement(3) - measurement(2))
        : -3 + (value - measurement(-3)) / (measurement(-2) - measurement(-3));
  }

  return parseFloat(z.toFixed(2));
};

/**
 * Returns percentile corresponding to a Z-score
 */
export const zToPercentile = (z) => {
  if (!Number.isFinite(z)) return null;
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
  if (!Number.isFinite(z)) {
    return {
      color: '#64748b',
      status: 'Insufficient data',
      code: 'insufficient_data',
    };
  }
  const absZ = Math.abs(z);
  if (absZ < 1) return { color: '#10b981', status: 'Normal', code: 'normal' }; // Green
  if (absZ < 2) return { color: '#f59e0b', status: 'Monitor', code: 'monitor' }; // Yellow
  if (absZ < 3) return { color: '#ef4444', status: 'Risk', code: 'risk' }; // Red
  return { color: '#991b1b', status: 'Severe', code: 'severe' }; // Dark Red
};
