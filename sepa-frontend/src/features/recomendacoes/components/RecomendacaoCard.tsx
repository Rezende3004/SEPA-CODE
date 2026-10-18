import { ArrowRight, Check, X } from 'lucide-react';
import type { RecomendacaoDetalhada } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { formatarData } from '@/shared/lib/format';
import { AvisoDecisaoHumana } from './AvisoDecisaoHumana';
import { Explicabilidade } from './Explicabilidade';

interface RecomendacaoCardProps {
  recomendacao: RecomendacaoDetalhada;
  onAceitar: (recomendacao: RecomendacaoDetalhada) => void;
  onRejeitar: (recomendacao: RecomendacaoDetalhada) => void;
  processando?: boolean;
}

const rotuloStatus = {
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  REJEITADA: 'Rejeitada',
} as const;

const varianteStatus = {
  PENDENTE: 'atencao',
  ACEITA: 'sucesso',
  REJEITADA: 'neutro',
} as const;

export function RecomendacaoCard({
  recomendacao,
  onAceitar,
  onRejeitar,
  processando = false,
}: RecomendacaoCardProps) {
  const pendente = recomendacao.status === 'PENDENTE';

  return (
    <article
      aria-label={`Recomendação para ${recomendacao.alunoNome}`}
      className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{recomendacao.alunoNome}</h2>
          <p className="text-xs text-muted">Gerada em {formatarData(recomendacao.dataGeracao)}</p>
        </div>
        <Badge variante={varianteStatus[recomendacao.status]}>
          {rotuloStatus[recomendacao.status]}
        </Badge>
      </header>

      <p className="text-sm leading-relaxed text-muted">{recomendacao.descricaoRecomendacao}</p>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-canvas p-3">
        <div>
          <p className="text-xs text-muted">Nível atual</p>
          <NivelDificuldade nivel={recomendacao.nivelAtual} />
        </div>
        <ArrowRight aria-hidden="true" className="size-5 text-primary" />
        <div>
          <p className="text-xs text-muted">Nível sugerido</p>
          <NivelDificuldade nivel={recomendacao.nivelSugerido} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">Atividades sugeridas</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {recomendacao.atividades.map((atividade) => (
            <li
              key={atividade.id}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink"
            >
              <span aria-hidden="true">{atividade.itens[0]?.valor ?? '📘'}</span>
              {atividade.titulo}
            </li>
          ))}
        </ul>
      </div>

      <Explicabilidade fatores={recomendacao.fatores} />

      <AvisoDecisaoHumana />

      {pendente ? (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={() => onAceitar(recomendacao)} carregando={processando}>
            <Check aria-hidden="true" className="size-4" />
            Aceitar recomendação
          </Button>
          <Button
            variante="fantasma"
            onClick={() => onRejeitar(recomendacao)}
            disabled={processando}
            className="text-danger hover:bg-danger-soft"
          >
            <X aria-hidden="true" className="size-4" />
            Rejeitar
          </Button>
        </div>
      ) : null}
    </article>
  );
}
