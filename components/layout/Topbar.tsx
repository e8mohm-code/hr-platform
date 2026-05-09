'use client';

import { Bell, Search, Plus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtNumber, cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface TopbarStat {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'indigo' | 'amber' | 'green';
}

interface TopbarProps {
  title?: string;
  branches?: { id: string; name: string }[];
  selectedBranchId?: string | null;
  notificationCount?: number;
  primaryAction?: { label: string; href?: string };
  stats?: TopbarStat[];
}

export function Topbar({
  title = 'لوحة التحكم',
  branches = [],
  selectedBranchId,
  notificationCount = 0,
  primaryAction,
  stats,
}: TopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between gap-3">
        {/* Right (RTL): title + search + stats */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-h3 font-semibold text-gray-900 hidden lg:block m-0 shrink-0">
            {title}
          </h1>
          <div className="w-full max-w-xs">
            <Input
              type="search"
              placeholder="بحث…"
              leftIcon={<Search size={16} />}
            />
          </div>

          {stats && stats.length > 0 && (
            <div className="hidden md:flex items-center gap-2 ms-2">
              {stats.map((s) => (
                <StatChip key={s.label} {...s} />
              ))}
            </div>
          )}
        </div>

        {/* Left (RTL): actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Branch selector */}
          {branches.length > 0 && (
            <div className="relative hidden xl:block">
              <select
                defaultValue={selectedBranchId ?? ''}
                className="h-10 pr-9 pl-3 bg-white border border-gray-300 rounded-md text-body text-gray-700 hover:border-gray-500 focus:outline-none focus:border-primary-600 focus:shadow-focus appearance-none transition-colors duration-200 ease-out-soft"
              >
                <option value="">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          )}

          {/* Notifications */}
          <button
            className="relative w-10 h-10 grid place-items-center rounded-md hover:bg-gray-50 text-gray-700 transition-colors duration-200 ease-out-soft"
            aria-label="الإشعارات"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-danger text-white text-small font-semibold animate-pulse-critical">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* Primary action */}
          {primaryAction && (
            <Button leftIcon={<Plus size={16} />} size="md">
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function StatChip({ icon, label, value, tone }: TopbarStat) {
  const palette = {
    blue:   'bg-blue-50 text-primary-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber:  'bg-amber-50 text-warning',
    green:  'bg-green-50 text-success',
  }[tone];

  return (
    <div
      className="flex items-center gap-2 px-2.5 h-10 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors duration-200 ease-out-soft"
      title={`${label}: ${fmtNumber(value)}`}
    >
      <span className={cn('w-6 h-6 rounded grid place-items-center shrink-0', palette)}>
        {icon}
      </span>
      <div className="leading-tight hidden xl:block">
        <div className="text-[10px] text-gray-500 leading-none">{label}</div>
        <div className="text-body font-bold text-gray-900 num leading-tight">
          {fmtNumber(value)}
        </div>
      </div>
      <span className="text-body font-bold text-gray-900 num xl:hidden">
        {fmtNumber(value)}
      </span>
    </div>
  );
}
