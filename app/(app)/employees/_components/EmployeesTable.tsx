'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { fmtShortDate } from '@/lib/utils';
import { tierFromDate } from '@/lib/alerts';
import { deleteEmployee } from '../actions';

interface Row {
  id: string;
  fullName: string;
  photoUrl: string | null;
  nationality: string | null;
  gender: string | null;
  employeeNo: string | null;
  iqamaNumber: string | null;
  iqamaExpiry: Date | null;
  jobTitle: string | null;
  department: string | null;
  branchName: string;
  brandName: string | null;
  brandLogoUrl: string | null;
  healthCardExpiry: Date | null;
  healthCardNumber: string | null;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'safe' | 'warning' | 'critical' }> = {
  ACTIVE:     { label: 'نشط',         variant: 'safe' },
  RESIGNED:   { label: 'مستقيل',       variant: 'warning' },
  FINAL_EXIT: { label: 'خروج نهائي',   variant: 'critical' },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function EmployeesTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`هل تريد حذف "${name}"؟`)) return;
    startTransition(async () => {
      const result = await deleteEmployee(id);
      if (!result.ok) alert(result.error);
    });
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12 text-ink-500">
            لا توجد نتائج تطابق المعايير الحالية.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                <th className="text-start px-5 py-3">الاسم</th>
                <th className="text-start px-5 py-3">الرقم الوظيفي</th>
                <th className="text-start px-5 py-3">رقم الإقامة</th>
                <th className="text-start px-5 py-3">الوظيفة</th>
                <th className="text-start px-5 py-3">الفرع</th>
                <th className="text-start px-5 py-3">الإقامة</th>
                <th className="text-start px-5 py-3">الشهادة الصحية</th>
                <th className="text-start px-5 py-3">الحالة</th>
                <th className="text-start px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tIqama = tierFromDate(r.iqamaExpiry);
                const tHealth = tierFromDate(r.healthCardExpiry);
                const status = STATUS_LABELS[r.status] ?? STATUS_LABELS.ACTIVE;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/employees/${r.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="w-9 h-9 rounded-full overflow-hidden bg-primary-50 text-primary-700 grid place-items-center text-xs font-bold shrink-0 border border-border">
                          {r.photoUrl ? (
                            <img src={r.photoUrl} alt={r.fullName} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(r.fullName)
                          )}
                        </span>
                        <span>
                          <span className="block font-semibold text-ink-900">{r.fullName}</span>
                          <span className="text-xs text-ink-500">
                            {r.nationality}{r.gender ? ` · ${r.gender}` : ''}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500" dir="ltr">{r.employeeNo ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-700" dir="ltr">{r.iqamaNumber ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="text-ink-900">{r.jobTitle ?? '—'}</div>
                      {r.department && <div className="text-xs text-ink-500">{r.department}</div>}
                    </td>
                    <td className="px-5 py-3 text-ink-700">
                      <div className="flex items-center gap-2">
                        {r.brandLogoUrl && (
                          <img src={r.brandLogoUrl} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                        )}
                        <span>{r.branchName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-ink-700 text-xs">{fmtShortDate(r.iqamaExpiry)}</div>
                      <Pill variant={tierToVariant(tIqama.key)} className="mt-1">{tIqama.label}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      {r.healthCardExpiry || r.healthCardNumber ? (
                        <>
                          <div className="text-ink-700 text-xs">{fmtShortDate(r.healthCardExpiry)}</div>
                          <Pill variant={tierToVariant(tHealth.key)} className="mt-1">{tHealth.label}</Pill>
                        </>
                      ) : (
                        <span className="text-ink-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Pill variant={status.variant}>{status.label}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/employees/${r.id}`}
                          className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-200 text-ink-700 transition-colors"
                          aria-label="عرض"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/employees/${r.id}/edit`}
                          className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-200 text-ink-700 transition-colors"
                          aria-label="تعديل"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id, r.fullName)}
                          disabled={isPending}
                          className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-50 text-ink-500 hover:text-critical disabled:opacity-50 transition-colors"
                          aria-label="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function tierToVariant(tier: string): 'critical' | 'warning' | 'safe' | 'neutral' {
  if (tier === 'expired' || tier === 'critical') return 'critical';
  if (tier === 'warning') return 'warning';
  if (tier === 'safe') return 'safe';
  return 'neutral';
}
