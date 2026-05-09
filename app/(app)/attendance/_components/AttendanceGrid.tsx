'use client';

import { useState, useTransition } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/lib/utils';
import { setAttendance } from '../actions';

type Status = 'present' | 'late' | 'absent' | 'vacation';

const STATUS_META: Record<Status, { short: string; bg: string; fg: string; label: string }> = {
  present:  { short: '✓', bg: 'bg-green-100',  fg: 'text-safe',     label: 'حاضر' },
  late:     { short: 'م', bg: 'bg-amber-100',  fg: 'text-amber-700', label: 'متأخر' },
  absent:   { short: '✗', bg: 'bg-red-100',    fg: 'text-critical', label: 'غائب' },
  vacation: { short: 'إ', bg: 'bg-blue-100',   fg: 'text-blue-700', label: 'إجازة' },
};

const ORDER: (Status | null)[] = [null, 'present', 'late', 'absent', 'vacation'];

interface Employee {
  id: string;
  fullName: string;
  branchName: string;
}

interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: Status;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  employees: Employee[];
  records: AttendanceRecord[];
}

export function AttendanceGrid({ year, month, employees, records }: Props) {
  const [optimistic, setOptimistic] = useState<Map<string, Status | null>>(new Map());
  const [, startTransition] = useTransition();

  // Build day list
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: { day: number; iso: string; isWeekend: boolean; isToday: boolean }[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(year, month, d);
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = dt.getDay();
    days.push({ day: d, iso, isWeekend: dow === 5 || dow === 6, isToday: iso === todayStr });
  }

  const recordMap = new Map<string, Status>();
  for (const r of records) {
    recordMap.set(`${r.employeeId}|${r.date}`, r.status);
  }

  const getStatus = (empId: string, iso: string): Status | null => {
    const key = `${empId}|${iso}`;
    if (optimistic.has(key)) return optimistic.get(key) ?? null;
    return recordMap.get(key) ?? null;
  };

  const cycle = (empId: string, iso: string) => {
    const current = getStatus(empId, iso);
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    const key = `${empId}|${iso}`;

    setOptimistic((prev) => {
      const m = new Map(prev);
      m.set(key, next);
      return m;
    });

    startTransition(async () => {
      const result = await setAttendance(empId, iso, next);
      if (!result.ok) alert(result.error);
    });
  };

  return (
    <div className="bg-white border border-border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky end-0 z-10 bg-slate-50 border-b border-l border-border px-4 py-2 text-start min-w-[180px]">
                العامل
              </th>
              {days.map((d) => (
                <th
                  key={d.iso}
                  className={cn(
                    'border-b border-border px-1 py-2 font-semibold text-ink-500',
                    d.isWeekend && 'bg-slate-50',
                    d.isToday && 'bg-primary-50 text-primary-700',
                    'min-w-[34px]'
                  )}
                >
                  {d.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="sticky end-0 z-10 bg-white border-b border-l border-border px-4 py-2 align-middle">
                  <div className="font-semibold text-ink-900 text-sm whitespace-nowrap">{e.fullName}</div>
                  <div className="text-xs text-ink-500 whitespace-nowrap">{e.branchName}</div>
                </td>
                {days.map((d) => {
                  const s = getStatus(e.id, d.iso);
                  const meta = s ? STATUS_META[s] : null;
                  return (
                    <td
                      key={d.iso}
                      onClick={() => cycle(e.id, d.iso)}
                      className={cn(
                        'border-b border-border text-center cursor-pointer transition-colors h-9 align-middle font-bold',
                        d.isWeekend && !meta && 'bg-slate-50 hover:bg-slate-100',
                        d.isToday && !meta && 'bg-primary-50 ring-1 ring-primary-200',
                        meta && meta.bg,
                        meta && meta.fg,
                        !meta && !d.isWeekend && !d.isToday && 'hover:bg-slate-100'
                      )}
                      title={`${d.iso}${meta ? ' — ' + meta.label : ''}`}
                    >
                      {meta ? meta.short : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AttendanceLegend() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(Object.entries(STATUS_META) as [Status, typeof STATUS_META[Status]][]).map(([key, meta]) => (
        <Pill
          key={key}
          variant={key === 'present' ? 'safe' : key === 'late' ? 'warning' : key === 'absent' ? 'critical' : 'primary'}
        >
          {meta.label}
        </Pill>
      ))}
    </div>
  );
}

export function MonthNav({ year, month }: { year: number; month: number }) {
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const label = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long' })
    .format(new Date(year, month, 1));

  return (
    <div className="flex items-center gap-2">
      <a href={`?y=${prev.getFullYear()}&m=${prev.getMonth()}`} className="inline-flex">
        <Button variant="secondary" size="sm" leftIcon={<ChevronRight size={14} />}>الشهر السابق</Button>
      </a>
      <div className="px-3 py-2 bg-white border border-border rounded-md text-sm font-bold text-ink-900 min-w-[140px] text-center">
        {label}
      </div>
      <a href={`?y=${next.getFullYear()}&m=${next.getMonth()}`} className="inline-flex">
        <Button variant="secondary" size="sm" rightIcon={<ChevronLeft size={14} />}>الشهر التالي</Button>
      </a>
    </div>
  );
}
