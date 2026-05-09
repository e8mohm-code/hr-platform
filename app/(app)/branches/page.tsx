import { Topbar } from '@/components/layout/Topbar';
import { listBranches, listBrands } from '@/lib/data';
import { BranchesTable } from './_components/BranchesTable';

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  const [branches, brands] = await Promise.all([listBranches(), listBrands()]);

  return (
    <>
      <Topbar title="الفروع" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">الفروع</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            إدارة فروع المنشأة. كل فرع له تراخيص خاصة به ومسؤول.
          </p>
        </header>

        <BranchesTable
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            brand: b.brand,
            brandRefId: b.brandRefId,
            brandRefName: b.brandRef?.name ?? null,
            brandRefLogoUrl: b.brandRef?.logoUrl ?? null,
            city: b.city,
            address: b.address,
            managerName: b.managerName,
            phone: b.phone,
          }))}
          brandOptions={brands.map((b) => ({ id: b.id, name: b.name, logoUrl: b.logoUrl }))}
        />
      </main>
    </>
  );
}
