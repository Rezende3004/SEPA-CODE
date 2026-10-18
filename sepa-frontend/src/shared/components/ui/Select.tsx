import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalido?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalido = false, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalido || undefined}
      className={cn(
        'min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-ink',
        'disabled:cursor-not-allowed disabled:bg-canvas',
        invalido ? 'border-danger' : 'border-line focus:border-primary',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
