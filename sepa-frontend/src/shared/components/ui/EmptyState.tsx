import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  icone?: ReactNode;
}

export function EmptyState({ titulo, descricao, acao, icone }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-canvas text-muted">
        {icone ?? <Inbox aria-hidden="true" className="size-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink">{titulo}</p>
        <p className="max-w-md text-sm text-muted">{descricao}</p>
      </div>
      {acao ? <div className="mt-1">{acao}</div> : null}
    </div>
  );
}
