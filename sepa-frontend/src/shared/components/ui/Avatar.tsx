import { cn } from '@/shared/lib/cn';
import { iniciais } from '@/shared/lib/format';

interface AvatarProps {
  nome: string;
  tamanho?: 'pequeno' | 'medio' | 'grande';
  className?: string;
}

const tamanhos = {
  pequeno: 'size-8 text-xs',
  medio: 'size-10 text-sm',
  grande: 'size-14 text-lg',
};

export function Avatar({ nome, tamanho = 'medio', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-dark',
        tamanhos[tamanho],
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}
