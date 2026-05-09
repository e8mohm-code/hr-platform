import { Topbar, type TopbarStat } from '@/components/layout/Topbar';
import { AlertGroupCard } from '@/features/alerts/AlertCard';
import { DonutChart } from '@/features/charts/DonutChart';
import { ExpiringByTypeChart } from '@/features/charts/ExpiringByTypeChart';
import { UpcomingTimelineChart } from '@/features/charts/UpcomingTimelineChart';
import { DocumentsTable } from '@/features/documents-table/DocumentsTable';
import { RemindersWidget } from '@/features/reminders/RemindersWidget';
import { Building2, Users, FileText, Award } from 'lucide-react';
import { groupByTier } from '@/lib/alerts';
import { getDashboardData, listBranches, listActiveReminders } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [data, branches, reminders] = await Promise.all([
    getDashboardData(),
    listBranches(),
    listActiveReminders(),
  ]);
  const groups = groupByTier(data.alerts);

  // expired + critical merged into one urgent group
  const criticalGroup = {
    tier: 'critical' as const,
    items: [
      ...(groups.find((g) => g.tier === 'expired')?.items ?? []),
      ...(groups.find((g) => g.tier === 'critical')?.items ?? []),
    ],
  };
  const warningGroup = groups.find((g) => g.tier === 'warning') ?? { tier: 'warning' as const, items: [] };
  const safeGroup    = groups.find((g) => g.tier === 'safe')    ?? { tier: 'safe' as const, items: [] };

  const notificationCount = data.byTier.expiring + data.byTier.expired;

  const topbarStats: TopbarStat[] = [
    { icon: <Building2 size={14} />, label: 'الفروع',   value: data.counts.branches,      tone: 'blue'   },
    { icon: <Users size={14} />,     label: 'العمالة',   value: data.counts.employees,     tone: 'indigo' },
    { icon: <Award size={14} />,     label: 'التراخيص',  value: data.counts.licenses,      tone: 'amber'  },
    { icon: <FileText size={14} />,  label: 'السجلات',   value: data.counts.registrations, tone: 'green'  },
  ];

  return (
    <>
      <Topbar
        title="لوحة التحكم"
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        notificationCount={notificationCount}
        primaryAction={{ label: 'إضافة وثيقة' }}
        stats={topbarStats}
      />
      <main className="flex-1 px-6 py-8 space-y-8 max-w-[1440px] mx-auto w-full">
        {/* Alerts — full width, 3 columns */}
        <section className="space-y-4">
          <header>
            <h2 className="m-0">تنبيهات الانتهاء</h2>
            <p className="text-body text-gray-500 mt-1">
              مرتّبة حسب أولوية التجديد. الإجراء الفوري ضروري للعناصر الحرجة.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AlertGroupCard tier="critical" items={criticalGroup.items} />
            <AlertGroupCard tier="warning"  items={warningGroup.items} />
            <AlertGroupCard tier="safe"     items={safeGroup.items} />
          </div>
        </section>

        {/* Reminders + Charts: reminders 1/3, charts 2/3 (donut + bar) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RemindersWidget reminders={reminders.map((r) => ({
              id: r.id,
              title: r.title,
              body: r.body,
              dueDate: r.dueDate,
              completed: r.completed,
              employee: r.employee ? {
                id: r.employee.id,
                fullName: r.employee.fullName,
                photoUrl: r.employee.photoUrl,
              } : null,
            }))} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <DonutChart data={data.byTier} />
            <ExpiringByTypeChart data={data.byType} />
          </div>
        </section>

        {/* Timeline (full width) */}
        <section>
          <UpcomingTimelineChart data={data.upcoming30} />
        </section>

        {/* Table */}
        <section>
          <DocumentsTable rows={data.tableRows} />
        </section>
      </main>
    </>
  );
}
