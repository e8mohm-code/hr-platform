import { Topbar } from '@/components/layout/Topbar';
import { listRegistrations, listLicenses, listBranches } from '@/lib/data';
import { UnifiedDocumentsView, type UnifiedDoc } from './_components/UnifiedDocumentsView';

export const dynamic = 'force-dynamic';

function parseAtt(s: string | null): UnifiedDoc['attachments'] {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

export default async function DocumentsPage() {
  const [registrations, licenses, branches] = await Promise.all([
    listRegistrations(),
    listLicenses(),
    listBranches(),
  ]);

  const docs: UnifiedDoc[] = [
    ...registrations.map((r) => ({
      id: r.id,
      kind: 'registration' as const,
      type: r.type,
      number: r.number,
      authority: null,
      branchId: null,
      branchName: null,
      brandName: null,
      brandLogoUrl: null,
      issueDate: r.issueDate,
      expiryDate: r.expiryDate,
      archived: r.archived,
      attachments: parseAtt(r.attachments),
    })),
    ...licenses.map((l) => ({
      id: l.id,
      kind: 'license' as const,
      type: l.type,
      number: l.number,
      authority: l.authority,
      branchId: l.branchId,
      branchName: l.branch.name,
      brandName: l.branch.brand,
      brandLogoUrl: null,
      issueDate: l.issueDate,
      expiryDate: l.expiryDate,
      archived: l.archived,
      attachments: parseAtt(l.attachments),
    })),
  ].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  return (
    <>
      <Topbar title="التراخيص" />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-ink-900">التراخيص والوثائق</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            السجلات التجارية والتراخيص (بلدي/دفاع مدني/...) لكل فرع. تجديد سنوي، شطب، نقل ملكية، ومرفقات.
          </p>
        </header>

        <UnifiedDocumentsView
          docs={docs}
          branches={branches.map((b) => ({ id: b.id, name: b.name, brand: b.brand }))}
        />
      </main>
    </>
  );
}
