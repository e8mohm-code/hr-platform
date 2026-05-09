'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtShortDate, cn } from '@/lib/utils';
import { tierFromDate } from '@/lib/alerts';
import { RegistrationDialog, type RegistrationData } from './RegistrationDialog';
import { LicenseDialog, type LicenseData } from './LicenseDialog';
import { deleteRegistration, deleteLicense } from '../actions';

export interface RegistrationRow {
  id: string;
  type: string;
  number: string;
  issueDate: Date | null;
  expiryDate: Date;
}

export interface LicenseRow {
  id: string;
  branchId: string;
  type: string;
  authority: string | null;
  number: string;
  issueDate: Date | null;
  expiryDate: Date;
  branchName: string;
}

interface Branch {
  id: string;
  name: string;
  brand: string | null;
}

type Tab = 'registrations' | 'licenses';

export function DocumentsView({
  registrations,
  licenses,
  branches,
}: {
  registrations: RegistrationRow[];
  licenses: LicenseRow[];
  branches: Branch[];
}) {
  const [tab, setTab] = useState<Tab>('registrations');
  const [regDialog, setRegDialog] = useState<{ mode: 'create' | 'edit'; data?: RegistrationData } | null>(null);
  const [licDialog, setLicDialog] = useState<{ mode: 'create' | 'edit'; data?: LicenseData } | null>(null);
  const [, startTransition] = useTransition();

  const handleDeleteReg = (id: string, label: string) => {
    if (!confirm(`حذف "${label}"؟`)) return;
    startTransition(async () => {
      const r = await deleteRegistration(id);
      if (!r.ok) alert(r.error);
    });
  };

  const handleDeleteLic = (id: string, label: string) => {
    if (!confirm(`حذف "${label}"؟`)) return;
    startTransition(async () => {
      const r = await deleteLicense(id);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex bg-white border border-border rounded-md p-1 gap-1">
          <button
            onClick={() => setTab('registrations')}
            className={cn(
              'px-4 h-8 rounded text-sm font-semibold transition-colors',
              tab === 'registrations' ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-slate-100'
            )}
          >
            السجلات التجارية ({registrations.length})
          </button>
          <button
            onClick={() => setTab('licenses')}
            className={cn(
              'px-4 h-8 rounded text-sm font-semibold transition-colors',
              tab === 'licenses' ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-slate-100'
            )}
          >
            التراخيص ({licenses.length})
          </button>
        </div>

        {tab === 'registrations' ? (
          <Button leftIcon={<Plus size={16} />} onClick={() => setRegDialog({ mode: 'create' })}>
            إضافة سجل
          </Button>
        ) : (
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setLicDialog({ mode: 'create' })}
            disabled={branches.length === 0}
          >
            إضافة ترخيص
          </Button>
        )}
      </div>

      {tab === 'registrations' ? (
        registrations.length === 0 ? (
          <EmptyState
            icon={<Plus size={20} />}
            title="لا توجد سجلات تجارية بعد"
            description="ابدأ بإضافة السجل التجاري الرئيسي للمنشأة."
          />
        ) : (
          <Card>
            <CardBody className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                      <th className="text-start px-5 py-3">النوع</th>
                      <th className="text-start px-5 py-3">الرقم</th>
                      <th className="text-start px-5 py-3">تاريخ الإصدار</th>
                      <th className="text-start px-5 py-3">تاريخ الانتهاء</th>
                      <th className="text-start px-5 py-3">الحالة</th>
                      <th className="text-start px-5 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => {
                      const t = tierFromDate(r.expiryDate);
                      return (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-ink-900">{r.type}</td>
                          <td className="px-5 py-3 text-ink-700" dir="ltr">{r.number}</td>
                          <td className="px-5 py-3 text-ink-700">{fmtShortDate(r.issueDate)}</td>
                          <td className="px-5 py-3 text-ink-700">{fmtShortDate(r.expiryDate)}</td>
                          <td className="px-5 py-3">
                            <Pill variant={tierToVariant(t.key)}>{t.label}</Pill>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setRegDialog({ mode: 'edit', data: {
                                  id: r.id, type: r.type, number: r.number,
                                  issueDate: r.issueDate?.toISOString().slice(0, 10) ?? null,
                                  expiryDate: r.expiryDate.toISOString().slice(0, 10),
                                }})}
                                className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-200 text-ink-700 transition-colors"
                                aria-label="تعديل"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteReg(r.id, `${r.type} ${r.number}`)}
                                className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-50 text-ink-500 hover:text-critical transition-colors"
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
        )
      ) : licenses.length === 0 ? (
        <EmptyState
          icon={<Plus size={20} />}
          title="لا توجد تراخيص بعد"
          description={branches.length === 0 ? 'أضف فرعاً أولاً.' : 'أضف ترخيصاً لكل فرع.'}
        />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                    <th className="text-start px-5 py-3">النوع</th>
                    <th className="text-start px-5 py-3">الفرع</th>
                    <th className="text-start px-5 py-3">الجهة</th>
                    <th className="text-start px-5 py-3">الرقم</th>
                    <th className="text-start px-5 py-3">الانتهاء</th>
                    <th className="text-start px-5 py-3">الحالة</th>
                    <th className="text-start px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l) => {
                    const t = tierFromDate(l.expiryDate);
                    return (
                      <tr key={l.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-ink-900">{l.type}</td>
                        <td className="px-5 py-3 text-ink-700">{l.branchName}</td>
                        <td className="px-5 py-3 text-ink-700">{l.authority ?? '—'}</td>
                        <td className="px-5 py-3 text-ink-700" dir="ltr">{l.number}</td>
                        <td className="px-5 py-3 text-ink-700">{fmtShortDate(l.expiryDate)}</td>
                        <td className="px-5 py-3">
                          <Pill variant={tierToVariant(t.key)}>{t.label}</Pill>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setLicDialog({ mode: 'edit', data: {
                                id: l.id, branchId: l.branchId, type: l.type,
                                authority: l.authority, number: l.number,
                                issueDate: l.issueDate?.toISOString().slice(0, 10) ?? null,
                                expiryDate: l.expiryDate.toISOString().slice(0, 10),
                              }})}
                              className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-200 text-ink-700 transition-colors"
                              aria-label="تعديل"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteLic(l.id, `${l.type} ${l.number}`)}
                              className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-50 text-ink-500 hover:text-critical transition-colors"
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
      )}

      {regDialog && (
        <RegistrationDialog
          mode={regDialog.mode}
          data={regDialog.data}
          onClose={() => setRegDialog(null)}
        />
      )}

      {licDialog && (
        <LicenseDialog
          mode={licDialog.mode}
          branches={branches}
          data={licDialog.data}
          onClose={() => setLicDialog(null)}
        />
      )}
    </>
  );
}

function tierToVariant(tier: string): 'critical' | 'warning' | 'safe' | 'neutral' {
  if (tier === 'expired' || tier === 'critical') return 'critical';
  if (tier === 'warning') return 'warning';
  if (tier === 'safe') return 'safe';
  return 'neutral';
}
