import { cn } from '@/shared/lib/cn';

interface LoadingStateProps {
  mensagem?: string;
  variante?: 'linhas' | 'cards';
  className?: string;
}

export function LoadingState({
  mensagem = 'Carregando informações…',
  variante = 'linhas',
  className,
}: LoadingStateProps) {
  const blocos = variante === 'cards' ? 3 : 4;
  return (
    <div role="status" aria-live="polite" className={cn('w-full', className)}>
      <span className="sr-only">{mensagem}</span>
      <div
        className={cn(
          'grid gap-4',
          variante === 'cards' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
        )}
      >
        {Array.from({ length: blocos }, (_, indice) => (
          <div
            key={indice}
            aria-hidden="true"
            className={cn(
              'animate-pulse rounded-xl border border-line bg-surface',
              variante === 'cards' ? 'h-40 p-5' : 'h-14',
            )}
          >
            {variante === 'cards' ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 rounded bg-canvas" />
                <div className="h-3 w-full rounded bg-canvas" />
                <div className="h-3 w-1/2 rounded bg-canvas" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
