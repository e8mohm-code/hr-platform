import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveUpload } from '@/lib/upload';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  const estId = session?.user?.establishmentId;
  if (!estId) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'الطلب غير صحيح.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'الملف مفقود.' }, { status: 400 });
  }

  try {
    const saved = await saveUpload(file, estId);
    return NextResponse.json(saved);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'فشل الرفع.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
