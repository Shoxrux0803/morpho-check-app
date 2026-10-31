export function totalAgeMonths(data = {}) {
  const explicit = data.ageTotalMonths ?? data.age_total_months;
  if (explicit !== undefined && explicit !== null && explicit !== '') {
    const value = Number(explicit);
    return Number.isFinite(value) ? value : null;
  }
  if (data.age === undefined || data.age === null || data.age === '')
    return null;
  const value =
    Number(data.age) * 12 +
    Number(data.ageMonths ?? data.age_months ?? 0) +
    Number(data.ageDays ?? data.age_days ?? 0) / 30.4375;
  return Number.isFinite(value) ? value : null;
}

export function formatAgeMonths(data) {
  const value = totalAgeMonths(data);
  return value === null ? '' : String(Number(value.toFixed(6)));
}
