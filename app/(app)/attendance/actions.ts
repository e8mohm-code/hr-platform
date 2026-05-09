'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type AttendanceResult = { ok: true } | { ok: false; error: string };

const STATUSES = ['present', 'late', 'absent', 'vacation'] as const;
type Status = typeof STATUSES[number];

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(STATUSES).nullable(),
});

export async function setAttendance(employeeId: string, date: string, status: Status | null): Promise<AttendanceResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = schema.safeParse({ employeeId, date, status });
  if (!parsed.success) return { ok: false, error: 'بيانات غير صحيحة.' };

  // Verify employee belongs to establishment
  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, establishmentId: estId },
  });
  if (!emp) return { ok: false, error: 'الموظف غير موجود.' };

  const dateObj = new Date(date);

  if (status === null) {
    // Delete the record
    await prisma.attendance.deleteMany({
      where: { employeeId, date: dateObj },
    });
  } else {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      create: { establishmentId: estId, employeeId, date: dateObj, status },
      update: { status },
    });
  }

  revalidatePath('/attendance');
  return { ok: true };
}
