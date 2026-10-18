import { cn } from '@/shared/lib/cn';

interface ProgressBarProps {
  valor: number;
  maximo?: number;
  rotulo?: string;
  tom?: 'primario' | 'crianca' | 'sucesso' | 'atencao';
  className?: string;
}

const tons = {
  primario: 'bg-primary',
  crianca: 'bg-secondary',
  sucesso: 'bg-success',
  atencao: 'bg-warning',
};

export function ProgressBar({
  valor,
  maximo = 100,
  rotulo,
  tom = 'primario',
  className,
}: ProgressBarProps) {
  const percentual = Math.min(100, Math.max(0, (valor / maximo) * 100));
  return (
    <div className={cn('space-y-1', className)}>
      {rotulo ? (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{rotulo}</span>
          <span className="font-semibold text-ink">{Math.round(percentual)}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={valor}
        aria-label={rotulo ?? 'Progresso'}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line/60"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', tons[tom])}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
