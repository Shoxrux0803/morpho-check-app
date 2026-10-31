import { reviewMeasurements } from './measurementQuality';
import curves from '../data/who2007Charts.json';

test('missing and invalid values are reviewed without changing inputs', () => {
  const data = { height: '150', weight: '45', shoulderBreadth: '160' };
  const result = reviewMeasurements(data);
  expect(result.bmi).toBe(20);
  expect(result.issues).toEqual([
    { key: 'shoulder', reason: 'unit', unit: 'cm' },
  ]);
  expect(data.shoulderBreadth).toBe('160');
  expect(reviewMeasurements({ height: '', weight: null }).missing).toEqual([
    'height',
    'weight',
  ]);
  expect(reviewMeasurements({ height: 'abc', weight: -5 }).issues).toHaveLength(
    2
  );
});

test('official monthly curves keep their supported ranges and source values', () => {
  for (const gender of ['boys', 'girls']) {
    for (const indicator of ['heightForAge', 'bmiForAge', 'weightForAge']) {
      const rows = curves[gender][indicator];
      expect(rows[0].age).toBe(61 / 12);
      expect(rows.at(-1).age).toBe(indicator === 'weightForAge' ? 10 : 19);
      expect(rows.length).toBe(indicator === 'weightForAge' ? 60 : 168);
      expect(
        rows.every((row) => row.sd3neg < row.median && row.median < row.sd3pos)
      ).toBe(true);
    }
  }
  expect(curves.boys.weightForAge[0].median).toBe(18.506);
  expect(curves.metadata.sources['boys.weightForAge']).toContain('cdn.who.int');
});
