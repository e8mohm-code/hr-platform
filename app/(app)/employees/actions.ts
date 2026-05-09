'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentEstablishmentId } from '@/lib/data';

// Empty string → null helper
const optionalStr = z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable());
const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? null : new Date(String(v))),
  z.date().nullable()
);
const optionalDecimal = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().nonnegative().nullable()
);

const employeeSchema = z.object({
  // Personal
  fullName:    z.string().min(1, 'الاسم الكامل مطلوب').max(160),
  gender:      optionalStr,
  nationality: optionalStr,
  dob:         optionalDate,
  phone:       optionalStr,
  email:       z.preprocess(
                 (v) => (v === '' || v == null ? null : v),
                 z.string().email('البريد الإلكتروني غير صحيح').nullable()
               ),

  // IDs / docs
  employeeNo:        optionalStr,
  iqamaNumber:       optionalStr,
  iqamaExpiry:       optionalDate,
  sponsorNumber:     optionalStr,
  healthCardNumber:  optionalStr,
  healthCardExpiry:  optionalDate,

  // Employment
  branchId:      z.string().min(1, 'الفرع مطلوب'),
  jobTitle:      optionalStr,
  department:    optionalStr,
  joinDate:      optionalDate,
  contractStart: optionalDate,
  contractEnd:   optionalDate,
  contractType:  optionalStr,

  // Compensation
  basicSalary:      optionalDecimal,
  housingAllowance: optionalDecimal,
  commissions:      optionalDecimal,
  otherAllowances:  optionalDecimal,
  paymentMethod:    optionalStr,
  iban:             optionalStr,

  // GOSI
  gosiSubscriptionNo: optionalStr,
  gosiSubjectWage:    optionalDecimal,

  // Status
  status: z.enum(['ACTIVE', 'RESIGNED', 'FINAL_EXIT']).default('ACTIVE'),
});

export type EmployeeActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function pickFormData(formData: FormData) {
  const fields = [
    'fullName', 'gender', 'nationality', 'dob', 'phone', 'email',
    'employeeNo', 'iqamaNumber', 'iqamaExpiry', 'sponsorNumber',
    'healthCardNumber', 'healthCardExpiry',
    'branchId', 'jobTitle', 'department', 'joinDate',
    'contractStart', 'contractEnd', 'contractType',
    'basicSalary', 'housingAllowance', 'commissions', 'otherAllowances',
    'paymentMethod', 'iban',
    'gosiSubscriptionNo', 'gosiSubjectWage',
    'status',
  ];
  const out: Record<string, FormDataEntryValue | null> = {};
  for (const f of fields) {
    const v = formData.get(f);
    out[f] = v;
  }
  return out;
}

/** Extract cf_* fields and return them as a Record. */
function extractCustomFields(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith('cf_')) {
      const key = k.slice(3);
      // checkboxes send "on" when checked, nothing when not
      out[key] = v === 'on' ? true : v;
    }
  }
  return out;
}

export async function createEmployee(formData: FormData): Promise<EmployeeActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const parsed = employeeSchema.safeParse(pickFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };
  }

  // Verify branch belongs to this establishment
  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, establishmentId: estId },
  });
  if (!branch) return { ok: false, error: 'الفرع غير موجود.' };

  const customFields = extractCustomFields(formData);
  const customFieldsStr = Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null;

  const created = await prisma.employee.create({
    data: { ...parsed.data, establishmentId: estId, customFields: customFieldsStr },
  });

  revalidatePath('/employees');
  revalidatePath('/dashboard');
  return { ok: true, id: created.id };
}

export async function updateEmployee(id: string, formData: FormData): Promise<EmployeeActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const existing = await prisma.employee.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'العامل غير موجود.' };

  const parsed = employeeSchema.safeParse(pickFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة.' };
  }

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, establishmentId: estId },
  });
  if (!branch) return { ok: false, error: 'الفرع غير موجود.' };

  const customFields = extractCustomFields(formData);
  const customFieldsStr = Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null;

  await prisma.employee.update({
    where: { id },
    data: { ...parsed.data, customFields: customFieldsStr },
  });

  revalidatePath('/employees');
  revalidatePath(`/employees/${id}`);
  revalidatePath('/dashboard');
  return { ok: true, id };
}

export async function deleteEmployee(id: string): Promise<EmployeeActionResult> {
  const estId = await getCurrentEstablishmentId();
  if (!estId) return { ok: false, error: 'غير مصرّح.' };

  const existing = await prisma.employee.findFirst({ where: { id, establishmentId: estId } });
  if (!existing) return { ok: false, error: 'العامل غير موجود.' };

  await prisma.employee.delete({ where: { id } });

  revalidatePath('/employees');
  revalidatePath('/dashboard');
  return { ok: true, id };
}

/** Used by Employee form: redirects after successful create */
export async function createEmployeeAndRedirect(formData: FormData) {
  const result = await createEmployee(formData);
  if (!result.ok) {
    // Bounce back with error in query param
    redirect(`/employees/new?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/employees/${result.id}`);
}

/** Used by Employee form: redirects after successful update */
export async function updateEmployeeAndRedirect(id: string, formData: FormData) {
  const result = await updateEmployee(id, formData);
  if (!result.ok) {
    redirect(`/employees/${id}/edit?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/employees/${id}`);
}
