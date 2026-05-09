'use client';

import { useState } from 'react';
import {
  IdCard, FileText, HeartPulse, Plane, ArrowRightLeft, LogOut,
  AlertTriangle, CalendarOff, Zap,
} from 'lucide-react';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionDialog, type ActionKey } from './ActionDialog';

interface Branch { id: string; name: string; brand: string | null; }

const ACTIONS: Array<{
  key: ActionKey;
  label: string;
  icon: React.ElementType;
  variant: 'primary' | 'secondary' | 'danger';
  group: 'renew' | 'change' | 'log';
}> = [
  { key: 'renew_iqama',    label: 'تجديد إقامة',         icon: IdCard,        variant: 'primary',   group: 'renew' },
  { key: 'renew_contract', label: 'تجديد عقد',           icon: FileText,      variant: 'primary',   group: 'renew' },
  { key: 'renew_health',   label: 'تجديد شهادة صحية',   icon: HeartPulse,    variant: 'primary',   group: 'renew' },
  { key: 'exit_visa',      label: 'تأشيرة خروج وعودة',  icon: Plane,         variant: 'secondary', group: 'change' },
  { key: 'transfer_branch',label: 'نقل بين الفروع',     icon: ArrowRightLeft, variant: 'secondary', group: 'change' },
  { key: 'vacation',       label: 'إجازة',              icon: CalendarOff,   variant: 'secondary', group: 'log' },
  { key: 'warning',        label: 'إنذار',              icon: AlertTriangle, variant: 'danger',    group: 'log' },
  { key: 'resignation',    label: 'استقالة',            icon: LogOut,        variant: 'danger',    group: 'change' },
  { key: 'final_exit',     label: 'خروج نهائي',         icon: LogOut,        variant: 'danger',    group: 'change' },
];

export function ActionPanel({
  employeeId,
  currentBranchId,
  branches,
}: {
  employeeId: string;
  currentBranchId: string;
  branches: Branch[];
}) {
  const [open, setOpen] = useState<ActionKey | null>(null);

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 text-ink-700 mb-4">
            <span className="w-8 h-8 rounded-md bg-primary-50 text-primary-700 grid place-items-center">
              <Zap size={18} />
            </span>
            <CardTitle>الإجراءات</CardTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => setOpen(a.key)}
                  className={
                    'flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm font-semibold text-start transition-all duration-150 ' +
                    'hover:-translate-y-0.5 ' +
                    (a.variant === 'danger'
                      ? 'border-red-200 bg-red-50/40 text-critical hover:bg-red-50'
                      : a.variant === 'primary'
                      ? 'border-primary-100 bg-primary-50/50 text-primary-700 hover:bg-primary-50'
                      : 'border-border bg-white text-ink-700 hover:bg-slate-50')
                  }
                >
                  <Icon size={16} />
                  <span className="flex-1">{a.label}</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {open && (
        <ActionDialog
          employeeId={employeeId}
          action={open}
          branches={branches}
          currentBranchId={currentBranchId}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
