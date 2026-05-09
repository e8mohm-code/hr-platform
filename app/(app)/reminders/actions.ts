'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type ReminderResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  title:      z.string().min(1, 'العنوان مطلوب').max(160),
  body:       z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  dueDate:    z.preprocess((v) => (v === '' || v == null ? null : new Date(String(v))), z.date().nullable()),
  employeeId: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
});

export async function createReminder(data: {
  title: string;
  body: string | null;
  dueDate: string | null;
  employeeId: string | null;
}): Promise<ReminderResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  // Verify employee belongs to establishment if specified
  if (parsed.data.employeeId) {
    const emp = await prisma.employee.findFirst({
      where: { id: parsed.data.employeeId, establishmentId: estId },
    });
    if (!emp) return { ok: false, error: 'الموظف غير موجود.' };
  }

  await prisma.reminder.create({
    data: { ...parsed.data, establishmentId: estId },
  });

  revalidatePath('/dashboard');
  if (parsed.data.employeeId) revalidatePath(`/employees/${parsed.data.employeeId}`);
  return { ok: true };
}

export async function toggleReminder(id: string): Promise<ReminderResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.reminder.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'التذكير غير موجود.' };
  await prisma.reminder.update({
    where: { id },
    data: { completed: !existing.completed },
  });
  revalidatePath('/dashboard');
  if (existing.employeeId) revalidatePath(`/employees/${existing.employeeId}`);
  return { ok: true };
}

export async function deleteReminder(id: string): Promise<ReminderResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.reminder.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'التذكير غير موجود.' };
  await prisma.reminder.delete({ where: { id } });
  revalidatePath('/dashboard');
  if (existing.employeeId) revalidatePath(`/employees/${existing.employeeId}`);
  return { ok: true };
}
