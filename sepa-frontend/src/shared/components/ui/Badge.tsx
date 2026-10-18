import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variante = 'neutro' | 'primario' | 'sucesso' | 'atencao' | 'perigo' | 'crianca';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variante?: Variante;
}

const variantes: Record<Variante, string> = {
  neutro: 'bg-canvas text-muted border-line',
  primario: 'bg-primary-soft text-primary-dark border-primary/20',
  sucesso: 'bg-success-soft text-success border-success/20',
  atencao: 'bg-warning-soft text-warning border-warning/20',
  perigo: 'bg-danger-soft text-danger border-danger/20',
  crianca: 'bg-kid-soft text-kid-primary border-kid-primary/20',
};

export function Badge({ className, variante = 'neutro', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantes[variante],
        className,
      )}
      {...props}
    />
  );
}
