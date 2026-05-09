import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { listEmployees, listBranches, countInactiveEmployees } from '@/lib/data';
import { EmployeesFilters } from './_components/EmployeesFilters';
import { EmployeesTable } from './_components/EmployeesTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; branch?: string; inactive?: string }>;
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    branchId: params.branch,
    showInactive: params.inactive === '1',
  };

  const [employees, branches, inactiveCount] = await Promise.all([
    listEmployees(filters),
    listBranches(),
    countInactiveEmployees(),
  ]);

  return (
    <>
      <Topbar title="العمالة" branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-ink-900">العمالة</h1>
            <p className="text-sm text-ink-500 mt-0.5">
              {employees.length} عامل {filters.showInactive ? '(يشمل غير النشطين)' : 'نشط'}.
            </p>
          </div>
          <Link href="/employees/new">
            <Button leftIcon={<Plus size={16} />}>إضافة عامل</Button>
          </Link>
        </header>

        {branches.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="أضف فرعاً أولاً"
            description="لإضافة عمال، يجب أن يكون عندك فرع واحد على الأقل في المنشأة."
            action={
              <Link href="/branches">
                <Button>الذهاب لشاشة الفروع</Button>
              </Link>
            }
          />
        ) : (
          <>
            <EmployeesFilters
              branches={branches.map((b) => ({ id: b.id, name: b.name }))}
              inactiveCount={inactiveCount}
            />

            <EmployeesTable
              rows={employees.map((e) => ({
                id: e.id,
                fullName: e.fullName,
                photoUrl: e.photoUrl,
                nationality: e.nationality,
                gender: e.gender,
                employeeNo: e.employeeNo,
                iqamaNumber: e.iqamaNumber,
                iqamaExpiry: e.iqamaExpiry,
                jobTitle: e.jobTitle,
                department: e.department,
                branchName: e.branch.name,
                brandName: e.branch.brandRef?.name ?? e.branch.brand,
                brandLogoUrl: e.branch.brandRef?.logoUrl ?? null,
                healthCardExpiry: e.healthCardExpiry,
                healthCardNumber: e.healthCardNumber,
                status: e.status,
              }))}
            />
          </>
        )}
      </main>
    </>
  );
}
