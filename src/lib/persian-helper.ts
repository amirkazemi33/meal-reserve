import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import DateObject from "react-date-object";

const TIME_ONLY = /^\d{1,2}:\d{2}$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Convert ISO / YYYY-MM-DD / HH:mm to a Persian DateObject for pickers. */
export function convertISOToDateObject(value: string) {
  if (!value) return null;

  if (TIME_ONLY.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    // Fixed calendar day — avoid `new DateObject()` (= now) which hydrates differently.
    return new DateObject({
      calendar: persian,
      year: 1400,
      month: 1,
      day: 1,
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
    });
  }

  // Noon local avoids timezone day-shift for date-only keys.
  const raw =
    DATE_KEY.test(value) && !value.includes("T") ? `${value}T12:00:00` : value;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return new DateObject(parsed).convert(persian);
}

/** Format a DateObject as YYYY-MM-DD (Gregorian, ASCII digits). */
export function toDateKey(date: DateObject): string {
  // Clone before convert — convert() mutates in place.
  // Use numeric fields, not format(): persian_fa locale emits Eastern Arabic digits
  // (e.g. "۲۰۲۶-۰۹-۲۱"), which break ASCII date-key compares and Date parsing.
  const g = new DateObject(date).convert(gregorian);
  const y = g.year;
  const m = String(g.month.number).padStart(2, "0");
  const day = String(g.day).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format hours/minutes as HH:mm with ASCII digits. */
export function toTimeValue(date: DateObject): string {
  const hours = String(date.hour).padStart(2, "0");
  const minutes = String(date.minute).padStart(2, "0");
  return `${hours}:${minutes}`;
}
