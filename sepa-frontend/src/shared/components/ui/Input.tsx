import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalido?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalido = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalido || undefined}
      className={cn(
        'min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-ink',
        'placeholder:text-muted/70 disabled:cursor-not-allowed disabled:bg-canvas',
        invalido ? 'border-danger' : 'border-line focus:border-primary',
        className,
      )}
      {...props}
    />
  );
});
