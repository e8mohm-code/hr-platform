import { notFound } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { getEmployee, listBranches, getEstablishmentSettings } from '@/lib/data';
import { EmployeeForm, type EmployeeFormData } from '../../_components/EmployeeForm';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

function dateToInput(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function decimalToInput(d: { toString(): string } | null | undefined): string {
  if (d == null) return '';
  return d.toString();
}

export default async function EditEmployeePage({ params, searchParams }: Props) {
  const { id } = await params;
  const [emp, branches, settings] = await Promise.all([
    getEmployee(id),
    listBranches(),
    getEstablishmentSettings(),
  ]);
  if (!emp) notFound();

  const sp = await searchParams;
  const customFieldValues = parseJsonRecord(emp.customFields);

  const initial: EmployeeFormData = {
    id: emp.id,
    fullName: emp.fullName,
    gender: emp.gender,
    nationality: emp.nationality,
    dob: dateToInput(emp.dob),
    phone: emp.phone,
    email: emp.email,
    employeeNo: emp.employeeNo,
    iqamaNumber: emp.iqamaNumber,
    iqamaExpiry: dateToInput(emp.iqamaExpiry),
    sponsorNumber: emp.sponsorNumber,
    healthCardNumber: emp.healthCardNumber,
    healthCardExpiry: dateToInput(emp.healthCardExpiry),
    branchId: emp.branchId,
    jobTitle: emp.jobTitle,
    department: emp.department,
    joinDate: dateToInput(emp.joinDate),
    contractStart: dateToInput(emp.contractStart),
    contractEnd: dateToInput(emp.contractEnd),
    contractType: emp.contractType,
    basicSalary: decimalToInput(emp.basicSalary),
    housingAllowance: decimalToInput(emp.housingAllowance),
    commissions: decimalToInput(emp.commissions),
    otherAllowances: decimalToInput(emp.otherAllowances),
    paymentMethod: emp.paymentMethod,
    iban: emp.iban,
    gosiSubscriptionNo: emp.gosiSubscriptionNo,
    gosiSubjectWage: decimalToInput(emp.gosiSubjectWage),
    status: emp.status as 'ACTIVE' | 'RESIGNED' | 'FINAL_EXIT',
  };

  return (
    <>
      <Topbar title={`تعديل: ${emp.fullName}`} />
      <main className="flex-1 p-5 lg:p-6 max-w-3xl mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">تعديل بيانات العامل</h1>
          <p className="text-sm text-ink-500 mt-0.5">{emp.fullName}</p>
        </header>

        <EmployeeForm
          mode="edit"
          branches={branches.map((b) => ({ id: b.id, name: b.name, brand: b.brand }))}
          customFields={settings?.customEmployeeFields ?? []}
          customFieldValues={customFieldValues}
          initial={initial}
          initialError={sp.error}
        />
      </main>
    </>
  );
}

function parseJsonRecord(s: string | null): Record<string, unknown> {
  if (!s) return {};
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
