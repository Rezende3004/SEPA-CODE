import { useMemo, useState } from 'react';
import type { PlanoDetalhado, TipoAtividade } from '@/shared/types';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { Modal } from '@/shared/components/ui/Modal';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { useAtividades } from '@/features/atividades/hooks';
import { FiltrosCatalogo } from '@/features/atividades/components/FiltrosCatalogo';
import { rotuloTipoAtividade } from '@/features/atividades/labels';
import { useAssociarAtividade } from '../hooks';

interface SeletorAtividadesProps {
  aberto: boolean;
  plano: PlanoDetalhado;
  onFechar: () => void;
}

export function SeletorAtividades({ aberto, plano, onFechar }: SeletorAtividadesProps) {
  const atividades = useAtividades();
  const associar = useAssociarAtividade(plano.id);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoAtividade | ''>('');
  const [nivel, setNivel] = useState(0);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const disponiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (atividades.data ?? []).filter((atividade) => {
      if (plano.atividadeIds.includes(atividade.id)) return false;
      if (termo && !`${atividade.titulo} ${atividade.descricao}`.toLowerCase().includes(termo)) {
        return false;
      }
      if (tipo && atividade.tipoAtividade !== tipo) return false;
      if (nivel > 0 && atividade.nivelDificuldade !== nivel) return false;
      return true;
    });
  }, [atividades.data, busca, nivel, plano.atividadeIds, tipo]);

  function alternar(id: number) {
    setSelecionadas((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id],
    );
  }

  async function adicionar() {
    setErro(null);
    try {
      for (const atividadeId of selecionadas) {
        await associar.mutateAsync(atividadeId);
      }
      onFechar();
    } catch (erroAssociacao) {
      setErro(getApiErrorMessage(erroAssociacao, 'Não foi possível adicionar as atividades.'));
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Adicionar atividades ao plano"
      descricao="Somente atividades da instituição do aluno aparecem nesta lista (RN-003)."
      largura="largo"
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar} disabled={associar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => void adicionar()}
            disabled={selecionadas.length === 0}
            carregando={associar.isPending}
          >
            Adicionar {selecionadas.length > 0 ? `(${selecionadas.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {erro ? <Alert tom="perigo">{erro}</Alert> : null}

        <FiltrosCatalogo
          busca={busca}
          aoBuscar={setBusca}
          tipo={tipo}
          aoMudarTipo={setTipo}
          nivel={nivel}
          aoMudarNivel={setNivel}
        />

        {atividades.isLoading ? <LoadingState /> : null}
        {atividades.isError ? (
          <Alert tom="perigo">{getApiErrorMessage(atividades.error)}</Alert>
        ) : null}

        {atividades.isSuccess && disponiveis.length === 0 ? (
          <EmptyState
            titulo="Nenhuma atividade disponível"
            descricao="Todas as atividades do catálogo já estão no plano ou não correspondem aos filtros."
          />
        ) : null}

        {disponiveis.length > 0 ? (
          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {disponiveis.map((atividade) => {
              const marcada = selecionadas.includes(atividade.id);
              return (
                <li key={atividade.id}>
                  <label
                    className={
                      marcada
                        ? 'flex cursor-pointer items-center gap-3 rounded-lg border border-primary bg-primary-soft/60 p-3'
                        : 'flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 hover:bg-canvas/60'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternar(atividade.id)}
                      className="size-5 accent-primary"
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-xl"
                    >
                      {atividade.itens[0]?.valor ?? '📘'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{atividade.titulo}</span>
                      <span className="block text-xs text-muted">
                        {rotuloTipoAtividade[atividade.tipoAtividade]}
                      </span>
                    </span>
                    <NivelDificuldade nivel={atividade.nivelDificuldade} comRotulo={false} />
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Modal>
  );
}
