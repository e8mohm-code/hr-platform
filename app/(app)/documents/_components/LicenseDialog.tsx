'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createLicense, updateLicense } from '../actions';

const TYPES = ['رخصة بلدية', 'دفاع مدني', 'هيئة سياحة', 'هيئة غذاء ودواء', 'أخرى'];

export interface LicenseData {
  id?: string;
  branchId?: string;
  type?: string;
  authority?: string | null;
  number?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
}

interface Branch {
  id: string;
  name: string;
  brand: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  branches: Branch[];
  data?: LicenseData;
  onClose: () => void;
}

export function LicenseDialog({ mode, branches, data = {}, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === 'create'
        ? await createLicense(formData)
        : await updateLicense(data.id!, formData);
      if (!result.ok) { setError(result.error); return; }
      onClose();
    });
  }

  // group branches by brand
  const grouped = new Map<string, Branch[]>();
  for (const b of branches) {
    const k = b.brand ?? '';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(b);
  }
  const groups = Array.from(grouped.entries()).sort(([a], [b]) =>
    a && !b ? -1 : !a && b ? 1 : a.localeCompare(b, 'ar')
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">
            {mode === 'create' ? 'إضافة ترخيص' : 'تعديل الترخيص'}
          </h3>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 text-ink-500 transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="branchId">الفرع *</Label>
              <Select id="branchId" name="branchId" required defaultValue={data.branchId ?? branches[0]?.id ?? ''}>
                {groups.map(([brand, list]) => brand
                  ? <optgroup key={brand} label={brand}>
                      {list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </optgroup>
                  : list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)
                )}
              </Select>
            </div>
            <div>
              <Label htmlFor="type">النوع *</Label>
              <Select id="type" name="type" required defaultValue={data.type ?? TYPES[0]}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="authority">الجهة المُصدِرة</Label>
              <Input id="authority" name="authority" defaultValue={data.authority ?? ''} />
            </div>
            <div>
              <Label htmlFor="number">الرقم *</Label>
              <Input id="number" name="number" required dir="ltr" defaultValue={data.number ?? ''} />
            </div>
            <div>
              <Label htmlFor="issueDate">تاريخ الإصدار</Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={data.issueDate ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
              <Input id="expiryDate" name="expiryDate" type="date" required defaultValue={data.expiryDate ?? ''} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'جارٍ الحفظ…' : mode === 'create' ? 'إضافة' : 'حفظ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
