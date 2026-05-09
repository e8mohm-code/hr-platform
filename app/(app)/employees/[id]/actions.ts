'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type ActionResult = { ok: true } | { ok: false; error: string };

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function durationToMonths(s: string): number | null {
  const map: Record<string, number> = {
    '3': 3, '6': 6, '9': 9, '12': 12, '24': 24,
  };
  return map[s] ?? null;
}

type EmpCtx =
  | { error: string }
  | { estId: string; emp: NonNullable<Awaited<ReturnType<typeof prisma.employee.findFirst>>> };

async function ensureEmployee(id: string): Promise<EmpCtx> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { error: 'غير مصرّح.' };
  const emp = await prisma.employee.findFirst({
    where: { id, establishmentId: estId },
  });
  if (!emp) return { error: 'العامل غير موجود.' };
  return { estId, emp };
}

interface RenewInput {
  duration: string;          // '3' | '6' | '9' | '12' | '24' | 'custom'
  customDate: string;
  cost: string;
  note: string;
}

function resolveNewDate(currentExpiry: Date | null, input: RenewInput): Date | null {
  if (input.duration === 'custom') {
    return input.customDate ? new Date(input.customDate) : null;
  }
  const months = durationToMonths(input.duration);
  if (!months) return null;
  const base = currentExpiry ?? new Date();
  return addMonths(base, months);
}

/* ===== Renewals ===== */

export async function renewIqama(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const input: RenewInput = {
    duration: String(formData.get('duration') ?? ''),
    customDate: String(formData.get('customDate') ?? ''),
    cost: String(formData.get('cost') ?? ''),
    note: String(formData.get('note') ?? ''),
  };

  const newDate = resolveNewDate(ctx.emp.iqamaExpiry, input);
  if (!newDate) return { ok: false, error: 'مدّة التجديد أو التاريخ المخصص غير صحيح.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { iqamaExpiry: newDate },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'renew_iqama',
      subject: `تجديد إقامة → ${newDate.toISOString().slice(0, 10)}`,
      body: input.note || (input.cost ? `الرسوم: ${input.cost} ر.س` : ''),
      payload: JSON.stringify(input),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function renewContract(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const input: RenewInput = {
    duration: String(formData.get('duration') ?? ''),
    customDate: String(formData.get('customDate') ?? ''),
    cost: '',
    note: String(formData.get('note') ?? ''),
  };

  const newDate = resolveNewDate(ctx.emp.contractEnd, input);
  if (!newDate) return { ok: false, error: 'مدّة التجديد غير صحيحة.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { contractEnd: newDate },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'renew_contract',
      subject: `تجديد عقد → ${newDate.toISOString().slice(0, 10)}`,
      body: input.note || '',
      payload: JSON.stringify(input),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function renewHealthCard(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const input: RenewInput = {
    duration: String(formData.get('duration') ?? ''),
    customDate: String(formData.get('customDate') ?? ''),
    cost: String(formData.get('cost') ?? ''),
    note: '',
  };

  const newDate = resolveNewDate(ctx.emp.healthCardExpiry, input);
  if (!newDate) return { ok: false, error: 'مدّة التجديد غير صحيحة.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { healthCardExpiry: newDate },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'renew_health',
      subject: `تجديد شهادة صحية → ${newDate.toISOString().slice(0, 10)}`,
      body: input.cost ? `الرسوم: ${input.cost} ر.س` : '',
      payload: JSON.stringify(input),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  return { ok: true };
}

/* ===== Exit/Re-entry visa ===== */

export async function recordExitVisa(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const visaNumber = String(formData.get('visaNumber') ?? '').trim();
  const visaType = String(formData.get('visaType') ?? 'مفردة');
  const issueDate = String(formData.get('issueDate') ?? '');
  const expiryDate = String(formData.get('expiryDate') ?? '');
  const note = String(formData.get('note') ?? '');

  if (!visaNumber) return { ok: false, error: 'رقم التأشيرة مطلوب.' };
  if (!expiryDate) return { ok: false, error: 'تاريخ الانتهاء مطلوب.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { lastVisaNumber: visaNumber, lastVisaExpiry: new Date(expiryDate) },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'exit_reentry_visa',
      subject: `تأشيرة خروج وعودة #${visaNumber}`,
      body: `${visaType} · تنتهي ${expiryDate}${note ? ' · ' + note : ''}`,
      payload: JSON.stringify({ visaNumber, visaType, issueDate, expiryDate, note }),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}

/* ===== Transfer between branches ===== */

export async function transferBranch(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const newBranchId = String(formData.get('newBranchId') ?? '');
  const effectiveDate = String(formData.get('effectiveDate') ?? '');
  const reason = String(formData.get('reason') ?? '');

  if (!newBranchId) return { ok: false, error: 'الفرع الجديد مطلوب.' };

  const newBranch = await prisma.branch.findFirst({
    where: { id: newBranchId, establishmentId: ctx.estId },
  });
  if (!newBranch) return { ok: false, error: 'الفرع غير موجود.' };

  if (newBranchId === ctx.emp.branchId) {
    return { ok: false, error: 'الموظف موجود في هذا الفرع بالفعل.' };
  }

  const oldBranch = await prisma.branch.findUnique({ where: { id: ctx.emp.branchId } });

  await prisma.employee.update({
    where: { id: employeeId },
    data: { branchId: newBranchId },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'transfer_branch',
      subject: `نقل: ${oldBranch?.name ?? '—'} → ${newBranch.name}`,
      body: reason || (effectiveDate ? `بتاريخ ${effectiveDate}` : ''),
      payload: JSON.stringify({ newBranchId, effectiveDate, reason }),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  return { ok: true };
}

/* ===== Status changes ===== */

export async function recordResignation(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const resignDate = String(formData.get('resignDate') ?? '');
  const lastDay = String(formData.get('lastDay') ?? '');
  const reason = String(formData.get('reason') ?? '');

  if (!resignDate) return { ok: false, error: 'تاريخ الاستقالة مطلوب.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'RESIGNED' },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'resignation',
      subject: `استقالة بتاريخ ${resignDate}`,
      body: reason || (lastDay ? `آخر يوم: ${lastDay}` : ''),
      payload: JSON.stringify({ resignDate, lastDay, reason }),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  return { ok: true };
}

export async function recordFinalExit(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const exitDate = String(formData.get('exitDate') ?? '');
  const reason = String(formData.get('reason') ?? '');
  if (!exitDate) return { ok: false, error: 'تاريخ الخروج مطلوب.' };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'FINAL_EXIT' },
  });

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'final_exit',
      subject: `خروج نهائي بتاريخ ${exitDate}`,
      body: reason,
      payload: JSON.stringify({ exitDate, reason }),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  return { ok: true };
}

/* ===== Log-only actions ===== */

export async function recordWarning(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const severity = String(formData.get('severity') ?? 'إنذار أول');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!reason) return { ok: false, error: 'سبب الإنذار مطلوب.' };

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'warning',
      subject: severity,
      body: reason,
      payload: JSON.stringify({ severity, reason }),
      status: 'warning',
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}

export async function recordVacation(employeeId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const vacType = String(formData.get('vacType') ?? 'سنوية');
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '');
  const note = String(formData.get('note') ?? '');
  if (!startDate || !endDate) return { ok: false, error: 'تواريخ الإجازة مطلوبة.' };

  await prisma.activityLog.create({
    data: {
      establishmentId: ctx.estId,
      employeeId,
      target: ctx.emp.fullName,
      channel: 'system',
      actionType: 'vacation',
      subject: `إجازة ${vacType}`,
      body: `من ${startDate} إلى ${endDate}${note ? ' · ' + note : ''}`,
      payload: JSON.stringify({ vacType, startDate, endDate, note }),
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}
