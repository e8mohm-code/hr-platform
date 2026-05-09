import Link from 'next/link';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { Building2, Mail, Lock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/auth';

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function handleRegister(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!name || !email || password.length < 6) {
      redirect('/register?error=invalid');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      redirect('/register?error=duplicate');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.establishment.create({
      data: {
        name,
        ownerEmail: email,
        users: {
          create: {
            name: 'مالك المنشأة',
            email,
            passwordHash,
            role: 'OWNER',
          },
        },
      },
    });

    try {
      await signIn('credentials', { email, password, redirectTo: '/dashboard' });
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err;
      redirect('/login');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-600 grid place-items-center text-white font-extrabold">
            HR
          </div>
          <h1 className="text-xl font-bold text-ink-900">إنشاء حساب جديد</h1>
          <p className="text-sm text-ink-500 mt-1">سجّل منشأتك وابدأ خلال دقيقتين.</p>
        </div>

        <SearchParamErrors searchParams={searchParams} />

        <form action={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">اسم المنشأة</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="مثلاً: مؤسسة الإنجاز للتجارة"
              leftIcon={<Building2 size={16} />}
            />
          </div>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" required leftIcon={<Mail size={16} />} />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              leftIcon={<Lock size={16} />}
            />
            <p className="text-xs text-ink-400 mt-1">٦ أحرف على الأقل.</p>
          </div>
          <Button type="submit" size="lg" className="w-full">
            إنشاء الحساب والدخول
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-ink-500">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-primary-700 font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

async function SearchParamErrors({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  const msg =
    params.error === 'duplicate'
      ? 'البريد مسجّل بالفعل.'
      : 'البيانات المُدخَلة غير صحيحة.';
  return (
    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
      {msg}
    </div>
  );
}
