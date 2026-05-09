import Link from 'next/link';
import { AlertCircle, AlertTriangle, CheckCircle2, Building2, Users, Award, FileText } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { fmtNumber, fmtShortDate } from '@/lib/utils';
import { tierFromDate } from '@/lib/alerts';
import { getDashboardData, getPayrollSummary, listEmployees } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [data, payroll, employees] = await Promise.all([
    getDashboardData(),
    getPayrollSummary(),
    listEmployees({ showInactive: true }),
  ]);

  // Per-branch breakdown
  const branchMap = new Map<string, { name: string; brand: string | null; count: number; salary: number }>();
  for (const r of payroll.rows) {
    const k = r.branchName;
    if (!branchMap.has(k)) branchMap.set(k, { name: k, brand: r.brand, count: 0, salary: 0 });
    const b = branchMap.get(k)!;
    b.count++;
    b.salary += r.total;
  }
  const branches = Array.from(branchMap.values()).sort((a, b) => b.count - a.count);

  // Inactive count
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const resignedCount = employees.filter((e) => e.status === 'RESIGNED').length;
  const finalExitCount = employees.filter((e) => e.status === 'FINAL_EXIT').length;

  // Top 5 most-urgent expiring documents
  const urgent = data.alerts
    .filter((a) => a.daysRemaining != null && a.daysRemaining <= 30)
    .sort((a, b) => (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9))
    .slice(0, 8);

  return (
    <>
      <Topbar title="التقارير" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full space-y-6">
        <header>
          <h1 className="text-xl font-bold text-ink-900">التقارير</h1>
          <p className="text-sm text-ink-500 mt-0.5">نظرة شاملة على المنشأة: امتثال، عمالة، رواتب.</p>
        </header>

        {/* Compliance overview */}
        <section>
          <h2 className="text-base font-bold text-ink-900 mb-3">الامتثال (الوثائق)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ComplianceCard
              icon={<CheckCircle2 size={20} />}
              tone="safe"
              label="سليمة (+30 يوم)"
              value={data.byTier.valid}
            />
            <ComplianceCard
              icon={<AlertTriangle size={20} />}
              tone="warning"
              label="قاربت على الانتهاء (≤30 يوم)"
              value={data.byTier.expiring}
            />
            <ComplianceCard
              icon={<AlertCircle size={20} />}
              tone="critical"
              label="منتهية"
              value={data.byTier.expired}
            />
          </div>
        </section>

        {/* Workforce */}
        <section>
          <h2 className="text-base font-bold text-ink-900 mb-3">القوى العاملة</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<Users size={20} />} label="نشطون" value={activeCount} tone="safe" />
            <KpiCard icon={<Users size={20} />} label="مستقيلون" value={resignedCount} tone="warning" />
            <KpiCard icon={<Users size={20} />} label="خروج نهائي" value={finalExitCount} tone="critical" />
            <KpiCard icon={<Building2 size={20} />} label="الفروع" value={data.counts.branches} tone="primary" />
          </div>
        </section>

        {/* Per-branch */}
        <section>
          <Card>
            <CardBody>
              <CardTitle>التوزيع حسب الفرع</CardTitle>
              <CardSub>عدد العمالة وإجمالي الرواتب لكل فرع.</CardSub>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold text-ink-500">
                      <th className="text-start px-3 py-2">الفرع</th>
                      <th className="text-start px-3 py-2">البراند</th>
                      <th className="text-start px-3 py-2">عدد العمالة</th>
                      <th className="text-start px-3 py-2">إجمالي الرواتب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b) => (
                      <tr key={b.name} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-semibold text-ink-900">{b.name}</td>
                        <td className="px-3 py-2">{b.brand ? <Pill variant="primary">{b.brand}</Pill> : '—'}</td>
                        <td className="px-3 py-2 num text-ink-700">{fmtNumber(b.count)}</td>
                        <td className="px-3 py-2 num font-bold text-primary-700">{fmtNumber(b.salary)} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Urgent items */}
        <section>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle>الأكثر إلحاحاً (تحتاج تجديد)</CardTitle>
                  <CardSub>أعلى 8 وثائق سيتم انتهاؤها قريباً.</CardSub>
                </div>
                <Link href="/dashboard" className="text-primary-700 text-sm font-semibold hover:underline">عرض الكل ←</Link>
              </div>
              {urgent.length === 0 ? (
                <p className="text-sm text-ink-500 text-center py-6">لا توجد وثائق قريبة من الانتهاء 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {urgent.map((u) => {
                    const t = tierFromDate(u.expiryDate);
                    return (
                      <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-slate-50">
                        <div>
                          <div className="text-sm font-semibold text-ink-900">{u.subjectName}</div>
                          <div className="text-xs text-ink-500">{u.documentType} · {fmtShortDate(u.expiryDate)}</div>
                        </div>
                        <div className="text-end">
                          <div className={`font-extrabold num ${t.fg}`}>
                            {u.daysRemaining != null ? Math.abs(u.daysRemaining) : '—'} <span className="text-xs font-normal">يوم</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </section>

        {/* Payroll */}
        <section>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle>الرواتب</CardTitle>
                  <CardSub>إجمالي شهري للعمالة النشطة.</CardSub>
                </div>
                <Link href="/payroll" className="text-primary-700 text-sm font-semibold hover:underline">التفاصيل ←</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <SmallStat label="أساسي" value={payroll.totals.basic} />
                <SmallStat label="سكن" value={payroll.totals.housing} />
                <SmallStat label="عمولات" value={payroll.totals.commissions} />
                <SmallStat label="أخرى" value={payroll.totals.other} />
                <SmallStat label="الإجمالي" value={payroll.totals.total} highlight />
              </div>
            </CardBody>
          </Card>
        </section>
      </main>
    </>
  );
}

function ComplianceCard({ icon, tone, label, value }: { icon: React.ReactNode; tone: 'safe' | 'warning' | 'critical'; label: string; value: number }) {
  const palette = {
    safe:     { bg: 'bg-green-50', fg: 'text-safe', border: 'border-green-100' },
    warning:  { bg: 'bg-amber-50', fg: 'text-warning', border: 'border-amber-100' },
    critical: { bg: 'bg-red-50', fg: 'text-critical', border: 'border-red-100' },
  }[tone];
  return (
    <div className={`${palette.bg} ${palette.border} border rounded-xl p-5 flex items-center gap-4`}>
      <div className={`${palette.fg} w-10 h-10 grid place-items-center bg-white rounded-md shrink-0`}>{icon}</div>
      <div>
        <div className="text-sm text-ink-700">{label}</div>
        <div className={`text-3xl font-extrabold num ${palette.fg}`}>{fmtNumber(value)}</div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'safe' | 'warning' | 'critical' | 'primary' }) {
  const palette = {
    safe:     { bg: 'bg-green-50', fg: 'text-safe' },
    warning:  { bg: 'bg-amber-50', fg: 'text-warning' },
    critical: { bg: 'bg-red-50', fg: 'text-critical' },
    primary:  { bg: 'bg-primary-50', fg: 'text-primary-700' },
  }[tone];
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={`${palette.bg} ${palette.fg} w-10 h-10 grid place-items-center rounded-md`}>{icon}</div>
        <div>
          <div className="text-xs text-ink-500">{label}</div>
          <div className="text-xl font-extrabold num text-ink-900">{fmtNumber(value)}</div>
        </div>
      </CardBody>
    </Card>
  );
}

function SmallStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-md ${highlight ? 'bg-primary-50' : 'bg-slate-50'}`}>
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-base font-extrabold num ${highlight ? 'text-primary-700' : 'text-ink-900'}`}>
        {fmtNumber(value)}
      </div>
    </div>
  );
}
