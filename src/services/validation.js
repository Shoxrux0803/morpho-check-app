export function validateForm(formData) {
  const errors = [];
  if (!formData.firstName || !formData.lastName) errors.push("Ism va familiyani kiriting");
  if (!formData.region || !formData.address) errors.push("Viloyat va manzilni kiriting");
  if (formData.age < 2 || formData.age > 120) errors.push("Yosh 2-120 oralig'ida bo'lishi kerak");
  if (formData.height < 50 || formData.height > 250)
    errors.push("Bo'y 50-250 sm oralig'ida bo'lishi kerak");
  if (formData.weight < 3 || formData.weight > 300)
    errors.push("Vazn 3-300 kg oralig'ida bo'lishi kerak");
  if (formData.chest < 50 || formData.chest > 200)
    errors.push("Ko'krak aylanasi 50-200 sm oralig'ida bo'lishi kerak");
  if (formData.head < 40 || formData.head > 70)
    errors.push("Bosh aylanasi 40-70 sm oralig'ida bo'lishi kerak");

  return errors;
}
