import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { AtividadeAtribuida } from '@/shared/types';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { formatarData } from '@/shared/lib/format';
import { rotuloTipoAtividade } from '@/features/atividades/labels';
import { rotas } from '@/app/router/paths';

interface CartaoAtividadeProps {
  atividade: AtividadeAtribuida;
}

export function CartaoAtividade({ atividade }: CartaoAtividadeProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-kid-primary/20 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-kid-soft text-4xl"
        >
          {atividade.itens[0]?.valor ?? '📘'}
        </span>
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-bold text-kid-muted">{atividade.titulo}</h2>
          <p className="mt-1 text-sm text-kid-muted">{atividade.descricao}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NivelDificuldade
          nivel={atividade.nivelAtribuido ?? atividade.nivelDificuldade}
          tom="crianca"
        />
        <span className="rounded-full bg-kid-soft px-2.5 py-1 text-xs font-semibold text-kid-primary">
          {rotuloTipoAtividade[atividade.tipoAtividade]}
        </span>
      </div>

      <p className="text-xs text-kid-muted">
        {atividade.ultimaExecucao
          ? `Última vez em ${formatarData(atividade.ultimaExecucao)} · ${atividade.totalExecucoes} ${
              atividade.totalExecucoes === 1 ? 'conclusão' : 'conclusões'
            }`
          : 'Você ainda não fez esta atividade.'}
      </p>

      <Link
        to={rotas.aluno.atividade(atividade.id)}
        className="sepa-kid-focus mt-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-lg font-semibold text-ink hover:bg-accent/90"
      >
        <Play aria-hidden="true" className="size-5 fill-current" />
        Começar
      </Link>
    </article>
  );
}
