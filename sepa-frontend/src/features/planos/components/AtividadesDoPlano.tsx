import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { PlanoDetalhado } from '@/shared/types';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { Alert } from '@/shared/components/ui/Alert';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { rotuloTipoAtividade } from '@/features/atividades/labels';
import { useRemoverAtividade } from '../hooks';

interface AtividadesDoPlanoProps {
  plano: PlanoDetalhado;
}

export function AtividadesDoPlano({ plano }: AtividadesDoPlanoProps) {
  const remover = useRemoverAtividade(plano.id);
  const [erro, setErro] = useState<string | null>(null);

  async function aoRemover(atividadeId: number) {
    setErro(null);
    try {
      await remover.mutateAsync(atividadeId);
    } catch (erroRemocao) {
      setErro(getApiErrorMessage(erroRemocao, 'Não foi possível remover a atividade.'));
    }
  }

  if (plano.atividades.length === 0) {
    return (
      <EmptyState
        titulo="Nenhuma atividade associada"
        descricao="Adicione atividades do catálogo da instituição para este plano."
      />
    );
  }

  return (
    <div className="space-y-3">
      {erro ? <Alert tom="perigo">{erro}</Alert> : null}
      <ul className="space-y-2">
        {plano.atividades.map((atividade) => (
          <li
            key={atividade.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3"
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-2xl"
            >
              {atividade.itens[0]?.valor ?? '📘'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{atividade.titulo}</p>
              <p className="text-xs text-muted">
                {rotuloTipoAtividade[atividade.tipoAtividade]} · {atividade.itens.length} etapas
              </p>
            </div>
            <NivelDificuldade nivel={atividade.nivelDificuldade} />
            <Button
              variante="fantasma"
              tamanho="pequeno"
              onClick={() => void aoRemover(atividade.id)}
              carregando={remover.isPending && remover.variables === atividade.id}
              aria-label={`Remover ${atividade.titulo} do plano`}
              className="text-danger hover:bg-danger-soft"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remover
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
