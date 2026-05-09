'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type BrandResult = { ok: true } | { ok: false; error: string };

const brandSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(80),
  logoUrl: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  color: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
});

export async function createBrand(data: { name: string; logoUrl: string | null; color: string | null }): Promise<BrandResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  await prisma.brand.create({ data: { ...parsed.data, establishmentId: estId } });
  revalidatePath('/brands');
  revalidatePath('/branches');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateBrand(id: string, data: { name: string; logoUrl: string | null; color: string | null }): Promise<BrandResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.brand.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'البراند غير موجود.' };
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  await prisma.brand.update({ where: { id }, data: parsed.data });
  revalidatePath('/brands');
  revalidatePath('/branches');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteBrand(id: string): Promise<BrandResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.brand.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'البراند غير موجود.' };
  await prisma.brand.delete({ where: { id } });
  revalidatePath('/brands');
  revalidatePath('/branches');
  return { ok: true };
}
