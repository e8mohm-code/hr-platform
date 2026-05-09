import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@hr-platform.sa';
const DEMO_PASSWORD = 'demo1234';

function shiftDays(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function shiftYears(years: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

async function main() {
  console.log('🌱  Seeding…');

  // Reset (only the demo establishment chain — leave any other untouched)
  const existing = await prisma.establishment.findUnique({ where: { ownerEmail: DEMO_EMAIL } });
  // Idempotent: keep the establishment + user (so JWT sessions stay valid),
  // only reset child collections.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let establishment = existing;

  if (establishment) {
    await prisma.attendance.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.activityLog.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.reminder.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.employee.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.license.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.registration.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.branch.deleteMany({ where: { establishmentId: establishment.id } });
    await prisma.brand.deleteMany({ where: { establishmentId: establishment.id } });
    console.log('   wiped child rows; preserved establishment id', establishment.id);
  } else {
    establishment = await prisma.establishment.create({
      data: {
        name: 'مؤسسة مطاعم منتهى المذاق',
        unifiedNumber: '7016807138',
        ownerEmail: DEMO_EMAIL,
        users: {
          create: {
            name: 'مالك المنشأة',
            email: DEMO_EMAIL,
            passwordHash,
            role: 'OWNER',
          },
        },
      },
    });
    console.log('   created new establishment id', establishment.id);
  }

  // Make sure the demo user exists & is linked to this establishment
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      name: 'مالك المنشأة',
      email: DEMO_EMAIL,
      passwordHash,
      role: 'OWNER',
      establishmentId: establishment.id,
    },
    update: {
      passwordHash,
      establishmentId: establishment.id,
    },
  });

  // Brands first
  const brandSeed = [
    { name: 'مكرونو',     color: '#F59E0B' },
    { name: 'نملية',      color: '#16A34A' },
    { name: 'شذى المذاق', color: '#8B5CF6' },
    { name: 'برجر هير',   color: '#DC2626' },
  ];
  const brands = await Promise.all(
    brandSeed.map((b) => prisma.brand.create({ data: { ...b, establishmentId: establishment.id } }))
  );
  const brandByName = new Map(brands.map((b) => [b.name, b]));

  // Branches
  const branchSeed = [
    { name: 'مكرونو - الحمدانية',  brandName: 'مكرونو',     city: 'جدة',    managerName: 'علي دخيل الله',  phone: '0501112233' },
    { name: 'مكرونو - الزهراء',    brandName: 'مكرونو',     city: 'جدة',    managerName: 'محمد العتيبي',     phone: '0552223344' },
    { name: 'نملية - جدة الجديدة', brandName: 'نملية',      city: 'جدة',    managerName: 'فيصل القحطاني',    phone: '0533334455' },
    { name: 'شذى المذاق - الرئيسي',brandName: 'شذى المذاق', city: 'جدة',    managerName: 'عبدالله الحربي',   phone: '0544445566' },
    { name: 'برجر هير - النماص',   brandName: 'برجر هير',   city: 'النماص', managerName: 'أحمد الزهراني',    phone: '0566667788' },
  ];

  const branches = await Promise.all(
    branchSeed.map((b) =>
      prisma.branch.create({
        data: {
          name: b.name,
          city: b.city,
          managerName: b.managerName,
          phone: b.phone,
          brand: b.brandName,
          brandRefId: brandByName.get(b.brandName)?.id ?? null,
          establishmentId: establishment.id,
        },
      })
    )
  );

  // Registrations (commercial)
  await prisma.registration.createMany({
    data: [
      { establishmentId: establishment.id, type: 'سجل تجاري',      number: '7016807138', issueDate: shiftDays(-700), expiryDate: shiftDays(60)  },
      { establishmentId: establishment.id, type: 'عضوية غرفة',     number: '7010109622', issueDate: shiftDays(-400), expiryDate: shiftDays(-15) },
      { establishmentId: establishment.id, type: 'سجل تجاري فرعي', number: '7042997770', issueDate: shiftDays(-300), expiryDate: shiftDays(180) },
    ],
  });

  // Licenses
  await prisma.license.createMany({
    data: [
      { establishmentId: establishment.id, branchId: branches[0].id, type: 'رخصة بلدية', authority: 'أمانة جدة',          number: 'BL-43099580936', issueDate: shiftDays(-360), expiryDate: shiftDays(5)   },
      { establishmentId: establishment.id, branchId: branches[1].id, type: 'دفاع مدني',  authority: 'الدفاع المدني',       number: 'CD-7745',        issueDate: shiftDays(-365), expiryDate: shiftDays(75)  },
      { establishmentId: establishment.id, branchId: branches[2].id, type: 'رخصة بلدية', authority: 'أمانة جدة',          number: 'BL-460517631388', issueDate: shiftDays(-720), expiryDate: shiftDays(-7)  },
      { establishmentId: establishment.id, branchId: branches[3].id, type: 'دفاع مدني',  authority: 'الدفاع المدني',       number: 'CD-9981',        issueDate: shiftDays(-90),  expiryDate: shiftDays(275) },
      { establishmentId: establishment.id, branchId: branches[4].id, type: 'رخصة بلدية', authority: 'أمانة منطقة عسير',  number: 'BL-40021705207', issueDate: shiftDays(-540), expiryDate: shiftDays(45)  },
    ],
  });

  // Employees — varied expiry tiers
  const employeeSeed: Array<{
    fullName: string;
    gender: string;
    nationality: string;
    jobTitle: string;
    department: string;
    iqamaOff: number;
    contractOff: number;
    healthOff: number;
  }> = [
    { fullName: 'JUBER KABADIYA',     gender: 'ذكر', nationality: 'نيبال',     jobTitle: 'عامل تعبئة وتغليف', department: 'المعمل',  iqamaOff: -10, contractOff: 25,  healthOff: -5 },
    { fullName: 'KAJI DAWADI',        gender: 'ذكر', nationality: 'نيبال',     jobTitle: 'عامل تعبئة وتغليف', department: 'المعمل',  iqamaOff: 12,  contractOff: 45,  healthOff: 22 },
    { fullName: 'SHEKH ABDUL KALAM',  gender: 'ذكر', nationality: 'بنغلاديش', jobTitle: 'عامل مطبخ',          department: 'المطبخ',  iqamaOff: 28,  contractOff: 90,  healthOff: 60 },
    { fullName: 'عمر وليد الضاهر',     gender: 'ذكر', nationality: 'لبنان',     jobTitle: 'عامل مطبخ',          department: 'المطبخ',  iqamaOff: 55,  contractOff: 180, healthOff: 110 },
    { fullName: 'أحمد السيد',          gender: 'ذكر', nationality: 'مصري',      jobTitle: 'محاسب',              department: 'المالية', iqamaOff: 80,  contractOff: -3,  healthOff: -20 },
    { fullName: 'محمد الديماسي',       gender: 'ذكر', nationality: 'سوري',      jobTitle: 'مدير تشغيلي',        department: 'الإدارة', iqamaOff: 110, contractOff: 250, healthOff: 88 },
    { fullName: 'محمد تركماني',        gender: 'ذكر', nationality: 'سوري',      jobTitle: 'ويتر',               department: 'الصالة',  iqamaOff: 200, contractOff: 400, healthOff: 300 },
    { fullName: 'إيهم إبراهيم',        gender: 'ذكر', nationality: 'مصري',      jobTitle: 'مسؤول HR',           department: 'الإدارة', iqamaOff: 4,   contractOff: 60,  healthOff: -8 },
    { fullName: 'فيصل المومري',        gender: 'ذكر', nationality: 'يمني',      jobTitle: 'توصيل ومشتريات',     department: 'التوصيل', iqamaOff: -60, contractOff: 700, healthOff: 175 },
    { fullName: 'عبدالله الشيف',       gender: 'ذكر', nationality: 'سوداني',    jobTitle: 'شيف',                department: 'المطبخ',  iqamaOff: 5,   contractOff: 33,  healthOff: 52 },
    { fullName: 'خالد أبو زيد',        gender: 'ذكر', nationality: 'مصري',      jobTitle: 'محاسب',              department: 'المالية', iqamaOff: 45,  contractOff: 95,  healthOff: 200 },
    { fullName: 'تغريد علي البلوي',    gender: 'أنثى', nationality: 'سعودي',    jobTitle: 'نادل',               department: 'الصالة',  iqamaOff: 320, contractOff: 500, healthOff: 95  },
    { fullName: 'عيشة عبده موسى',      gender: 'أنثى', nationality: 'سعودي',    jobTitle: 'مراقب خدمات عامة',   department: 'الإدارة', iqamaOff: 280, contractOff: 365, healthOff: 14  },
    { fullName: 'ياسر باحشوان',        gender: 'ذكر', nationality: 'سعودي',     jobTitle: 'مشرف صيانة',         department: 'الصيانة', iqamaOff: 410, contractOff: 600, healthOff: -70 },
    { fullName: 'حسيب رحمن',           gender: 'ذكر', nationality: 'باكستاني', jobTitle: 'كاشير',              department: 'الصالة',  iqamaOff: 2,   contractOff: 18,  healthOff: 40  },
    { fullName: 'صدام علي',             gender: 'ذكر', nationality: 'بنغلاديش', jobTitle: 'عامل مطبخ',          department: 'المطبخ',  iqamaOff: 7,   contractOff: 270, healthOff: 150 },
  ];

  for (let i = 0; i < employeeSeed.length; i++) {
    const s = employeeSeed[i];
    const branch = branches[i % branches.length];
    const basic = 2500 + i * 350;
    await prisma.employee.create({
      data: {
        establishmentId: establishment.id,
        branchId: branch.id,
        fullName: s.fullName,
        gender: s.gender,
        nationality: s.nationality,
        dob: shiftYears(-(25 + (i % 18))),
        phone: `+966 5${String(10000000 + i * 1234567).slice(0, 8)}`,
        email: `emp${i + 1}@hr-mock.sa`,
        employeeNo: `EMP-${1000 + i}`,
        iqamaNumber: String(2400000000 + i * 7919 + 13),
        iqamaExpiry: shiftDays(s.iqamaOff),
        sponsorNumber: '7016807138',
        healthCardNumber: i % 7 === 6 ? null : String(440000000000 + i * 23456789),
        healthCardExpiry: i % 7 === 6 ? null : shiftDays(s.healthOff),
        jobTitle: s.jobTitle,
        department: s.department,
        joinDate: shiftDays(-365 - i * 30),
        contractStart: shiftDays(-365 - i * 12),
        contractEnd: shiftDays(s.contractOff),
        contractType: i % 3 === 0 ? 'غير محدد' : 'محدد',
        basicSalary: basic,
        housingAllowance: i % 3 === 0 ? 800 : 0,
        commissions: i % 4 === 0 ? 300 : 0,
        otherAllowances: i % 5 === 0 ? 200 : 0,
        paymentMethod: ['تحويل', 'مدد', 'كاش'][i % 3],
        iban: i % 6 === 5 ? null : `SA${String(i).padStart(2, '0')}80000${String(i * 7919 + 13).padStart(17, '0')}`,
        gosiSubscriptionNo: ['655802851', '592414198', '648472269'][i % 3],
        gosiSubjectWage: basic + (i % 3 === 0 ? 800 : 0),
        status: 'ACTIVE',
      },
    });
  }

  console.log(`✅  Seeded ${establishmentName(establishment.name)} with ${branches.length} branches and ${employeeSeed.length} employees`);
  console.log(`    Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

function establishmentName(n: string) {
  return `"${n}"`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
