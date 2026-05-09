'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId, type CustomFieldDef } from '@/lib/data';

export type SettingsResult = { ok: true } | { ok: false; error: string };

const fieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  type: z.enum(['text', 'textarea', 'number', 'date', 'select', 'boolean']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export async function saveCustomFields(fields: CustomFieldDef[]): Promise<SettingsResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  // Validate each field
  for (const f of fields) {
    const parsed = fieldSchema.safeParse(f);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'حقل غير صحيح.' };
  }

  // Ensure unique keys
  const keys = new Set<string>();
  for (const f of fields) {
    if (keys.has(f.key)) return { ok: false, error: `المفتاح "${f.key}" مكرر.` };
    keys.add(f.key);
  }

  await prisma.establishment.update({
    where: { id: estId },
    data: { customEmployeeFields: JSON.stringify(fields) },
  });

  revalidatePath('/settings');
  revalidatePath('/employees');
  return { ok: true };
}

export async function saveVacationEntitlement(days: number): Promise<SettingsResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  if (!Number.isFinite(days) || days < 0 || days > 365) {
    return { ok: false, error: 'القيمة يجب أن تكون بين 0 و 365.' };
  }
  await prisma.establishment.update({
    where: { id: estId },
    data: { vacationEntitlementDays: Math.floor(days) },
  });
  revalidatePath('/settings');
  return { ok: true };
}
