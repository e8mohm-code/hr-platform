import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl bg-slate-50">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white border border-border grid place-items-center text-ink-500">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
