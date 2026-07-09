function calculateDynamicPrice(dateStr, timeStr) {
  const date = new Date(`${dateStr}T${timeStr}`);
  const day = date.getDay();
  const hour = parseInt(timeStr.split(':')[0], 10);
  const base = 5;

  const isWeekend = day === 0 || day === 6;
  const isPeakEvening = hour >= 18 && hour <= 21;
  const isWeekdayLunch = day >= 1 && day <= 5 && hour >= 11 && hour <= 14;

  if (isWeekend && isPeakEvening) {
    return { amount: 12, base, label: 'Peak Weekend Evening', tier: 'peak_weekend', discount: 0, surcharge: 140 };
  }
  if (isWeekend) {
    return { amount: 8, base, label: 'Weekend Rate', tier: 'weekend', discount: 0, surcharge: 60 };
  }
  if (isPeakEvening) {
    return { amount: 10, base, label: 'Peak Hour', tier: 'peak', discount: 0, surcharge: 100 };
  }
  if (isWeekdayLunch) {
    return { amount: 3, base, label: 'Weekday Lunch Discount', tier: 'discount', discount: 40, surcharge: 0 };
  }
  return { amount: base, base, label: 'Standard Rate', tier: 'standard', discount: 0, surcharge: 0 };
}

module.exports = { calculateDynamicPrice };
