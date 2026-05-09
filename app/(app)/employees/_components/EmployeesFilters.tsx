'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Branch {
  id: string;
  name: string;
}

interface Props {
  branches: Branch[];
  inactiveCount: number;
}

export function EmployeesFilters({ branches, inactiveCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const update = (next: URLSearchParams) => {
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (q) next.set('q', q);
      else next.delete('q');
      if (next.toString() !== searchParams.toString()) update(next);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onBranchChange = (branchId: string) => {
    const next = new URLSearchParams(searchParams);
    if (branchId) next.set('branch', branchId);
    else next.delete('branch');
    update(next);
  };

  const onInactiveChange = (show: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (show) next.set('inactive', '1');
    else next.delete('inactive');
    update(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-md border border-border p-3 mb-4">
      <div className="flex-1 min-w-60">
        <Input
          type="search"
          placeholder="ابحث بالاسم، رقم الإقامة، الإيميل، أو الوظيفة…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      <Select
        defaultValue={searchParams.get('branch') ?? ''}
        onChange={(e) => onBranchChange(e.target.value)}
        className="max-w-56"
      >
        <option value="">كل الفروع</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </Select>

      {inactiveCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer px-3">
          <input
            type="checkbox"
            defaultChecked={searchParams.get('inactive') === '1'}
            onChange={(e) => onInactiveChange(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary-600"
          />
          <span>إظهار غير النشطين ({inactiveCount})</span>
        </label>
      )}
    </div>
  );
}
