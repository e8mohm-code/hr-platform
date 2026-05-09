'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

export type DocActionResult = { ok: true } | { ok: false; error: string };

/* ===== Registrations ===== */

const registrationSchema = z.object({
  type: z.string().min(1, 'النوع مطلوب').max(80),
  number: z.string().min(1, 'الرقم مطلوب').max(80),
  issueDate: z.preprocess((v) => (v === '' || v == null ? null : new Date(String(v))), z.date().nullable()),
  expiryDate: z.preprocess((v) => (v === '' || v == null ? null : new Date(String(v))), z.date()),
});

export async function createRegistration(formData: FormData): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = registrationSchema.safeParse({
    type: formData.get('type'),
    number: formData.get('number'),
    issueDate: formData.get('issueDate'),
    expiryDate: formData.get('expiryDate'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  await prisma.registration.create({ data: { ...parsed.data, establishmentId: estId } });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateRegistration(id: string, formData: FormData): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };

  const parsed = registrationSchema.safeParse({
    type: formData.get('type'),
    number: formData.get('number'),
    issueDate: formData.get('issueDate'),
    expiryDate: formData.get('expiryDate'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  await prisma.registration.update({ where: { id }, data: parsed.data });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteRegistration(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };
  await prisma.registration.delete({ where: { id } });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

/* === Registration extra actions === */

function addOneYear(d: Date | null | undefined): Date {
  const base = d ? new Date(d) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  return base;
}

export async function renewRegistrationOneYear(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };
  const newExpiry = addOneYear(existing.expiryDate);
  await prisma.registration.update({ where: { id }, data: { expiryDate: newExpiry } });
  await prisma.activityLog.create({
    data: {
      establishmentId: estId,
      target: existing.number,
      channel: 'system',
      actionType: 'renew_registration',
      subject: `تجديد سنوي: ${existing.type} ${existing.number} → ${newExpiry.toISOString().slice(0, 10)}`,
      body: '',
    },
  });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function archiveRegistration(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };
  await prisma.registration.update({ where: { id }, data: { archived: !existing.archived } });
  await prisma.activityLog.create({
    data: {
      establishmentId: estId,
      target: existing.number,
      channel: 'system',
      actionType: existing.archived ? 'unarchive_registration' : 'archive_registration',
      subject: existing.archived ? `إعادة تفعيل: ${existing.number}` : `شطب: ${existing.number}`,
      body: '',
    },
  });
  revalidatePath('/documents');
  return { ok: true };
}

export async function addRegistrationAttachment(
  id: string,
  attachment: { url: string; fileName: string; type: string }
): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };
  const list = parseList(existing.attachments);
  list.push({ ...attachment, uploadedAt: new Date().toISOString() });
  await prisma.registration.update({ where: { id }, data: { attachments: JSON.stringify(list) } });
  revalidatePath('/documents');
  return { ok: true };
}

export async function removeRegistrationAttachment(id: string, url: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.registration.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'السجل غير موجود.' };
  const list = parseList(existing.attachments).filter((a: { url: string }) => a.url !== url);
  await prisma.registration.update({
    where: { id },
    data: { attachments: list.length ? JSON.stringify(list) : null },
  });
  revalidatePath('/documents');
  return { ok: true };
}

function parseList(s: string | null): Array<{ url: string; fileName: string; type: string; uploadedAt: string }> {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/* ===== Licenses ===== */

const licenseSchema = z.object({
  branchId: z.string().min(1, 'الفرع مطلوب'),
  type: z.string().min(1, 'النوع مطلوب').max(80),
  authority: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  number: z.string().min(1, 'الرقم مطلوب').max(80),
  issueDate: z.preprocess((v) => (v === '' || v == null ? null : new Date(String(v))), z.date().nullable()),
  expiryDate: z.preprocess((v) => (v === '' || v == null ? null : new Date(String(v))), z.date()),
});

export async function createLicense(formData: FormData): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = licenseSchema.safeParse({
    branchId: formData.get('branchId'),
    type: formData.get('type'),
    authority: formData.get('authority'),
    number: formData.get('number'),
    issueDate: formData.get('issueDate'),
    expiryDate: formData.get('expiryDate'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  // Verify branch ownership
  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, establishmentId: estId },
  });
  if (!branch) return { ok: false, error: 'الفرع غير موجود.' };

  await prisma.license.create({ data: { ...parsed.data, establishmentId: estId } });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateLicense(id: string, formData: FormData): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };

  const parsed = licenseSchema.safeParse({
    branchId: formData.get('branchId'),
    type: formData.get('type'),
    authority: formData.get('authority'),
    number: formData.get('number'),
    issueDate: formData.get('issueDate'),
    expiryDate: formData.get('expiryDate'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, establishmentId: estId },
  });
  if (!branch) return { ok: false, error: 'الفرع غير موجود.' };

  await prisma.license.update({ where: { id }, data: parsed.data });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteLicense(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  await prisma.license.delete({ where: { id } });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

/* === License extra actions === */

export async function renewLicenseOneYear(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  const newExpiry = addOneYear(existing.expiryDate);
  await prisma.license.update({ where: { id }, data: { expiryDate: newExpiry } });
  await prisma.activityLog.create({
    data: {
      establishmentId: estId,
      target: existing.number,
      channel: 'system',
      actionType: 'renew_license',
      subject: `تجديد سنوي: ${existing.type} ${existing.number} → ${newExpiry.toISOString().slice(0, 10)}`,
      body: '',
    },
  });
  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function archiveLicense(id: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  await prisma.license.update({ where: { id }, data: { archived: !existing.archived } });
  await prisma.activityLog.create({
    data: {
      establishmentId: estId,
      target: existing.number,
      channel: 'system',
      actionType: existing.archived ? 'unarchive_license' : 'archive_license',
      subject: existing.archived ? `إعادة تفعيل: ${existing.number}` : `شطب: ${existing.number}`,
      body: '',
    },
  });
  revalidatePath('/documents');
  return { ok: true };
}

export async function transferLicense(id: string, newBranchId: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  const newBranch = await prisma.branch.findFirst({ where: { id: newBranchId, establishmentId: estId } });
  if (!newBranch) return { ok: false, error: 'الفرع غير موجود.' };
  if (newBranchId === existing.branchId) return { ok: false, error: 'الترخيص في هذا الفرع بالفعل.' };
  const oldBranch = await prisma.branch.findUnique({ where: { id: existing.branchId } });

  await prisma.license.update({ where: { id }, data: { branchId: newBranchId } });
  await prisma.activityLog.create({
    data: {
      establishmentId: estId,
      target: existing.number,
      channel: 'system',
      actionType: 'transfer_license',
      subject: `نقل ملكية: ${oldBranch?.name ?? '—'} → ${newBranch.name}`,
      body: '',
    },
  });
  revalidatePath('/documents');
  return { ok: true };
}

export async function addLicenseAttachment(
  id: string,
  attachment: { url: string; fileName: string; type: string }
): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  const list = parseList(existing.attachments);
  list.push({ ...attachment, uploadedAt: new Date().toISOString() });
  await prisma.license.update({ where: { id }, data: { attachments: JSON.stringify(list) } });
  revalidatePath('/documents');
  return { ok: true };
}

export async function removeLicenseAttachment(id: string, url: string): Promise<DocActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };
  const existing = await prisma.license.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'الترخيص غير موجود.' };
  const list = parseList(existing.attachments).filter((a: { url: string }) => a.url !== url);
  await prisma.license.update({
    where: { id },
    data: { attachments: list.length ? JSON.stringify(list) : null },
  });
  revalidatePath('/documents');
  return { ok: true };
}
