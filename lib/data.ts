/**
 * Data-access layer for the dashboard.
 * Always scoped to the current user's establishment via the session.
 */

import { auth } from '@/auth';
import { prisma } from './prisma';
import { daysUntil } from './utils';
import type { AlertItem } from './alerts';

export async function getCurrentEstablishmentId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.establishmentId ?? null;
}

export interface DashboardData {
  alerts: AlertItem[];
  counts: {
    branches: number;
    employees: number;
    licenses: number;
    registrations: number;
  };
  byTier: { valid: number; expiring: number; expired: number };
  byType: { iqama: number; license: number; health: number; contract: number; registration: number };
  upcoming30: Array<{ date: string; count: number }>;
  tableRows: Array<{
    id: string;
    name: string;
    docType: string;
    docTypeKey: string;
    expiryDate: Date | null;
    daysRemaining: number | null;
    branch: string | null;
  }>;
}

/**
 * Returns aggregate dashboard data for the user's establishment.
 * If no session, returns empty placeholder.
 */
export async function getDashboardData(branchId?: string): Promise<DashboardData> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) {
    return emptyDashboard();
  }

  const branchFilter = branchId ? { branchId } : {};

  const [employees, licenses, registrations, branchesCount] = await Promise.all([
    prisma.employee.findMany({
      where: { establishmentId: estId, status: 'ACTIVE', ...branchFilter },
      include: { branch: { select: { name: true } } },
    }),
    prisma.license.findMany({
      where: { establishmentId: estId, ...branchFilter },
      include: { branch: { select: { name: true } } },
    }),
    prisma.registration.findMany({
      where: { establishmentId: estId },
    }),
    prisma.branch.count({ where: { establishmentId: estId } }),
  ]);

  // Build alerts list (Iqama, Health Card, Contract, License, Registration)
  const alerts: AlertItem[] = [];

  for (const e of employees) {
    if (e.iqamaExpiry) {
      alerts.push({
        id: `iqama-${e.id}`,
        documentType: 'إقامة',
        documentTypeKey: 'iqama',
        subjectName: e.fullName,
        expiryDate: e.iqamaExpiry,
        daysRemaining: daysUntil(e.iqamaExpiry),
        href: `/employees/${e.id}`,
      });
    }
    if (e.healthCardExpiry) {
      alerts.push({
        id: `health-${e.id}`,
        documentType: 'شهادة صحية',
        documentTypeKey: 'health',
        subjectName: e.fullName,
        expiryDate: e.healthCardExpiry,
        daysRemaining: daysUntil(e.healthCardExpiry),
        href: `/employees/${e.id}`,
      });
    }
    if (e.contractEnd) {
      alerts.push({
        id: `contract-${e.id}`,
        documentType: 'عقد عمل',
        documentTypeKey: 'contract',
        subjectName: e.fullName,
        expiryDate: e.contractEnd,
        daysRemaining: daysUntil(e.contractEnd),
        href: `/employees/${e.id}`,
      });
    }
  }

  for (const l of licenses) {
    alerts.push({
      id: `license-${l.id}`,
      documentType: l.type,
      documentTypeKey: 'license',
      subjectName: l.branch?.name ?? '—',
      expiryDate: l.expiryDate,
      daysRemaining: daysUntil(l.expiryDate),
      href: `/documents`,
    });
  }
  for (const r of registrations) {
    alerts.push({
      id: `registration-${r.id}`,
      documentType: r.type,
      documentTypeKey: 'registration',
      subjectName: r.number,
      expiryDate: r.expiryDate,
      daysRemaining: daysUntil(r.expiryDate),
      href: `/documents`,
    });
  }

  // Counts: tier buckets
  const byTier = { valid: 0, expiring: 0, expired: 0 };
  const byType = { iqama: 0, license: 0, health: 0, contract: 0, registration: 0 };

  for (const a of alerts) {
    if (a.daysRemaining == null) continue;
    if (a.daysRemaining < 0) byTier.expired++;
    else if (a.daysRemaining <= 30) byTier.expiring++;
    else byTier.valid++;

    if (a.daysRemaining <= 30) {
      byType[a.documentTypeKey as keyof typeof byType]++;
    }
  }

  // Upcoming 30 days timeline (count of expirations per day)
  const upcomingMap = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    upcomingMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const a of alerts) {
    if (a.daysRemaining == null) continue;
    if (a.daysRemaining < 0 || a.daysRemaining > 29) continue;
    const key = a.expiryDate?.toISOString().slice(0, 10);
    if (key && upcomingMap.has(key)) {
      upcomingMap.set(key, (upcomingMap.get(key) ?? 0) + 1);
    }
  }
  const upcoming30 = Array.from(upcomingMap.entries()).map(([date, count]) => ({ date, count }));

  // Detailed table rows
  const tableRows = alerts.map((a) => ({
    id: a.id,
    name: a.subjectName,
    docType: a.documentType,
    docTypeKey: a.documentTypeKey,
    expiryDate: a.expiryDate,
    daysRemaining: a.daysRemaining,
    branch: null,
  }));

  return {
    alerts,
    counts: {
      branches: branchesCount,
      employees: employees.length,
      licenses: licenses.length,
      registrations: registrations.length,
    },
    byTier,
    byType,
    upcoming30,
    tableRows,
  };
}

function emptyDashboard(): DashboardData {
  return {
    alerts: [],
    counts: { branches: 0, employees: 0, licenses: 0, registrations: 0 },
    byTier: { valid: 0, expiring: 0, expired: 0 },
    byType: { iqama: 0, license: 0, health: 0, contract: 0, registration: 0 },
    upcoming30: [],
    tableRows: [],
  };
}

export async function listBranches() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.branch.findMany({
    where: { establishmentId: estId },
    include: { brandRef: { select: { id: true, name: true, logoUrl: true } } },
    orderBy: [{ brand: 'asc' }, { name: 'asc' }],
  });
}

export async function listBrands() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.brand.findMany({
    where: { establishmentId: estId },
    orderBy: { name: 'asc' },
  });
}

export async function getBrand(id: string) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return null;
  return prisma.brand.findFirst({ where: { id, establishmentId: estId } });
}

export async function getBranch(id: string) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return null;
  return prisma.branch.findFirst({
    where: { id, establishmentId: estId },
  });
}

export interface EmployeeFilters {
  q?: string;
  branchId?: string;
  showInactive?: boolean;
}

export async function listEmployees(filters: EmployeeFilters = {}) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];

  const where: Record<string, unknown> = { establishmentId: estId };

  if (!filters.showInactive) where.status = 'ACTIVE';
  if (filters.branchId) where.branchId = filters.branchId;

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { fullName:    { contains: q } },
      { iqamaNumber: { contains: q } },
      { jobTitle:    { contains: q } },
      { email:       { contains: q } },
      { employeeNo:  { contains: q } },
      { phone:       { contains: q } },
    ];
  }

  return prisma.employee.findMany({
    where,
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          brand: true,
          brandRef: { select: { name: true, logoUrl: true } },
        },
      },
    },
    orderBy: [{ iqamaExpiry: 'asc' }, { fullName: 'asc' }],
  });
}

export async function getEmployee(id: string) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return null;
  return prisma.employee.findFirst({
    where: { id, establishmentId: estId },
    include: {
      branch: { include: { brandRef: true } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  });
}

export async function countInactiveEmployees() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return 0;
  return prisma.employee.count({
    where: { establishmentId: estId, status: { not: 'ACTIVE' } },
  });
}

/* ===== Documents ===== */

export async function listRegistrations() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.registration.findMany({
    where: { establishmentId: estId },
    orderBy: [{ expiryDate: 'asc' }],
  });
}

export async function listLicenses() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.license.findMany({
    where: { establishmentId: estId },
    include: { branch: { select: { id: true, name: true, brand: true } } },
    orderBy: [{ expiryDate: 'asc' }],
  });
}

/* ===== Settings ===== */

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

export async function getEstablishmentSettings() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return null;
  const est = await prisma.establishment.findUnique({
    where: { id: estId },
    select: { customEmployeeFields: true, vacationEntitlementDays: true },
  });
  return {
    customEmployeeFields: parseJson<CustomFieldDef[]>(est?.customEmployeeFields, []),
    vacationEntitlementDays: est?.vacationEntitlementDays ?? 30,
  };
}

/* ===== Reminders ===== */

export async function listActiveReminders() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.reminder.findMany({
    where: { establishmentId: estId, completed: false },
    include: { employee: { select: { id: true, fullName: true, photoUrl: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function listRemindersForEmployee(employeeId: string) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.reminder.findMany({
    where: { establishmentId: estId, employeeId },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

/* ===== Activity log ===== */

export async function listActivityForEmployee(employeeId: string) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  return prisma.activityLog.findMany({
    where: { establishmentId: estId, employeeId },
    orderBy: { ts: 'desc' },
  });
}

/* ===== Attendance ===== */

export async function listAttendanceForMonth(year: number, monthIndex: number) {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return [];
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return prisma.attendance.findMany({
    where: {
      establishmentId: estId,
      date: { gte: start, lt: end },
    },
  });
}

/* ===== Payroll summary ===== */

export async function getPayrollSummary() {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { rows: [], totals: { basic: 0, housing: 0, commissions: 0, other: 0, total: 0 } };
  const employees = await prisma.employee.findMany({
    where: { establishmentId: estId, status: 'ACTIVE' },
    include: { branch: { select: { name: true, brand: true } } },
    orderBy: [{ branch: { name: 'asc' } }, { fullName: 'asc' }],
  });
  const rows = employees.map((e) => {
    const basic = Number(e.basicSalary ?? 0);
    const housing = Number(e.housingAllowance ?? 0);
    const commissions = Number(e.commissions ?? 0);
    const other = Number(e.otherAllowances ?? 0);
    return {
      id: e.id,
      fullName: e.fullName,
      employeeNo: e.employeeNo,
      branchName: e.branch.name,
      brand: e.branch.brand,
      jobTitle: e.jobTitle,
      iban: e.iban,
      paymentMethod: e.paymentMethod,
      basic,
      housing,
      commissions,
      other,
      total: basic + housing + commissions + other,
    };
  });
  const totals = rows.reduce(
    (acc, r) => ({
      basic: acc.basic + r.basic,
      housing: acc.housing + r.housing,
      commissions: acc.commissions + r.commissions,
      other: acc.other + r.other,
      total: acc.total + r.total,
    }),
    { basic: 0, housing: 0, commissions: 0, other: 0, total: 0 }
  );
  return { rows, totals };
}

/* ===== Helpers ===== */

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
