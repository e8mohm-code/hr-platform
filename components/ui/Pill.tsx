import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'critical' | 'warning' | 'safe' | 'neutral' | 'primary';

// Light bg + status text per spec
const variants: Record<Variant, string> = {
  critical: 'bg-red-50    text-danger    border-red-100',
  warning:  'bg-amber-50  text-amber-700 border-amber-100',
  safe:     'bg-green-50  text-success   border-green-100',
  neutral:  'bg-gray-100  text-gray-700  border-gray-200',
  primary:  'bg-primary-50 text-primary-700 border-primary-100',
};

export function Pill({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-small font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
