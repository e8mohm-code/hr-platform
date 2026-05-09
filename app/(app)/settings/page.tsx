import { Topbar } from '@/components/layout/Topbar';
import { getEstablishmentSettings } from '@/lib/data';
import { SettingsView } from './_components/SettingsView';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getEstablishmentSettings();

  return (
    <>
      <Topbar title="الإعدادات" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">الإعدادات</h1>
          <p className="text-sm text-ink-500 mt-0.5">حقول مخصصة وإعدادات عامة. الحفظ تلقائي.</p>
        </header>

        <SettingsView
          initialFields={settings?.customEmployeeFields ?? []}
          initialVacation={settings?.vacationEntitlementDays ?? 30}
        />
      </main>
    </>
  );
}
