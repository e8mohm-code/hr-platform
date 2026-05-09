import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const arabicNumberFormatter = new Intl.NumberFormat('ar-SA');
const arabicDateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const arabicShortDateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function fmtNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return arabicNumberFormatter.format(n);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return arabicDateFormatter.format(date);
}

export function fmtShortDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return arabicShortDateFormatter.format(date);
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
}
