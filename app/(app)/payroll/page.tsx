import { Topbar } from '@/components/layout/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet } from 'lucide-react';
import { getPayrollSummary } from '@/lib/data';
import { fmtNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const { rows, totals } = await getPayrollSummary();

  return (
    <>
      <Topbar title="الرواتب" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">الرواتب</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            ملخص شهري بالرواتب الأساسية والبدلات لكل العمالة النشطة.
          </p>
        </header>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} />}
            title="لا توجد بيانات رواتب"
            description="أضف عمّالاً لتظهر بياناتهم هنا."
          />
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <KpiBox label="الراتب الأساسي" value={totals.basic} />
              <KpiBox label="بدل السكن" value={totals.housing} />
              <KpiBox label="العمولات" value={totals.commissions} />
              <KpiBox label="بدلات أخرى" value={totals.other} />
              <KpiBox label="الإجمالي" value={totals.total} highlight />
            </div>

            <Card>
              <CardBody className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                        <th className="text-start px-5 py-3">الموظف</th>
                        <th className="text-start px-5 py-3">الفرع</th>
                        <th className="text-start px-5 py-3">أساسي</th>
                        <th className="text-start px-5 py-3">سكن</th>
                        <th className="text-start px-5 py-3">عمولات</th>
                        <th className="text-start px-5 py-3">أخرى</th>
                        <th className="text-start px-5 py-3 font-extrabold text-ink-900">الإجمالي</th>
                        <th className="text-start px-5 py-3">الدفع</th>
                        <th className="text-start px-5 py-3">الآيبان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-semibold text-ink-900">{r.fullName}</div>
                            <div className="text-xs text-ink-500">{r.jobTitle ?? '—'} {r.employeeNo ? `· ${r.employeeNo}` : ''}</div>
                          </td>
                          <td className="px-5 py-3 text-ink-700">
                            <div>{r.branchName}</div>
                            {r.brand && <div className="text-xs text-ink-500">{r.brand}</div>}
                          </td>
                          <td className="px-5 py-3 num text-ink-700">{fmtNumber(r.basic)}</td>
                          <td className="px-5 py-3 num text-ink-700">{fmtNumber(r.housing)}</td>
                          <td className="px-5 py-3 num text-ink-700">{fmtNumber(r.commissions)}</td>
                          <td className="px-5 py-3 num text-ink-700">{fmtNumber(r.other)}</td>
                          <td className="px-5 py-3 num font-extrabold text-primary-700">{fmtNumber(r.total)}</td>
                          <td className="px-5 py-3">
                            {r.paymentMethod ? <Pill variant="primary">{r.paymentMethod}</Pill> : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs text-ink-500 font-mono" dir="ltr">{r.iban ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

function KpiBox({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'bg-primary-50 border-primary-100' : ''}>
      <CardBody>
        <div className="text-xs text-ink-500">{label}</div>
        <div className={`mt-1 num text-xl font-extrabold ${highlight ? 'text-primary-700' : 'text-ink-900'}`}>
          {fmtNumber(value)} <span className="text-sm font-normal">ر.س</span>
        </div>
      </CardBody>
    </Card>
  );
}
