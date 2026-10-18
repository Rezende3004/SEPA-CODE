import type { ReactNode } from 'react';
import { ListChecks, PencilRuler } from 'lucide-react';
import type { Atividade, TipoAtividade } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { cn } from '@/shared/lib/cn';
import { rotuloTipoAtividade } from '../labels';

const iconeTipo: Record<TipoAtividade, typeof ListChecks> = {
  ASSOCIACAO: PencilRuler,
  SEQUENCIA: ListChecks,
};

interface AtividadeCardProps {
  atividade: Atividade;
  acao?: ReactNode;
  className?: string;
}

export function AtividadeCard({ atividade, acao, className }: AtividadeCardProps) {
  const Icone = iconeTipo[atividade.tipoAtividade];
  const emoji = atividade.itens[0]?.valor ?? '📘';

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-xl border border-line bg-surface p-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-canvas text-2xl"
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-base font-semibold text-ink">{atividade.titulo}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{atividade.descricao}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variante="primario">
          <Icone aria-hidden="true" className="size-3.5" />
          {rotuloTipoAtividade[atividade.tipoAtividade]}
        </Badge>
        <NivelDificuldade nivel={atividade.nivelDificuldade} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-3 text-xs text-muted">
        <span>{atividade.itens.length} etapas</span>
        {acao ? <div className="flex items-center gap-2">{acao}</div> : null}
      </div>
    </article>
  );
}
