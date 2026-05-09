import { Topbar } from '@/components/layout/Topbar';
import { listEmployees, listAttendanceForMonth } from '@/lib/data';
import { AttendanceGrid, AttendanceLegend, MonthNav } from './_components/AttendanceGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ y?: string; m?: string }>;
}

export default async function AttendancePage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date();
  const year = params.y ? Number(params.y) : today.getFullYear();
  const monthIndex = params.m !== undefined ? Number(params.m) : today.getMonth();

  const [employees, records] = await Promise.all([
    listEmployees({}),
    listAttendanceForMonth(year, monthIndex),
  ]);

  return (
    <>
      <Topbar title="الحضور والإجازات" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-ink-900">الحضور والإجازات</h1>
            <p className="text-sm text-ink-500 mt-0.5">انقر على الخلية لتدوير الحالة: حاضر → متأخر → غائب → إجازة → فارغ.</p>
          </div>
          <MonthNav year={year} month={monthIndex} />
        </header>

        <div className="bg-white border border-border rounded-md p-3 mb-4">
          <AttendanceLegend />
        </div>

        {employees.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="لا يوجد عمال نشطون"
            description="أضف عمالاً أولاً ليظهروا في شبكة الحضور."
          />
        ) : (
          <AttendanceGrid
            year={year}
            month={monthIndex}
            employees={employees.map((e) => ({
              id: e.id,
              fullName: e.fullName,
              branchName: e.branch.name,
            }))}
            records={records.map((r) => ({
              employeeId: r.employeeId,
              date: r.date.toISOString().slice(0, 10),
              status: r.status as 'present' | 'late' | 'absent' | 'vacation',
            }))}
          />
        )}
      </main>
    </>
  );
}
