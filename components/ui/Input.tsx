import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
}

const baseClass = cn(
  'w-full h-10 bg-white border border-gray-300 rounded-md',
  'text-gray-900 placeholder:text-gray-400 text-body',
  'transition-colors duration-200 ease-out-soft',
  'hover:border-gray-500',
  'focus:outline-none focus:border-primary-600 focus:shadow-focus',
  'disabled:bg-gray-50 disabled:cursor-not-allowed'
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, ...props },
  ref
) {
  if (leftIcon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
          {leftIcon}
        </span>
        <input
          ref={ref}
          className={cn(baseClass, 'pr-10 pl-3', className)}
          {...props}
        />
      </div>
    );
  }
  return <input ref={ref} className={cn(baseClass, 'px-3', className)} {...props} />;
});

export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-small font-medium text-gray-700 mb-1.5', className)} {...props}>
      {children}
    </label>
  );
}
