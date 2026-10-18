import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalido?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalido = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalido || undefined}
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2 text-base text-ink',
        'placeholder:text-muted/70 disabled:cursor-not-allowed disabled:bg-canvas',
        invalido ? 'border-danger' : 'border-line focus:border-primary',
        className,
      )}
      {...props}
    />
  );
});
