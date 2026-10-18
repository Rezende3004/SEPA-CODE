import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo' | 'crianca' | 'sucesso';
type Tamanho = 'pequeno' | 'medio' | 'grande';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
}

const variantes: Record<Variante, string> = {
  primario: 'bg-primary text-white hover:bg-primary-dark',
  secundario: 'border border-primary/30 bg-white text-primary-dark hover:bg-primary-soft',
  fantasma: 'text-ink hover:bg-primary-soft/70',
  perigo: 'bg-danger text-white hover:bg-danger/90',
  crianca: 'bg-kid-primary text-white hover:bg-kid-primary/90',
  sucesso: 'bg-success text-white hover:bg-success/90',
};

const tamanhos: Record<Tamanho, string> = {
  pequeno: 'min-h-9 gap-1.5 px-3 text-sm',
  medio: 'min-h-11 gap-2 px-4 text-sm',
  grande: 'min-h-14 gap-2.5 px-6 text-base sm:text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variante = 'primario',
    tamanho = 'medio',
    carregando = false,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantes[variante],
        tamanhos[tamanho],
        className,
      )}
      {...props}
    >
      {carregando ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
});
