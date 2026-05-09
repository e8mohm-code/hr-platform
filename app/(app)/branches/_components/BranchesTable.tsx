'use client';

import { useState, useMemo, useTransition } from 'react';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { BranchFormDialog } from './BranchFormDialog';
import { deleteBranch } from '../actions';

interface Branch {
  id: string;
  name: string;
  brand: string | null;
  brandRefId: string | null;
  brandRefName: string | null;
  brandRefLogoUrl: string | null;
  city: string;
  address: string | null;
  managerName: string | null;
  phone: string | null;
}

interface BrandOption { id: string; name: string; logoUrl: string | null; }

export function BranchesTable({ branches, brandOptions }: { branches: Branch[]; brandOptions: BrandOption[] }) {
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState<{ mode: 'create' | 'edit'; branch?: Branch } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) =>
      [b.name, b.brand, b.city, b.address, b.managerName, b.phone]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [branches, search]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`هل تريد حذف الفرع "${name}"؟ لا يمكن التراجع.`)) return;
    startTransition(async () => {
      const result = await deleteBranch(id);
      if (!result.ok) alert(result.error);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-60 max-w-md">
          <Input
            type="search"
            placeholder="ابحث بالاسم، البراند، المدينة، أو المدير…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpenDialog({ mode: 'create' })}>
          إضافة فرع
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={20} />}
          title={branches.length === 0 ? 'لا يوجد فروع بعد' : 'لا توجد نتائج'}
          description={branches.length === 0 ? 'ابدأ بإضافة فرعك الأول.' : 'جرّب كلمات بحث مختلفة.'}
          action={
            branches.length === 0 ? (
              <Button leftIcon={<Plus size={16} />} onClick={() => setOpenDialog({ mode: 'create' })}>
                إضافة فرع
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                    <th className="text-start px-5 py-3">اسم الفرع</th>
                    <th className="text-start px-5 py-3">البراند</th>
                    <th className="text-start px-5 py-3">المدينة</th>
                    <th className="text-start px-5 py-3">المدير</th>
                    <th className="text-start px-5 py-3">الجوال</th>
                    <th className="text-start px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink-900">{b.name}</div>
                        {b.address && <div className="text-xs text-ink-500 mt-0.5">{b.address}</div>}
                      </td>
                      <td className="px-5 py-3">
                        {b.brandRefName ? (
                          <div className="flex items-center gap-2">
                            {b.brandRefLogoUrl ? (
                              <img src={b.brandRefLogoUrl} alt="" className="w-7 h-7 rounded object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-primary-50 grid place-items-center text-primary-700 font-bold text-xs">
                                {b.brandRefName.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-ink-700">{b.brandRefName}</span>
                          </div>
                        ) : b.brand ? (
                          <Pill variant="primary">{b.brand}</Pill>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-ink-700">{b.city}</td>
                      <td className="px-5 py-3 text-ink-700">{b.managerName ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-700" dir="ltr">{b.phone ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setOpenDialog({ mode: 'edit', branch: b })}
                            className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-200 text-ink-700 transition-colors"
                            aria-label="تعديل"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            disabled={isPending}
                            className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-50 text-ink-500 hover:text-critical disabled:opacity-50 transition-colors"
                            aria-label="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {openDialog && (
        <BranchFormDialog
          mode={openDialog.mode}
          branch={openDialog.branch}
          existingBrands={Array.from(new Set(branches.map((b) => b.brand).filter(Boolean) as string[]))}
          brandOptions={brandOptions}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </>
  );
}
