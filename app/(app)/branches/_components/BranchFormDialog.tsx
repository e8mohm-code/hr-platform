'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBranch, updateBranch } from '../actions';

interface Branch {
  id: string;
  name: string;
  brand: string | null;
  brandRefId?: string | null;
  city: string;
  address: string | null;
  managerName: string | null;
  phone: string | null;
}

interface BrandOption {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  branch?: Branch;
  existingBrands: string[];
  brandOptions: BrandOption[];
  onClose: () => void;
}

export function BranchFormDialog({ mode, branch, existingBrands, brandOptions, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createBranch(formData)
          : await updateBranch(branch!.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">
            {mode === 'create' ? 'إضافة فرع جديد' : 'تعديل الفرع'}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 text-ink-500 transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">اسم الفرع *</Label>
              <Input id="name" name="name" required defaultValue={branch?.name ?? ''} />
            </div>
            <div>
              <Label htmlFor="brandRefId">البراند</Label>
              <select
                id="brandRefId"
                name="brandRefId"
                defaultValue={branch?.brandRefId ?? ''}
                className="w-full h-10 pr-3 pl-9 bg-white border border-border rounded-md text-ink-900 text-sm appearance-none hover:border-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              >
                <option value="">— بدون براند —</option>
                {brandOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input type="hidden" name="brand" defaultValue={branch?.brand ?? ''} />
              <p className="text-xs text-ink-500 mt-1">
                <a href="/brands" className="text-primary-700 hover:underline">إدارة البراندات →</a>
              </p>
            </div>
            <div>
              <Label htmlFor="city">المدينة *</Label>
              <Input id="city" name="city" required defaultValue={branch?.city ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Input id="address" name="address" defaultValue={branch?.address ?? ''} />
            </div>
            <div>
              <Label htmlFor="managerName">اسم المدير</Label>
              <Input id="managerName" name="managerName" defaultValue={branch?.managerName ?? ''} />
            </div>
            <div>
              <Label htmlFor="phone">جوال المدير</Label>
              <Input
                id="phone"
                name="phone"
                dir="ltr"
                placeholder="05xxxxxxxx"
                defaultValue={branch?.phone ?? ''}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'جارٍ الحفظ…' : mode === 'create' ? 'إضافة' : 'حفظ التعديلات'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
