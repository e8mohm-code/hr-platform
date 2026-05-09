'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type DocResult = { ok: true } | { ok: false; error: string };

const ALLOWED_TYPES = new Set(['PROFILE', 'IQAMA', 'PASSPORT', 'CONTRACT', 'HEALTH_CARD', 'OTHER']);

type EmpCtx = { error: string } | { estId: string; emp: NonNullable<Awaited<ReturnType<typeof prisma.employee.findFirst>>> };

async function ensureEmployee(id: string): Promise<EmpCtx> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { error: 'غير مصرّح.' };
  const emp = await prisma.employee.findFirst({ where: { id, establishmentId: estId } });
  if (!emp) return { error: 'العامل غير موجود.' };
  return { estId, emp };
}

export async function setEmployeePhoto(employeeId: string, url: string | null): Promise<DocResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  await prisma.employee.update({
    where: { id: employeeId },
    data: { photoUrl: url },
  });

  // Also store as a doc entry for history (only if URL set)
  if (url) {
    await prisma.employeeDocument.create({
      data: { employeeId, type: 'PROFILE', url },
    });
  }

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  return { ok: true };
}

export async function addEmployeeDocument(
  employeeId: string,
  type: string,
  url: string,
  fileName: string,
): Promise<DocResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };
  if (!ALLOWED_TYPES.has(type)) return { ok: false, error: 'نوع غير مسموح.' };

  await prisma.employeeDocument.create({
    data: { employeeId, type, url, fileName },
  });
  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}

export async function removeEmployeeDocument(employeeId: string, docId: string): Promise<DocResult> {
  const ctx = await ensureEmployee(employeeId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const doc = await prisma.employeeDocument.findFirst({
    where: { id: docId, employeeId },
  });
  if (!doc) return { ok: false, error: 'المرفق غير موجود.' };

  await prisma.employeeDocument.delete({ where: { id: docId } });
  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}
