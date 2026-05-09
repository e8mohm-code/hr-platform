'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import {
  renewIqama,
  renewContract,
  renewHealthCard,
  recordExitVisa,
  transferBranch,
  recordResignation,
  recordFinalExit,
  recordWarning,
  recordVacation,
} from '../actions';

export type ActionKey =
  | 'renew_iqama'
  | 'renew_contract'
  | 'renew_health'
  | 'exit_visa'
  | 'transfer_branch'
  | 'resignation'
  | 'final_exit'
  | 'warning'
  | 'vacation';

const TITLES: Record<ActionKey, string> = {
  renew_iqama: 'تجديد إقامة',
  renew_contract: 'تجديد عقد',
  renew_health: 'تجديد شهادة صحية',
  exit_visa: 'تأشيرة خروج وعودة',
  transfer_branch: 'نقل بين الفروع',
  resignation: 'استقالة',
  final_exit: 'خروج نهائي',
  warning: 'إنذار',
  vacation: 'إجازة',
};

interface Branch { id: string; name: string; brand: string | null; }

interface Props {
  employeeId: string;
  action: ActionKey;
  branches?: Branch[];
  currentBranchId?: string;
  onClose: () => void;
}

export function ActionDialog({ employeeId, action, branches = [], currentBranchId, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const fn = ACTION_FNS[action];
      const result = await fn(employeeId, formData);
      if (!result.ok) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">{TITLES[action]}</h3>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 text-ink-500 transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">{error}</div>}

          <ActionFields action={action} branches={branches} currentBranchId={currentBranchId} />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={isPending} variant={dangerActions.has(action) ? 'danger' : 'primary'}>
              {isPending ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ACTION_FNS = {
  renew_iqama: renewIqama,
  renew_contract: renewContract,
  renew_health: renewHealthCard,
  exit_visa: recordExitVisa,
  transfer_branch: transferBranch,
  resignation: recordResignation,
  final_exit: recordFinalExit,
  warning: recordWarning,
  vacation: recordVacation,
} as const;

const dangerActions = new Set<ActionKey>(['final_exit', 'warning']);

function ActionFields({
  action,
  branches,
  currentBranchId,
}: {
  action: ActionKey;
  branches: Branch[];
  currentBranchId?: string;
}) {
  if (action === 'renew_iqama' || action === 'renew_health' || action === 'renew_contract') {
    return <RenewFields includeFee={action !== 'renew_contract'} />;
  }
  if (action === 'exit_visa') return <ExitVisaFields />;
  if (action === 'transfer_branch') return <TransferFields branches={branches} currentBranchId={currentBranchId} />;
  if (action === 'resignation') return <ResignationFields />;
  if (action === 'final_exit') return <FinalExitFields />;
  if (action === 'warning') return <WarningFields />;
  if (action === 'vacation') return <VacationFields />;
  return null;
}

function RenewFields({ includeFee }: { includeFee: boolean }) {
  const [duration, setDuration] = useState('12');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="duration">المدة *</Label>
        <Select id="duration" name="duration" required value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="3">+ ٣ شهور</option>
          <option value="6">+ ٦ شهور</option>
          <option value="9">+ ٩ شهور</option>
          <option value="12">+ ١٢ شهر</option>
          <option value="24">+ ٢٤ شهر</option>
          <option value="custom">تاريخ مخصص</option>
        </Select>
      </div>
      {duration === 'custom' && (
        <div>
          <Label htmlFor="customDate">التاريخ الجديد *</Label>
          <Input id="customDate" name="customDate" type="date" required />
        </div>
      )}
      {includeFee && (
        <div>
          <Label htmlFor="cost">الرسوم (ر.س)</Label>
          <Input id="cost" name="cost" type="number" min="0" />
        </div>
      )}
      <div className="sm:col-span-2">
        <Label htmlFor="note">ملاحظات</Label>
        <Textarea id="note" name="note" />
      </div>
    </div>
  );
}

function ExitVisaFields() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Label htmlFor="visaNumber">رقم التأشيرة *</Label>
        <Input id="visaNumber" name="visaNumber" required dir="ltr" />
      </div>
      <div>
        <Label htmlFor="visaType">نوع التأشيرة</Label>
        <Select id="visaType" name="visaType" defaultValue="مفردة">
          <option value="مفردة">مفردة</option>
          <option value="متعددة">متعددة</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="issueDate">تاريخ الإصدار</Label>
        <Input id="issueDate" name="issueDate" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
        <Input id="expiryDate" name="expiryDate" type="date" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="note">ملاحظات</Label>
        <Textarea id="note" name="note" />
      </div>
    </div>
  );
}

function TransferFields({ branches, currentBranchId }: { branches: Branch[]; currentBranchId?: string }) {
  const grouped = new Map<string, Branch[]>();
  for (const b of branches) {
    if (b.id === currentBranchId) continue; // exclude current
    const k = b.brand ?? '';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(b);
  }
  const groups = Array.from(grouped.entries());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Label htmlFor="newBranchId">الفرع الجديد *</Label>
        <Select id="newBranchId" name="newBranchId" required>
          <option value="">— اختر فرعاً —</option>
          {groups.map(([brand, list]) => brand
            ? <optgroup key={brand} label={brand}>
                {list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
            : list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)
          )}
        </Select>
      </div>
      <div>
        <Label htmlFor="effectiveDate">تاريخ النقل</Label>
        <Input id="effectiveDate" name="effectiveDate" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="reason">سبب النقل</Label>
        <Textarea id="reason" name="reason" />
      </div>
    </div>
  );
}

function ResignationFields() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="resignDate">تاريخ تقديم الاستقالة *</Label>
        <Input id="resignDate" name="resignDate" type="date" required />
      </div>
      <div>
        <Label htmlFor="lastDay">آخر يوم عمل</Label>
        <Input id="lastDay" name="lastDay" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="reason">سبب الاستقالة</Label>
        <Textarea id="reason" name="reason" />
      </div>
    </div>
  );
}

function FinalExitFields() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="exitDate">تاريخ الخروج *</Label>
        <Input id="exitDate" name="exitDate" type="date" required />
      </div>
      <div>
        <Label htmlFor="reason">السبب</Label>
        <Textarea id="reason" name="reason" />
      </div>
    </div>
  );
}

function WarningFields() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="severity">درجة الإنذار *</Label>
        <Select id="severity" name="severity" required defaultValue="إنذار أول">
          <option value="تنبيه">تنبيه</option>
          <option value="إنذار أول">إنذار أول</option>
          <option value="إنذار ثاني">إنذار ثاني</option>
          <option value="إنذار نهائي">إنذار نهائي</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="reason">سبب الإنذار *</Label>
        <Textarea id="reason" name="reason" required />
      </div>
    </div>
  );
}

function VacationFields() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="vacType">نوع الإجازة</Label>
        <Select id="vacType" name="vacType" defaultValue="سنوية">
          <option value="سنوية">سنوية</option>
          <option value="مرضية">مرضية</option>
          <option value="اضطرارية">اضطرارية</option>
          <option value="بدون راتب">بدون راتب</option>
          <option value="أخرى">أخرى</option>
        </Select>
      </div>
      <div></div>
      <div>
        <Label htmlFor="startDate">تاريخ البداية *</Label>
        <Input id="startDate" name="startDate" type="date" required />
      </div>
      <div>
        <Label htmlFor="endDate">تاريخ النهاية *</Label>
        <Input id="endDate" name="endDate" type="date" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="note">ملاحظات</Label>
        <Textarea id="note" name="note" />
      </div>
    </div>
  );
}
