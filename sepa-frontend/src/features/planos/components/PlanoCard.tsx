import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ListChecks } from 'lucide-react';
import type { PlanoDetalhado } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { formatarData } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';

interface PlanoCardProps {
  plano: PlanoDetalhado;
}

export function PlanoCard({ plano }: PlanoCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-balance font-semibold text-ink">{plano.nomePlano}</h3>
        <Badge variante="primario">
          <ListChecks aria-hidden="true" className="size-3.5" />
          {plano.atividadeIds.length} atividade{plano.atividadeIds.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-muted">{plano.objetivos}</p>

      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
        <CalendarDays aria-hidden="true" className="size-4" />
        Início em {formatarData(plano.dataInicio)} · {plano.profissionalNome}
      </p>

      <div className="mt-auto pt-4">
        <Link
          to={rotas.profissional.plano(plano.alunoId, plano.id)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          Abrir plano
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
