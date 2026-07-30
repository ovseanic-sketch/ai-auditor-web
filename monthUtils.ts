export const MONTH_NAMES_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function getMonthNameFromDate(dateStr?: string, monthField?: string): string {
  if (monthField && monthField.trim().length > 0) {
    return monthField.trim();
  }
  if (!dateStr) {
    return "Июль 2026";
  }

  const clean = dateStr.trim();
  let year = 2026;
  let monthIndex = 6; // Default July

  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y)) year = y;
      if (!isNaN(m) && m >= 0 && m < 12) monthIndex = m;
    }
  } else if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length >= 3) {
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(y)) year = y;
      if (!isNaN(m) && m >= 0 && m < 12) monthIndex = m;
    }
  }

  return `${MONTH_NAMES_RU[monthIndex]} ${year}`;
}

export function generateMonthOptions(year: number = 2026): string[] {
  return MONTH_NAMES_RU.map((m) => `${m} ${year}`);
}
