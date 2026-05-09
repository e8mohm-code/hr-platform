import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  async function handleLogin(formData: FormData) {
    'use server';
    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirectTo: '/dashboard',
      });
    } catch (err) {
      // Auth.js throws a special redirect error on success — re-throw so Next handles it
      if (err && typeof err === 'object' && 'digest' in err) throw err;
      redirect('/login?error=invalid');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-600 grid place-items-center text-white font-extrabold">
            HR
          </div>
          <h1 className="text-xl font-bold text-ink-900">تسجيل الدخول</h1>
          <p className="text-sm text-ink-500 mt-1">أدخل بريدك وكلمة المرور للمتابعة.</p>
        </div>

        <SearchParamErrors searchParams={searchParams} />

        <form action={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@company.sa"
              leftIcon={<Mail size={16} />}
            />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            دخول
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-ink-500">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-primary-700 font-semibold hover:underline">
            إنشاء حساب
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

async function SearchParamErrors({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
      البريد أو كلمة المرور غير صحيحة.
    </div>
  );
}
