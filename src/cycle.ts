import type { PeriodType } from './types';

export interface Cycle {
  start: string; // ISO YYYY-MM-DD inclusive
  end: string; // ISO YYYY-MM-DD inclusive
}

const DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO date as UTC (avoids local-timezone drift). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** First day of the cycle that falls in (year, month) — clamped to the month length. */
export function cycleStartForMonth(year: number, month0: number, startDay: number): Date {
  const clamped = Math.min(startDay, daysInMonth(year, month0));
  return new Date(Date.UTC(year, month0, clamped));
}

/**
 * The cycle containing `anchorISO`.
 * - weekly: Monday–Sunday of that week (startDay ignored).
 * - monthly: if anchor.day < startDay the cycle started last month; else this month.
 *   end = one day before the next cycle's start.
 */
export function getCycle(period: PeriodType, startDay: number, anchorISO: string): Cycle {
  const anchor = parseISO(anchorISO);
  if (period === 'weekly') {
    const mondayOffset = (anchor.getUTCDay() + 6) % 7; // Monday=0
    const start = new Date(anchor.getTime() - mondayOffset * DAY);
    return { start: toISO(start), end: toISO(new Date(start.getTime() + 6 * DAY)) };
  }
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  // Compare against the clamped start day so startDay=31 in a 28-day month starts on the 28th.
  const effectiveStart = cycleStartForMonth(y, m, startDay);
  const isBeforeStart = anchor.getTime() < effectiveStart.getTime();
  const startYear = isBeforeStart ? (m === 0 ? y - 1 : y) : y;
  const startMonth = isBeforeStart ? (m === 0 ? 11 : m - 1) : m;
  const start = cycleStartForMonth(startYear, startMonth, startDay);
  const end = new Date(cycleStartForMonth(startYear, startMonth + 1, startDay).getTime() - DAY);
  return { start: toISO(start), end: toISO(end) };
}

/** Shift a cycle by `delta` cycles (◀ ▶ pass ±1; any N works). */
export function shiftCycle(period: PeriodType, startDay: number, cycle: Cycle, delta: number): Cycle {
  // Anchor on the cycle's midpoint so the shift is exact (edge-anchoring collapses for |delta| > 1).
  const anchor = parseISO(cycle.start);
  if (period === 'weekly') {
    return getCycle(period, startDay, toISO(new Date(anchor.getTime() + delta * 7 * DAY)));
  }
  const [y, m] = [anchor.getUTCFullYear(), anchor.getUTCMonth()];
  // Target month = start-month + delta. Anchor on day 28 (never clamps across a month boundary).
  const monthIndex = y * 12 + m + delta;
  const targetStart = cycleStartForMonth(Math.floor(monthIndex / 12), monthIndex % 12, startDay);
  return getCycle(period, startDay, toISO(targetStart));
}

const dayMonth = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const yearFmt = new Intl.DateTimeFormat('id-ID', { year: 'numeric' });

/** "25 Jul – 24 Agu" style range label (inclusive) — no year, so it stays stable across months. */
export function formatRange(startISO: string, endISO: string): string {
  const s = dayMonth.format(parseISO(startISO));
  const e = dayMonth.format(parseISO(endISO));
  return `${s} – ${e}`;
}

/** "2026", or "2026 – 2027" when the cycle crosses a year boundary. */
export function cycleYear(startISO: string, endISO: string): string {
  const s = yearFmt.format(parseISO(startISO));
  const e = yearFmt.format(parseISO(endISO));
  return s === e ? s : `${s} – ${e}`;
}
