import { cn } from '@/shared/lib/cn';

interface NivelDificuldadeProps {
  nivel: number;
  comRotulo?: boolean;
  tom?: 'primario' | 'crianca';
  className?: string;
}

export function NivelDificuldade({
  nivel,
  comRotulo = true,
  tom = 'primario',
  className,
}: NivelDificuldadeProps) {
  const total = 5;
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="flex items-center gap-1"
        role="img"
        aria-label={`Nível ${nivel} de ${total}`}
      >
        {Array.from({ length: total }, (_, indice) => (
          <span
            key={indice}
            aria-hidden="true"
            className={cn(
              'size-2 rounded-full',
              indice < nivel ? (tom === 'crianca' ? 'bg-kid-primary' : 'bg-primary') : 'bg-line',
            )}
          />
        ))}
      </span>
      {comRotulo ? <span className="text-xs font-medium text-muted">Nível {nivel}</span> : null}
    </span>
  );
}
