'use client';

import Link from 'next/link';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fmtShortDate, cn } from '@/lib/utils';
import type { AlertItem } from '@/lib/alerts';

type Tier = 'expired' | 'critical' | 'warning' | 'safe';

const TIER_CONFIG: Record<
  Tier,
  {
    title: string;
    subtitle: string;
    iconBg: string;
    iconFg: string;
    icon: React.ElementType;
    pulse: boolean;
  }
> = {
  expired: {
    title: 'منتهية',
    subtitle: 'تجاوزت تاريخ الانتهاء',
    iconBg: 'bg-red-50',
    iconFg: 'text-danger',
    icon: AlertCircle,
    pulse: true,
  },
  critical: {
    title: 'حرجة (٠–٧ أيام)',
    subtitle: 'يجب التجديد فوراً',
    iconBg: 'bg-red-50',
    iconFg: 'text-danger',
    icon: AlertCircle,
    pulse: true,
  },
  warning: {
    title: 'تحذير (٨–٣٠ يوم)',
    subtitle: 'خطّط للتجديد قريباً',
    iconBg: 'bg-amber-50',
    iconFg: 'text-warning',
    icon: AlertTriangle,
    pulse: false,
  },
  safe: {
    title: 'سليمة (+٣٠ يوم)',
    subtitle: 'الوضع جيد',
    iconBg: 'bg-green-50',
    iconFg: 'text-success',
    icon: CheckCircle2,
    pulse: false,
  },
};

export function AlertGroupCard({
  tier,
  items,
  defaultLimit = 4,
}: {
  tier: Tier;
  items: AlertItem[];
  defaultLimit?: number;
}) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  const visible = items.slice(0, defaultLimit);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-md grid place-items-center shrink-0', cfg.iconBg, cfg.iconFg)}>
            <Icon size={20} />
          </div>
          <div>
            <div className={cn('text-body font-semibold', cfg.iconFg)}>{cfg.title}</div>
            <div className="text-small text-gray-500">{cfg.subtitle}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-h1 font-bold text-gray-900 num leading-none">{items.length}</div>
          <div className="text-small text-gray-500 mt-1">عنصر</div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-body text-gray-500 mt-2">لا توجد عناصر في هذه الفئة.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <AlertRow key={item.id} item={item} tier={tier} pulse={cfg.pulse} />
          ))}
          {items.length > visible.length && (
            <Link
              href="/documents"
              className={cn(
                'inline-flex items-center gap-1 text-body font-medium hover:underline mt-2',
                cfg.iconFg
              )}
            >
              عرض كل {items.length} عنصر <ArrowLeft size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function AlertRow({ item, tier, pulse }: { item: AlertItem; tier: Tier; pulse: boolean }) {
  const days = item.daysRemaining;
  const isCritical = tier === 'critical' || tier === 'expired';

  return (
    <div
      className={cn(
        'rounded-md p-3 flex items-center gap-3 border',
        isCritical ? 'bg-red-50 border-red-100' :
        tier === 'warning' ? 'bg-amber-50 border-amber-100' :
        'bg-green-50 border-green-100',
        pulse && 'animate-pulse-critical'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-body font-medium text-gray-900 truncate">
          {item.subjectName}
        </div>
        <div className="text-small text-gray-500 mt-0.5 flex items-center gap-2">
          <span>{item.documentType}</span>
          <span className="text-gray-300">·</span>
          <span>{fmtShortDate(item.expiryDate)}</span>
        </div>
      </div>

      <div className="text-center min-w-16">
        <div className={cn(
          'text-h2 font-bold leading-none num',
          isCritical ? 'text-danger' : tier === 'warning' ? 'text-warning' : 'text-success'
        )}>
          {days != null ? Math.abs(days) : '—'}
        </div>
        <div className="text-small text-gray-500 mt-0.5 whitespace-nowrap">
          {days == null
            ? '—'
            : days < 0
            ? 'يوم تأخير'
            : 'يوم متبقي'}
        </div>
      </div>

      <Button
        size="sm"
        variant={isCritical ? 'critical' : tier === 'warning' ? 'primary' : 'secondary'}
      >
        تجديد
      </Button>
    </div>
  );
}
