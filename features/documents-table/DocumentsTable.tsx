'use client';

import { useMemo, useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { fmtShortDate, cn } from '@/lib/utils';
import { tierFromDate } from '@/lib/alerts';

export interface DocRow {
  id: string;
  name: string;
  docType: string;
  docTypeKey: string;
  expiryDate: Date | string | null;
  daysRemaining: number | null;
}

const DOC_TYPES = [
  { key: 'all', label: 'كل الأنواع' },
  { key: 'iqama', label: 'إقامة' },
  { key: 'license', label: 'ترخيص' },
  { key: 'health', label: 'شهادة صحية' },
  { key: 'contract', label: 'عقد' },
  { key: 'registration', label: 'سجل تجاري' },
];

export function DocumentsTable({ rows }: { rows: DocRow[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState(true); // true = most urgent first

  const filtered = useMemo(() => {
    let list = rows;
    if (typeFilter !== 'all') list = list.filter((r) => r.docTypeKey === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.docType.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const da = a.daysRemaining ?? 1e9;
      const db = b.daysRemaining ?? 1e9;
      return sortAsc ? da - db : db - da;
    });
    return list;
  }, [rows, typeFilter, search, sortAsc]);

  return (
    <Card>
      <CardBody className="p-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <CardTitle>كل الوثائق</CardTitle>
              <CardSub>{filtered.length} من {rows.length} عنصر</CardSub>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-60">
              <Input
                type="search"
                placeholder="ابحث بالاسم أو نوع الوثيقة…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-ink-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-3 bg-white border border-border rounded-md text-sm text-ink-700 hover:border-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<ArrowUpDown size={14} />}
              onClick={() => setSortAsc((v) => !v)}
            >
              {sortAsc ? 'الأكثر عجلة' : 'الأقل عجلة'}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                <th className="text-start px-5 py-3">الاسم</th>
                <th className="text-start px-5 py-3">نوع الوثيقة</th>
                <th className="text-start px-5 py-3">تاريخ الانتهاء</th>
                <th className="text-start px-5 py-3">الأيام المتبقية</th>
                <th className="text-start px-5 py-3">الحالة</th>
                <th className="text-start px-5 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-500">
                    لا توجد نتائج تطابق البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const tier = tierFromDate(r.expiryDate);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-semibold text-ink-900">{r.name}</td>
                      <td className="px-5 py-3 text-ink-700">{r.docType}</td>
                      <td className="px-5 py-3 text-ink-700">{fmtShortDate(r.expiryDate)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'font-bold num text-base',
                            tier.fg
                          )}
                        >
                          {r.daysRemaining == null
                            ? '—'
                            : r.daysRemaining < 0
                            ? `متأخر ${Math.abs(r.daysRemaining)}`
                            : `${r.daysRemaining}`}
                        </span>
                        {r.daysRemaining != null && (
                          <span className="text-xs text-ink-500 mr-1">
                            {r.daysRemaining < 0 ? 'يوم' : 'يوم'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Pill variant={pillVariant(tier.key)}>{tier.label}</Pill>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          size="sm"
                          variant={tier.key === 'expired' || tier.key === 'critical' ? 'critical' : 'secondary'}
                        >
                          تجديد
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function pillVariant(tier: string): 'critical' | 'warning' | 'safe' | 'neutral' {
  if (tier === 'expired' || tier === 'critical') return 'critical';
  if (tier === 'warning') return 'warning';
  if (tier === 'safe') return 'safe';
  return 'neutral';
}
