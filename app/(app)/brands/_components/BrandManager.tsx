'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/FileUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { createBrand, updateBrand, deleteBrand } from '../actions';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  color: string | null;
}

export function BrandManager({ brands }: { brands: Brand[] }) {
  const [editing, setEditing] = useState<Brand | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`حذف البراند "${name}"؟ الفروع المرتبطة لن تُحذف لكن ستفقد ربطها.`)) return;
    startTransition(async () => {
      const r = await deleteBrand(id);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-ink-500">
          البراندات تظهر مع لوقواتها بجانب اسم الفرع وفي بطاقات الموظف.
        </p>
        <Button leftIcon={<Plus size={16} />} onClick={() => setAdding(true)}>
          إضافة براند
        </Button>
      </div>

      {brands.length === 0 ? (
        <EmptyState
          icon={<Building2 size={20} />}
          title="لا توجد براندات بعد"
          description="ابدأ بإضافة براندات منشأتك (مكرونو، نملية، شذى المذاق...)."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => (
            <Card key={b.id} className="hover:shadow-cardHover transition-shadow">
              <CardBody>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-md bg-slate-100 grid place-items-center overflow-hidden shrink-0"
                    style={{ background: b.color ?? undefined }}
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={24} className="text-ink-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-900 truncate">{b.name}</div>
                    {b.color && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-3 h-3 rounded" style={{ background: b.color }} />
                        <span className="text-xs text-ink-500" dir="ltr">{b.color}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setEditing(b)}
                    className="flex items-center gap-1 text-sm text-ink-700 hover:bg-slate-100 px-2 py-1 rounded"
                  >
                    <Pencil size={14} /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    className="flex items-center gap-1 text-sm text-critical hover:bg-red-50 px-2 py-1 rounded"
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <BrandDialog
          brand={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
    </>
  );
}

function BrandDialog({ brand, onClose }: { brand: Brand | null; onClose: () => void }) {
  const [name, setName] = useState(brand?.name ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logoUrl ?? null);
  const [color, setColor] = useState(brand?.color ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const data = { name, logoUrl, color: color || null };
      const r = brand ? await updateBrand(brand.id, data) : await createBrand(data);
      if (!r.ok) { setError(r.error); return; }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto animate-slide-up">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">
            {brand ? 'تعديل البراند' : 'إضافة براند'}
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Label className="self-start">شعار البراند (لوقو)</Label>
            <ImageUploadField value={logoUrl} onChange={setLogoUrl} size={120} shape="square" />
          </div>

          <div>
            <Label htmlFor="name">اسم البراند *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="color">لون مميز (اختياري)</Label>
            <Input
              id="color"
              type="color"
              value={color || '#0ea5e9'}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 cursor-pointer"
            />
            <p className="text-xs text-ink-500 mt-1">سيُستخدم كخلفية للوقو إذا لم يتوفر.</p>
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? 'جارٍ الحفظ…' : brand ? 'حفظ' : 'إضافة'}
          </Button>
        </div>
      </div>
    </div>
  );
}
