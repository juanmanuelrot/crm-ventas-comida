import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const TIMEZONE = process.env.TIMEZONE || "America/Montevideo";

export function formatInTz(date: Date | string, pattern: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, pattern, { locale: es });
}

export function formatDay(date: Date | string): string {
  return formatInTz(date, "EEEE d 'de' MMMM");
}

export function formatTime(date: Date | string): string {
  return formatInTz(date, "HH:mm");
}

export function formatDayShort(date: Date | string): string {
  return formatInTz(date, "EEEE");
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const [hh, min] = timeStr.split(":").map(Number);
  const localDate = new Date(yyyy, (mm ?? 1) - 1, dd ?? 1, hh ?? 0, min ?? 0, 0, 0);
  return fromZonedTime(localDate, TIMEZONE);
}

export function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd");
}

export function toInputTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, "HH:mm");
}

export function startOfWeekInTz(date: Date): Date {
  const zoned = toZonedTime(date, TIMEZONE);
  const day = zoned.getDay();
  const diff = (day + 6) % 7;
  zoned.setDate(zoned.getDate() - diff);
  zoned.setHours(0, 0, 0, 0);
  return fromZonedTime(zoned, TIMEZONE);
}

export function endOfWeekInTz(date: Date): Date {
  const start = startOfWeekInTz(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
