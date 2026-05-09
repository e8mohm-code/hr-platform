'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

const branchSchema = z.object({
  name:        z.string().min(1, 'اسم الفرع مطلوب').max(120),
  brand:       z.string().max(80).optional().nullable(), // legacy text label
  brandRefId:  z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  city:        z.string().min(1, 'المدينة مطلوبة').max(80),
  address:     z.string().max(240).optional().nullable(),
  managerName: z.string().max(120).optional().nullable(),
  phone:       z.string().max(40).optional().nullable(),
});

export type BranchActionResult = { ok: true } | { ok: false; error: string };

export async function createBranch(formData: FormData): Promise<BranchActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = branchSchema.safeParse({
    name:        formData.get('name') ?? '',
    brand:       formData.get('brand') || null,
    brandRefId:  formData.get('brandRefId') || null,
    city:        formData.get('city') ?? '',
    address:     formData.get('address') || null,
    managerName: formData.get('managerName') || null,
    phone:       formData.get('phone') || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };
  }

  await prisma.branch.create({
    data: { ...parsed.data, establishmentId: estId },
  });

  revalidatePath('/branches');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateBranch(id: string, formData: FormData): Promise<BranchActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const existing = await prisma.branch.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الفرع غير موجود.' };

  const parsed = branchSchema.safeParse({
    name:        formData.get('name') ?? '',
    brand:       formData.get('brand') || null,
    brandRefId:  formData.get('brandRefId') || null,
    city:        formData.get('city') ?? '',
    address:     formData.get('address') || null,
    managerName: formData.get('managerName') || null,
    phone:       formData.get('phone') || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };
  }

  await prisma.branch.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath('/branches');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteBranch(id: string): Promise<BranchActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const existing = await prisma.branch.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الفرع غير موجود.' };

  // Block delete if employees still assigned
  const empCount = await prisma.employee.count({ where: { branchId: id } });
  if (empCount > 0) {
    return { ok: false, error: `لا يمكن حذف الفرع — يحتوي ${empCount} عامل. انقلهم لفرع آخر أولاً.` };
  }

  await prisma.branch.delete({ where: { id } });

  revalidatePath('/branches');
  revalidatePath('/dashboard');
  return { ok: true };
}
