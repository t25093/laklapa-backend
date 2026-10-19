const BUSINESS_TIME_ZONE = "Asia/Jerusalem";

/** התאריך של היום (לפי שעון ישראל) בפורמט YYYY-MM-DD */
export function todayInIsrael(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** מוסיף ימים לתאריך בפורמט YYYY-MM-DD */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** האם המחרוזת היא תאריך אמיתי בפורמט YYYY-MM-DD */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** ממיר YYYY-MM-DD לאובייקט Date לשמירה בעמודת DATE */
export function isoDateToDb(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** ממיר ערך מעמודת DATE חזרה ל-YYYY-MM-DD */
export function dbDateToIso(value: Date): string {
  return value.toISOString().slice(0, 10);
}
