import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-20 px-3 py-2 bg-white border border-gray-300 rounded-md',
          'text-gray-900 placeholder:text-gray-400 text-body',
          'transition-colors duration-200 ease-out-soft',
          'hover:border-gray-500',
          'focus:outline-none focus:border-primary-600 focus:shadow-focus',
          'disabled:bg-gray-50 disabled:cursor-not-allowed resize-y',
          className
        )}
        {...props}
      />
    );
  }
);
