'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { User, IdCard, Briefcase, DollarSign, Shield, Save, ArrowRight, ListPlus } from 'lucide-react';
import type { CustomFieldDef } from '@/lib/data';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  createEmployeeAndRedirect,
  updateEmployeeAndRedirect,
} from '../actions';

const NATIONALITIES = [
  'سعودي', 'مصري', 'هندي', 'باكستاني', 'فلبيني', 'بنغلاديشي',
  'يمني', 'سوداني', 'سوري', 'أردني', 'لبناني', 'إثيوبي',
  'سريلانكي', 'إندونيسي', 'نيبالي', 'أخرى',
];
const GENDERS = ['ذكر', 'أنثى'];
const PAYMENT_METHODS = ['تحويل', 'مدد', 'كاش', 'شيك'];
const DEPARTMENTS = [
  'الإدارة', 'المالية', 'المطبخ', 'الصالة', 'التوصيل',
  'الصيانة', 'المعمل', 'الموارد البشرية', 'أخرى',
];
const CONTRACT_TYPES = ['محدد', 'غير محدد'];
const STATUSES: { value: 'ACTIVE' | 'RESIGNED' | 'FINAL_EXIT'; label: string }[] = [
  { value: 'ACTIVE',     label: 'نشط' },
  { value: 'RESIGNED',   label: 'مستقيل' },
  { value: 'FINAL_EXIT', label: 'خروج نهائي' },
];

export interface EmployeeFormData {
  id?: string;
  fullName?: string;
  gender?: string | null;
  nationality?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  employeeNo?: string | null;
  iqamaNumber?: string | null;
  iqamaExpiry?: string | null;
  sponsorNumber?: string | null;
  healthCardNumber?: string | null;
  healthCardExpiry?: string | null;
  branchId?: string;
  jobTitle?: string | null;
  department?: string | null;
  joinDate?: string | null;
  contractStart?: string | null;
  contractEnd?: string | null;
  contractType?: string | null;
  basicSalary?: string | number | null;
  housingAllowance?: string | number | null;
  commissions?: string | number | null;
  otherAllowances?: string | number | null;
  paymentMethod?: string | null;
  iban?: string | null;
  gosiSubscriptionNo?: string | null;
  gosiSubjectWage?: string | number | null;
  status?: 'ACTIVE' | 'RESIGNED' | 'FINAL_EXIT';
}

interface Branch {
  id: string;
  name: string;
  brand: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  branches: Branch[];
  customFields?: CustomFieldDef[];
  customFieldValues?: Record<string, unknown>;
  initial?: EmployeeFormData;
  initialError?: string;
}

export function EmployeeForm({
  mode,
  branches,
  customFields = [],
  customFieldValues = {},
  initial = {},
  initialError,
}: Props) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  // Group branches by brand for nicer select
  const grouped = useMemo(() => groupBranches(branches), [branches]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createEmployeeAndRedirect(formData);
        } else if (initial.id) {
          await updateEmployeeAndRedirect(initial.id, formData);
        }
      } catch (err) {
        // Server actions throw redirect → that's the success path
        if (err && typeof err === 'object' && 'digest' in err) throw err;
        setError(err instanceof Error ? err.message : 'فشل الحفظ.');
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
          {error}
        </div>
      )}

      {/* Personal */}
      <Card>
        <CardBody>
          <SectionHeader icon={<User size={18} />} title="البيانات الشخصية" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="الاسم الكامل *" className="sm:col-span-2">
              <Input name="fullName" required defaultValue={initial.fullName ?? ''} />
            </Field>
            <Field label="الجنس">
              <Select name="gender" defaultValue={initial.gender ?? ''}>
                <option value="">—</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="الجنسية">
              <Select name="nationality" defaultValue={initial.nationality ?? ''}>
                <option value="">—</option>
                {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="تاريخ الميلاد">
              <Input type="date" name="dob" defaultValue={initial.dob ?? ''} />
            </Field>
            <Field label="الجوال">
              <Input name="phone" dir="ltr" placeholder="+966 5xxxxxxxx" defaultValue={initial.phone ?? ''} />
            </Field>
            <Field label="البريد الإلكتروني" className="sm:col-span-2">
              <Input type="email" name="email" dir="ltr" placeholder="name@example.com" defaultValue={initial.email ?? ''} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* IDs / docs */}
      <Card>
        <CardBody>
          <SectionHeader icon={<IdCard size={18} />} title="الهويات والوثائق" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="الرقم الوظيفي">
              <Input name="employeeNo" dir="ltr" placeholder="EMP-1001" defaultValue={initial.employeeNo ?? ''} />
            </Field>
            <Field label="رقم الإقامة/الهوية">
              <Input name="iqamaNumber" dir="ltr" defaultValue={initial.iqamaNumber ?? ''} />
            </Field>
            <Field label="انتهاء الإقامة">
              <Input type="date" name="iqamaExpiry" defaultValue={initial.iqamaExpiry ?? ''} />
            </Field>
            <Field label="الرقم الموحد لصاحب العمل">
              <Input name="sponsorNumber" dir="ltr" placeholder="7016807138" defaultValue={initial.sponsorNumber ?? ''} />
            </Field>
            <Field label="رقم الشهادة الصحية">
              <Input name="healthCardNumber" dir="ltr" defaultValue={initial.healthCardNumber ?? ''} />
            </Field>
            <Field label="انتهاء الشهادة الصحية">
              <Input type="date" name="healthCardExpiry" defaultValue={initial.healthCardExpiry ?? ''} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Employment */}
      <Card>
        <CardBody>
          <SectionHeader icon={<Briefcase size={18} />} title="الوظيفة والعقد" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="الفرع *">
              <Select name="branchId" required defaultValue={initial.branchId ?? branches[0]?.id ?? ''}>
                {grouped.map(([brand, list]) =>
                  brand ? (
                    <optgroup key={brand} label={brand}>
                      {list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </optgroup>
                  ) : (
                    list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)
                  )
                )}
              </Select>
            </Field>
            <Field label="القسم">
              <Select name="department" defaultValue={initial.department ?? ''}>
                <option value="">—</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="الوظيفة">
              <Input name="jobTitle" defaultValue={initial.jobTitle ?? ''} />
            </Field>
            <Field label="تاريخ الالتحاق">
              <Input type="date" name="joinDate" defaultValue={initial.joinDate ?? ''} />
            </Field>
            <Field label="بداية العقد">
              <Input type="date" name="contractStart" defaultValue={initial.contractStart ?? ''} />
            </Field>
            <Field label="نهاية العقد">
              <Input type="date" name="contractEnd" defaultValue={initial.contractEnd ?? ''} />
            </Field>
            <Field label="نوع العقد">
              <Select name="contractType" defaultValue={initial.contractType ?? CONTRACT_TYPES[0]}>
                {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="حالة العامل">
              <Select name="status" defaultValue={initial.status ?? 'ACTIVE'}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Compensation */}
      <Card>
        <CardBody>
          <SectionHeader icon={<DollarSign size={18} />} title="الراتب والبنك" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="الراتب الأساسي (ر.س)">
              <Input type="number" min="0" step="50" name="basicSalary" defaultValue={initial.basicSalary?.toString() ?? ''} />
            </Field>
            <Field label="بدل السكن (ر.س)">
              <Input type="number" min="0" step="50" name="housingAllowance" defaultValue={initial.housingAllowance?.toString() ?? ''} />
            </Field>
            <Field label="العمولات (ر.س)">
              <Input type="number" min="0" step="50" name="commissions" defaultValue={initial.commissions?.toString() ?? ''} />
            </Field>
            <Field label="بدلات أخرى (ر.س)">
              <Input type="number" min="0" step="50" name="otherAllowances" defaultValue={initial.otherAllowances?.toString() ?? ''} />
            </Field>
            <Field label="طريقة الدفع">
              <Select name="paymentMethod" defaultValue={initial.paymentMethod ?? PAYMENT_METHODS[0]}>
                {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="رقم الآيبان" className="sm:col-span-2">
              <Input name="iban" dir="ltr" placeholder="SAxxxxxxxxxxxxxxxxxxxxxx" defaultValue={initial.iban ?? ''} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* GOSI */}
      <Card>
        <CardBody>
          <SectionHeader icon={<Shield size={18} />} title="التأمينات الاجتماعية (GOSI)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="رقم اشتراك التأمينات">
              <Input name="gosiSubscriptionNo" dir="ltr" defaultValue={initial.gosiSubscriptionNo ?? ''} />
            </Field>
            <Field label="الأجر الخاضع للاشتراك (ر.س)">
              <Input type="number" min="0" step="50" name="gosiSubjectWage" defaultValue={initial.gosiSubjectWage?.toString() ?? ''} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Custom fields */}
      {customFields.length > 0 && (
        <Card>
          <CardBody>
            <SectionHeader icon={<ListPlus size={18} />} title="بيانات إضافية" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {customFields.map((cf) => (
                <Field
                  key={cf.key}
                  label={`${cf.label}${cf.required ? ' *' : ''}`}
                  className={cf.type === 'textarea' ? 'sm:col-span-2' : undefined}
                >
                  <CustomFieldInput field={cf} value={customFieldValues[cf.key]} />
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Footer */}
      <div className="sticky bottom-0 bg-bg/90 backdrop-blur py-3 -mx-5 px-5 lg:-mx-6 lg:px-6 border-t border-border flex items-center justify-end gap-2">
        <Link href={mode === 'edit' && initial.id ? `/employees/${initial.id}` : '/employees'}>
          <Button type="button" variant="ghost" leftIcon={<ArrowRight size={16} />}>إلغاء</Button>
        </Link>
        <Button type="submit" disabled={isPending} leftIcon={<Save size={16} />}>
          {isPending ? 'جارٍ الحفظ…' : mode === 'create' ? 'إضافة العامل' : 'حفظ التعديلات'}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-700">
      <span className="w-8 h-8 rounded-md bg-primary-50 text-primary-700 grid place-items-center">{icon}</span>
      <CardTitle>{title}</CardTitle>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CustomFieldInput({ field, value }: { field: CustomFieldDef; value: unknown }) {
  const name = `cf_${field.key}`;
  const v = value == null ? '' : String(value);
  if (field.type === 'textarea') {
    return (
      <textarea
        name={name}
        defaultValue={v}
        required={field.required}
        className="w-full min-h-20 px-3 py-2 bg-white border border-border rounded-md text-ink-900 text-sm hover:border-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y"
      />
    );
  }
  if (field.type === 'select') {
    return (
      <Select name={name} defaultValue={v} required={field.required}>
        <option value="">—</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    );
  }
  if (field.type === 'boolean') {
    const checked = value === true || value === 'true' || value === 'on';
    return (
      <label className="h-10 flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name={name} defaultChecked={checked} className="w-4 h-4 rounded border-border accent-primary-600" />
        <span className="text-sm text-ink-700">نعم</span>
      </label>
    );
  }
  return (
    <Input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      name={name}
      defaultValue={v}
      required={field.required}
    />
  );
}

function groupBranches(branches: Branch[]): Array<[string, Branch[]]> {
  const map = new Map<string, Branch[]>();
  for (const b of branches) {
    const key = b.brand ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a && !b) return -1;
    if (!a && b) return 1;
    return a.localeCompare(b, 'ar');
  });
}

