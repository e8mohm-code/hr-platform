# منصة الموارد البشرية — إصدار Next.js

داشبورد امتثال لإدارة وثائق المنشآت السعودية (السجلات، التراخيص، الإقامات، الشهادات الصحية) مع تنبيهات لانتهاء الصلاحية.

## التقنيات

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + خط Tajawal (عربي/RTL)
- **PostgreSQL** عبر **Prisma**
- **Auth.js v5** مع PrismaAdapter (جلسات JWT)
- **Recharts** للرسوم البيانية
- **lucide-react** للأيقونات

## بنية المشروع

```
hr-next/
├── app/
│   ├── (auth)/           # login, register
│   ├── (app)/            # dashboard, employees, documents, ...
│   ├── api/auth/         # NextAuth routes
│   ├── layout.tsx        # root, RTL + Tajawal
│   └── globals.css
├── components/
│   ├── layout/           # Sidebar, Topbar
│   └── ui/               # Button, Card, Input, Pill (primitives)
├── features/
│   ├── alerts/           # AlertCard
│   ├── charts/           # DonutChart, ExpiringByTypeChart, UpcomingTimelineChart
│   └── documents-table/  # DocumentsTable
├── lib/
│   ├── alerts.ts         # tier calculation
│   ├── data.ts           # data-access for dashboard
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # cn, fmtDate, fmtNumber, daysUntil
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── auth.ts               # Auth.js v5 config
└── middleware.ts         # auth guard
```

## التشغيل

### ١. ثبّت الحزم

```bash
cd hr-next
npm install
```

### ٢. اضبط قاعدة البيانات

اختر طريقة من اثنتين:

**أ) Postgres محلي بـ Docker** (موصى به للتطوير):
```bash
docker run --name hr-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```
ثم انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```
المتغيرات الافتراضية في `.env.example` تعمل مع Docker مباشرة.

**ب) Postgres سحابي** (Supabase / Neon — مجاني):
- سجّل في https://supabase.com أو https://neon.tech
- أنشئ مشروع، انسخ `DATABASE_URL`
- ضعها في `.env`

### ٣. اضبط `AUTH_SECRET`

```bash
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
```

### ٤. هيّئ قاعدة البيانات

```bash
npm run db:push     # ينشئ الجداول
npm run db:seed     # يضيف بيانات تجريبية: مؤسسة مطاعم منتهى المذاق + ٥ فروع + ١٦ موظف
```

### ٥. شغّل التطبيق

```bash
npm run dev
```

افتح http://localhost:3000.

**حساب التجربة الجاهز** (بعد seed):
- البريد: `demo@hr-platform.sa`
- كلمة المرور: `demo1234`

## ما هو موجود في هذا الإصدار

- ✅ **المصادقة الكاملة**: تسجيل/دخول/خروج عبر Auth.js v5، جلسات JWT، حماية المسارات بـ middleware.
- ✅ **عزل المنشآت** (multi-tenancy): كل صف في قاعدة البيانات مرتبط بـ `establishmentId` ويُفلتَر تلقائياً.
- ✅ **Layout عربي RTL**: Sidebar داكن ثابت، Topbar مع بحث وإشعارات وفلتر فروع وزر إجراء أساسي.
- ✅ **داشبورد كامل**:
  - 4 بطاقات KPI (الفروع/العمالة/التراخيص/السجلات)
  - 3 بطاقات تنبيهات بأولويات (حرجة/تحذير/سليمة) — الحرجة بتأثير نبض
  - 3 رسوم بيانية: Donut، Bar، Timeline area — كلها بأنيميشن سلس عند التحميل
  - جدول مفصّل قابل للبحث/الفلترة/الترتيب
- ✅ **Stubs نظيفة** للصفحات الأخرى (العمالة، الوثائق، الحضور، الرواتب، التقارير، الإعدادات).
- ✅ **بيانات seed واقعية** مأخوذة من ملف HR الحقيقي للمستخدم.

## الخطوات القادمة

كل صفحة من الـ stubs تحتاج تنفيذ كامل:

1. **العمالة**: قائمة + فورم بـ 25+ حقل + تفاصيل + إجراءات + أرشيف.
2. **الوثائق**: CRUD للسجلات والتراخيص.
3. **الحضور**: شبكة شهرية + تعليم بالنقرة + رصيد إجازات.
4. **الرواتب**: مسير شهري.
5. **التقارير**: تصدير Excel/PDF.
6. **الإعدادات**: حقول مخصصة + أنواع إجراءات + أعضاء.

## الأوامر الشائعة

| أمر | الوصف |
|---|---|
| `npm run dev` | تشغيل التطوير |
| `npm run build` | بناء للإنتاج |
| `npm run start` | تشغيل البناء |
| `npm run db:push` | مزامنة المخطط مع DB (للتطوير) |
| `npm run db:migrate` | إنشاء migration رسمي |
| `npm run db:studio` | فتح Prisma Studio لتصفح DB |
| `npm run db:seed` | تشغيل seed |

## نظام الألوان

| اللون | الكود | الاستخدام |
|---|---|---|
| Critical | `#DC2626` | تنبيهات حرجة (٠–٧ أيام) |
| Warning | `#F59E0B` | تنبيهات تحذير (٨–٣٠ يوم) |
| Safe | `#16A34A` | حالة سليمة (+٣٠ يوم) |
| Primary | `#2563EB` | الإجراءات الأساسية |
| Background | `#F8FAFC` | خلفية التطبيق |

كلها معرّفة في `tailwind.config.ts` مع shades إضافية للـ primary.

## ملاحظات أمان

- كلمات المرور تُهَش بـ bcrypt (cost 10).
- جلسات JWT موقّعة بـ `AUTH_SECRET` — **لا تشاركها**.
- كل query على Prisma مفلتر بـ `establishmentId` من الجلسة. لا يمكن لمنشأة رؤية بيانات أخرى.
- المسارات محمية بـ middleware يتحقق من `req.auth`.
