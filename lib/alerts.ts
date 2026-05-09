import { daysUntil } from './utils';

export type Tier = 'critical' | 'warning' | 'safe' | 'expired' | 'unknown';

export interface TierMeta {
  key: Tier;
  label: string;
  color: 'critical' | 'warning' | 'safe' | 'ink';
  bg: string;          // tailwind bg class
  fg: string;          // tailwind text class
  border: string;      // tailwind border class
  ringColor: string;   // for cards / pills
}

export const TIER_META: Record<Tier, TierMeta> = {
  expired: {
    key: 'expired',
    label: 'منتهية',
    color: 'critical',
    bg: 'bg-red-50',
    fg: 'text-critical',
    border: 'border-red-200',
    ringColor: 'ring-red-200',
  },
  critical: {
    key: 'critical',
    label: 'حرج',
    color: 'critical',
    bg: 'bg-red-50',
    fg: 'text-critical',
    border: 'border-red-200',
    ringColor: 'ring-red-200',
  },
  warning: {
    key: 'warning',
    label: 'قريب',
    color: 'warning',
    bg: 'bg-amber-50',
    fg: 'text-amber-700',
    border: 'border-amber-200',
    ringColor: 'ring-amber-200',
  },
  safe: {
    key: 'safe',
    label: 'سليم',
    color: 'safe',
    bg: 'bg-green-50',
    fg: 'text-safe',
    border: 'border-green-200',
    ringColor: 'ring-green-200',
  },
  unknown: {
    key: 'unknown',
    label: 'غير محدد',
    color: 'ink',
    bg: 'bg-slate-50',
    fg: 'text-ink-500',
    border: 'border-slate-200',
    ringColor: 'ring-slate-200',
  },
};

/**
 * Per the dashboard spec:
 *   Critical: 0–7 days remaining → RED (also expired = critical)
 *   Warning:  8–30 days           → ORANGE
 *   Safe:     30+ days            → GREEN
 */
export function tierFromDate(d: Date | string | null | undefined): TierMeta {
  const days = daysUntil(d);
  if (days == null) return TIER_META.unknown;
  if (days < 0) return TIER_META.expired;
  if (days <= 7) return TIER_META.critical;
  if (days <= 30) return TIER_META.warning;
  return TIER_META.safe;
}

export interface AlertItem {
  id: string;
  documentType: string;
  documentTypeKey: 'iqama' | 'license' | 'health' | 'registration' | 'contract';
  subjectName: string;     // employee or branch name
  expiryDate: Date | null;
  daysRemaining: number | null;
  href?: string;           // detail link
  renewHref?: string;      // renew action target
}

export type AlertGroup = {
  tier: 'expired' | 'critical' | 'warning' | 'safe';
  items: AlertItem[];
};

export function groupByTier(items: AlertItem[]): AlertGroup[] {
  const expired: AlertItem[] = [];
  const critical: AlertItem[] = [];
  const warning: AlertItem[] = [];
  const safe: AlertItem[] = [];
  for (const it of items) {
    const t = tierFromDate(it.expiryDate);
    if (t.key === 'expired') expired.push(it);
    else if (t.key === 'critical') critical.push(it);
    else if (t.key === 'warning') warning.push(it);
    else if (t.key === 'safe') safe.push(it);
  }
  // Sort each group by daysRemaining ascending
  const byDays = (a: AlertItem, b: AlertItem) =>
    (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9);
  return [
    { tier: 'expired',  items: expired.sort(byDays) },
    { tier: 'critical', items: critical.sort(byDays) },
    { tier: 'warning',  items: warning.sort(byDays) },
    { tier: 'safe',     items: safe.sort(byDays) },
  ];
}
