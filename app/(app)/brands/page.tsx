import { Topbar } from '@/components/layout/Topbar';
import { listBrands } from '@/lib/data';
import { BrandManager } from './_components/BrandManager';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const brands = await listBrands();
  return (
    <>
      <Topbar title="البراندات" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">البراندات</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            إدارة البراندات (مكرونو، نملية، شذى المذاق...) مع شعار لكل براند.
          </p>
        </header>
        <BrandManager
          brands={brands.map((b) => ({
            id: b.id, name: b.name, logoUrl: b.logoUrl, color: b.color,
          }))}
        />
      </main>
    </>
  );
}
