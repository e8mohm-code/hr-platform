import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, ArrowRight, User, IdCard, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { ListPlus, Camera } from 'lucide-react';
import { getEmployee, listBranches, listActivityForEmployee, getEstablishmentSettings, listRemindersForEmployee } from '@/lib/data';
import { tierFromDate } from '@/lib/alerts';
import { fmtDate, fmtNumber } from '@/lib/utils';
import { ActionPanel } from './_components/ActionPanel';
import { EmployeeArchive } from './_components/EmployeeArchive';
import { EmployeePhotos } from './_components/EmployeePhotos';
import { EmployeeReminders } from './_components/EmployeeReminders';

const STATUS_LABELS: Record<string, { label: string; variant: 'safe' | 'warning' | 'critical' }> = {
  ACTIVE:     { label: 'نشط',         variant: 'safe' },
  RESIGNED:   { label: 'مستقيل',       variant: 'warning' },
  FINAL_EXIT: { label: 'خروج نهائي',   variant: 'critical' },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const [emp, branches, archive, settings, reminders] = await Promise.all([
    getEmployee(id),
    listBranches(),
    listActivityForEmployee(id),
    getEstablishmentSettings(),
    listRemindersForEmployee(id),
  ]);
  if (!emp) notFound();

  const customFields = settings?.customEmployeeFields ?? [];
  const customFieldValues = parseJsonRecord(emp.customFields);

  const tIqama = tierFromDate(emp.iqamaExpiry);
  const tHealth = tierFromDate(emp.healthCardExpiry);
  const tContract = tierFromDate(emp.contractEnd);
  const status = STATUS_LABELS[emp.status];

  const totalWage =
    Number(emp.basicSalary ?? 0) +
    Number(emp.housingAllowance ?? 0) +
    Number(emp.commissions ?? 0) +
    Number(emp.otherAllowances ?? 0);

  return (
    <>
      <Topbar title={emp.fullName} />
      <main className="flex-1 p-5 lg:p-6 max-w-5xl mx-auto w-full space-y-5">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-4">
            {/* Profile photo / initials */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-primary-50 grid place-items-center text-primary-700 font-extrabold text-xl shrink-0">
              {emp.photoUrl ? (
                <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{emp.fullName.trim().charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-ink-900">{emp.fullName}</h1>
                <Pill variant={status.variant}>{status.label}</Pill>
                {emp.branch?.brandRef && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-ink-700">
                    {emp.branch.brandRef.logoUrl && (
                      <img src={emp.branch.brandRef.logoUrl} alt="" className="w-4 h-4 rounded object-cover" />
                    )}
                    {emp.branch.brandRef.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-500 mt-0.5">
                {[emp.jobTitle, emp.department, emp.branch?.name].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/employees">
              <Button variant="secondary" leftIcon={<ArrowRight size={16} />}>القائمة</Button>
            </Link>
            <Link href={`/employees/${emp.id}/edit`}>
              <Button leftIcon={<Pencil size={16} />}>تعديل</Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal */}
          <Card>
            <CardBody>
              <SectionHeader icon={<User size={18} />} title="البيانات الشخصية" />
              <KV>
                <Row k="الجنس" v={emp.gender ?? '—'} />
                <Row k="الجنسية" v={emp.nationality ?? '—'} />
                <Row k="تاريخ الميلاد" v={fmtDate(emp.dob)} />
                <Row k="الجوال" v={emp.phone ?? '—'} ltr />
                <Row k="البريد" v={emp.email ?? '—'} ltr />
              </KV>
            </CardBody>
          </Card>

          {/* IDs */}
          <Card>
            <CardBody>
              <SectionHeader icon={<IdCard size={18} />} title="الهويات والوثائق" />
              <KV>
                <Row k="الرقم الوظيفي" v={emp.employeeNo ?? '—'} ltr />
                <Row k="رقم الإقامة" v={emp.iqamaNumber ?? '—'} ltr />
                <Row
                  k="انتهاء الإقامة"
                  v={
                    <span className="flex items-center gap-2 flex-wrap">
                      {fmtDate(emp.iqamaExpiry)}
                      <Pill variant={tierToVariant(tIqama.key)}>{tIqama.label}</Pill>
                    </span>
                  }
                />
                <Row k="الرقم الموحد" v={emp.sponsorNumber ?? '—'} ltr />
                <Row k="رقم الشهادة الصحية" v={emp.healthCardNumber ?? '—'} ltr />
                <Row
                  k="انتهاء الشهادة الصحية"
                  v={
                    <span className="flex items-center gap-2 flex-wrap">
                      {fmtDate(emp.healthCardExpiry)}
                      {emp.healthCardExpiry && <Pill variant={tierToVariant(tHealth.key)}>{tHealth.label}</Pill>}
                    </span>
                  }
                />
              </KV>
            </CardBody>
          </Card>

          {/* Employment */}
          <Card>
            <CardBody>
              <SectionHeader icon={<Briefcase size={18} />} title="الوظيفة والعقد" />
              <KV>
                <Row
                  k="الفرع"
                  v={
                    <span className="flex items-center gap-2 flex-wrap">
                      {emp.branch?.name ?? '—'}
                      {emp.branch?.brand && <Pill variant="primary">{emp.branch.brand}</Pill>}
                    </span>
                  }
                />
                <Row k="القسم" v={emp.department ?? '—'} />
                <Row k="الوظيفة" v={emp.jobTitle ?? '—'} />
                <Row k="تاريخ الالتحاق" v={fmtDate(emp.joinDate)} />
                <Row k="بداية العقد" v={fmtDate(emp.contractStart)} />
                <Row
                  k="نهاية العقد"
                  v={
                    <span className="flex items-center gap-2 flex-wrap">
                      {fmtDate(emp.contractEnd)}
                      <Pill variant={tierToVariant(tContract.key)}>{tContract.label}</Pill>
                    </span>
                  }
                />
                <Row k="نوع العقد" v={emp.contractType ?? '—'} />
              </KV>
            </CardBody>
          </Card>

          {/* Compensation */}
          <Card>
            <CardBody>
              <SectionHeader icon={<DollarSign size={18} />} title="الراتب والبنك" />
              <KV>
                <Row k="الراتب الأساسي" v={`${fmtNumber(Number(emp.basicSalary ?? 0))} ر.س`} />
                <Row k="بدل السكن" v={`${fmtNumber(Number(emp.housingAllowance ?? 0))} ر.س`} />
                <Row k="العمولات" v={`${fmtNumber(Number(emp.commissions ?? 0))} ر.س`} />
                <Row k="بدلات أخرى" v={`${fmtNumber(Number(emp.otherAllowances ?? 0))} ر.س`} />
                <Row
                  k={<strong className="text-ink-900">إجمالي الأجر</strong>}
                  v={<strong className="text-primary-700 num">{fmtNumber(totalWage)} ر.س</strong>}
                />
                <Row k="طريقة الدفع" v={emp.paymentMethod ?? '—'} />
                <Row k="رقم الآيبان" v={emp.iban ?? '—'} ltr mono />
              </KV>
            </CardBody>
          </Card>

          {/* GOSI */}
          <Card className="lg:col-span-2">
            <CardBody>
              <SectionHeader icon={<Shield size={18} />} title="التأمينات الاجتماعية" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <Row k="رقم الاشتراك" v={emp.gosiSubscriptionNo ?? '—'} ltr />
                <Row k="الأجر الخاضع" v={`${fmtNumber(Number(emp.gosiSubjectWage ?? 0))} ر.س`} />
              </div>
            </CardBody>
          </Card>

          {/* Custom fields */}
          {customFields.length > 0 && (
            <Card className="lg:col-span-2">
              <CardBody>
                <SectionHeader icon={<ListPlus size={18} />} title="بيانات إضافية" />
                <KV>
                  {customFields.map((cf) => {
                    const raw = customFieldValues[cf.key];
                    let display: React.ReactNode = '—';
                    if (raw === true || raw === 'true' || raw === 'on') display = 'نعم';
                    else if (raw === false || raw === 'false') display = 'لا';
                    else if (raw != null && raw !== '') display = String(raw);
                    return <Row key={cf.key} k={cf.label} v={display} />;
                  })}
                </KV>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Reminders */}
        <EmployeeReminders
          employeeId={emp.id}
          reminders={reminders.map((r) => ({
            id: r.id, title: r.title, body: r.body,
            dueDate: r.dueDate, completed: r.completed,
          }))}
        />

        {/* Photos & Documents */}
        <EmployeePhotos
          employeeId={emp.id}
          photoUrl={emp.photoUrl}
          documents={emp.documents
            .filter((d) => d.type !== 'PROFILE')
            .map((d) => ({ id: d.id, type: d.type, url: d.url, fileName: d.fileName }))}
        />

        {/* Actions + Archive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ActionPanel
            employeeId={emp.id}
            currentBranchId={emp.branchId}
            branches={branches.map((b) => ({ id: b.id, name: b.name, brand: b.brand }))}
          />
          <EmployeeArchive
            entries={archive.map((a) => ({
              id: a.id, ts: a.ts, channel: a.channel,
              actionType: a.actionType, subject: a.subject,
              body: a.body, status: a.status,
            }))}
          />
        </div>
      </main>
    </>
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

function KV({ children }: { children: React.ReactNode }) {
  return <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2.5 text-sm">{children}</dl>;
}

function Row({
  k,
  v,
  ltr = false,
  mono = false,
}: {
  k: React.ReactNode;
  v: React.ReactNode;
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-ink-500">{k}</dt>
      <dd className={`text-ink-900 font-medium ${ltr ? 'text-start' : ''} ${mono ? 'font-mono text-xs' : ''}`} dir={ltr ? 'ltr' : undefined}>
        {v}
      </dd>
    </>
  );
}

function tierToVariant(tier: string): 'critical' | 'warning' | 'safe' | 'neutral' {
  if (tier === 'expired' || tier === 'critical') return 'critical';
  if (tier === 'warning') return 'warning';
  if (tier === 'safe') return 'safe';
  return 'neutral';
}

function parseJsonRecord(s: string | null): Record<string, unknown> {
  if (!s) return {};
  try {
    const p = JSON.parse(s);
    return p && typeof p === 'object' ? p : {};
  } catch { return {}; }
}
