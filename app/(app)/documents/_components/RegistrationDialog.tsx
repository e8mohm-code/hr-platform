'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createRegistration, updateRegistration } from '../actions';

const TYPES = ['سجل تجاري', 'سجل تجاري فرعي', 'عضوية غرفة', 'أخرى'];

export interface RegistrationData {
  id?: string;
  type?: string;
  number?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  data?: RegistrationData;
  onClose: () => void;
}

export function RegistrationDialog({ mode, data = {}, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === 'create'
        ? await createRegistration(formData)
        : await updateRegistration(data.id!, formData);
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
          <h3 className="text-lg font-bold text-ink-900">
            {mode === 'create' ? 'إضافة سجل تجاري' : 'تعديل السجل التجاري'}
          </h3>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 text-ink-500 transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">النوع *</Label>
              <Select id="type" name="type" required defaultValue={data.type ?? TYPES[0]}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="number">الرقم *</Label>
              <Input id="number" name="number" required dir="ltr" defaultValue={data.number ?? ''} />
            </div>
            <div>
              <Label htmlFor="issueDate">تاريخ الإصدار</Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={data.issueDate ?? ''} />
            </div>
            <div>
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
