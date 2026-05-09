import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { listBranches, getEstablishmentSettings } from '@/lib/data';
import { EmployeeForm } from '../_components/EmployeeForm';

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewEmployeePage({ searchParams }: Props) {
  const [branches, settings] = await Promise.all([listBranches(), getEstablishmentSettings()]);
  if (branches.length === 0) redirect('/branches');

  const params = await searchParams;

  return (
    <>
      <Topbar title="إضافة عامل جديد" />
      <main className="flex-1 p-5 lg:p-6 max-w-3xl mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">عامل جديد</h1>
          <p className="text-sm text-ink-500 mt-0.5">عبّئ البيانات الأساسية. تقدر تكمّل الباقي لاحقاً.</p>
        </header>

        <EmployeeForm
          mode="create"
          branches={branches.map((b) => ({ id: b.id, name: b.name, brand: b.brand }))}
          customFields={settings?.customEmployeeFields ?? []}
          initialError={params.error}
        />
      </main>
    </>
  );
}
