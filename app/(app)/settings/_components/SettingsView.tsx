'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { saveCustomFields, saveVacationEntitlement } from '../actions';
import type { CustomFieldDef } from '@/lib/data';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: Array<{ value: CustomFieldDef['type']; label: string }> = [
  { value: 'text',     label: 'نص قصير' },
  { value: 'textarea', label: 'نص طويل' },
  { value: 'number',   label: 'رقم' },
  { value: 'date',     label: 'تاريخ' },
  { value: 'select',   label: 'اختيار من قائمة' },
  { value: 'boolean',  label: 'نعم/لا' },
];

interface Props {
  initialFields: CustomFieldDef[];
  initialVacation: number;
}

export function SettingsView({ initialFields, initialVacation }: Props) {
  const [tab, setTab] = useState<'fields' | 'general'>('fields');

  return (
    <>
      <div className="inline-flex bg-white border border-border rounded-md p-1 gap-1 mb-5">
        <TabButton active={tab === 'fields'} onClick={() => setTab('fields')}>
          الحقول المخصصة للعامل
        </TabButton>
        <TabButton active={tab === 'general'} onClick={() => setTab('general')}>
          عام
        </TabButton>
      </div>

      {tab === 'fields' ? (
        <CustomFieldsEditor initialFields={initialFields} />
      ) : (
        <GeneralSettings initialVacation={initialVacation} />
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 h-8 rounded text-sm font-semibold transition-colors',
        active ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-slate-100'
      )}
    >
      {children}
    </button>
  );
}

function CustomFieldsEditor({ initialFields }: { initialFields: CustomFieldDef[] }) {
  const [fields, setFields] = useState<CustomFieldDef[]>(initialFields);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save on change (debounced)
  useEffect(() => {
    if (fields === initialFields) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await saveCustomFields(fields);
        if (!result.ok) setError(result.error);
        else { setError(null); setSavedAt(Date.now()); }
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  const addField = () => {
    const key = `cf_${Date.now().toString(36).slice(-5)}`;
    setFields([...fields, { key, label: 'حقل جديد', type: 'text', required: false }]);
  };

  const updateField = (idx: number, patch: Partial<CustomFieldDef>) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const removeField = (idx: number) => {
    if (!confirm('سيُحذف هذا الحقل من فورم الموظف. متابعة؟')) return;
    setFields(fields.filter((_, i) => i !== idx));
  };

  const showSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>الحقول الإضافية للعامل</CardTitle>
            <CardSub>تظهر تلقائياً في فورم العامل وفي صفحة تفاصيله. الحفظ تلقائي.</CardSub>
          </div>
          {showSaved && (
            <div className="flex items-center gap-1.5 text-safe text-sm font-semibold">
              <Check size={16} />
              <span>تم الحفظ</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-ink-500 py-6 text-center border border-dashed border-border rounded-md">
              لا توجد حقول مخصصة. أضف أوّل حقل ليظهر تلقائياً في فورم العامل.
            </p>
          )}

          {fields.map((f, idx) => (
            <div key={f.key} className="border border-border rounded-md p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <Label>عنوان الحقل</Label>
                <Input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Label>النوع</Label>
                <Select
                  value={f.type}
                  onChange={(e) => updateField(idx, { type: e.target.value as CustomFieldDef['type'] })}
                >
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              {f.type === 'select' && (
                <div className="md:col-span-4">
                  <Label>الخيارات (مفصولة بفاصلة)</Label>
                  <Input
                    value={(f.options ?? []).join(', ')}
                    onChange={(e) => updateField(idx, {
                      options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })}
                  />
                </div>
              )}
              <div className={f.type === 'select' ? 'md:col-span-1' : 'md:col-span-5'}>
                <Label>إلزامي</Label>
                <label className="h-10 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.required ?? false}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="w-4 h-4 rounded border-border accent-primary-600"
                  />
                  <span className="text-sm text-ink-700">إجباري</span>
                </label>
              </div>
              <div className="md:col-span-12 flex items-center justify-between gap-3 pt-2 border-t border-border">
                <code className="text-xs text-ink-400" dir="ltr">{f.key}</code>
                <button
                  onClick={() => removeField(idx)}
                  className="flex items-center gap-1 text-critical text-sm font-semibold hover:bg-red-50 px-2 py-1 rounded"
                >
                  <Trash2 size={14} />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button leftIcon={<Plus size={16} />} variant="secondary" className="mt-4" onClick={addField}>
          إضافة حقل
        </Button>
      </CardBody>
    </Card>
  );
}

function GeneralSettings({ initialVacation }: { initialVacation: number }) {
  const [days, setDays] = useState(initialVacation);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (days === initialVacation) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await saveVacationEntitlement(days);
        if (!r.ok) setError(r.error);
        else { setError(null); setSavedAt(Date.now()); }
      });
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const showSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>إعدادات عامة</CardTitle>
            <CardSub>الإعدادات الافتراضية المطبّقة على كل العمالة.</CardSub>
          </div>
          {showSaved && (
            <div className="flex items-center gap-1.5 text-safe text-sm font-semibold">
              <Check size={16} />
              <span>تم الحفظ</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <Label>رصيد الإجازات السنوي (يوم)</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-ink-500 mt-1">القيمة الافتراضية لكل موظف جديد.</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
