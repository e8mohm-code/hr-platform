import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'critical';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700',
  secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
  ghost:     'bg-transparent text-gray-700 hover:bg-gray-100',
  danger:    'bg-danger text-white hover:bg-red-700',
  critical:  'bg-danger text-white hover:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8  px-3  text-small gap-1.5',
  md: 'h-10 px-4  text-body  gap-2',
  lg: 'h-12 px-6  text-body  gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', leftIcon, rightIcon, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
        'transition-colors duration-200 ease-out-soft',
        'focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
