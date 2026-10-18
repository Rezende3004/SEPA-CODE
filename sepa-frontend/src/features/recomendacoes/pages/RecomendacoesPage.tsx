import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { RecomendacaoDetalhada } from '@/shared/types';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Field } from '@/shared/components/ui/Field';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Select } from '@/shared/components/ui/Select';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { useAlunos } from '@/features/alunos/hooks';
import { RecomendacaoCard } from '../components/RecomendacaoCard';
import { useAceitarRecomendacao, useRecomendacoes, useRejeitarRecomendacao } from '../hooks';

type Aba = 'pendentes' | 'historico';

export function RecomendacoesPage() {
  const [alunoId, setAlunoId] = useState(0);
  const [aba, setAba] = useState<Aba>('pendentes');
  const [confirmacao, setConfirmacao] = useState<RecomendacaoDetalhada | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const alunos = useAlunos();
  const recomendacoes = useRecomendacoes({ alunoId: alunoId > 0 ? alunoId : undefined });
  const aceitar = useAceitarRecomendacao();
  const rejeitar = useRejeitarRecomendacao();

  const todas = recomendacoes.data ?? [];
  const pendentes = todas.filter((recomendacao) => recomendacao.status === 'PENDENTE');
  const historico = todas.filter((recomendacao) => recomendacao.status !== 'PENDENTE');
  const lista = aba === 'pendentes' ? pendentes : historico;

  async function confirmarAceite() {
    if (!confirmacao) return;
    setErro(null);
    try {
      const atualizada = await aceitar.mutateAsync(confirmacao.id);
      setMensagem(
        `Recomendação de ${atualizada.alunoNome} aceita. As atividades sugeridas agora estão no nível ${atualizada.nivelSugerido}.`,
      );
      setConfirmacao(null);
    } catch (erroAceite) {
      setErro(getApiErrorMessage(erroAceite, 'Não foi possível aceitar a recomendação.'));
      setConfirmacao(null);
    }
  }

  async function aoRejeitar(recomendacao: RecomendacaoDetalhada) {
    setErro(null);
    setMensagem(null);
    try {
      await rejeitar.mutateAsync(recomendacao.id);
      setMensagem(
        `Recomendação de ${recomendacao.alunoNome} rejeitada. O plano e as atividades permanecem como estavam.`,
      );
    } catch (erroRejeicao) {
      setErro(getApiErrorMessage(erroRejeicao, 'Não foi possível rejeitar a recomendação.'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Módulo de IA"
        titulo="Recomendações de aprendizado"
        descricao="A IA analisa a curva de aprendizado e sugere ajustes de nível. Você decide se aplica (RN-004)."
      />

      {mensagem ? <Alert tom="sucesso">{mensagem}</Alert> : null}
      {erro ? <Alert tom="perigo">{erro}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Field label="Filtrar por aluno" htmlFor="filtro-aluno-recomendacao">
            <Select
              id="filtro-aluno-recomendacao"
              value={alunoId}
              onChange={(evento) => setAlunoId(Number(evento.target.value))}
            >
              <option value={0}>Todos os alunos</option>
              {(alunos.data ?? []).map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div role="group" aria-label="Alternar entre pendentes e histórico" className="flex gap-2">
          <Button
            variante={aba === 'pendentes' ? 'primario' : 'secundario'}
            tamanho="pequeno"
            onClick={() => setAba('pendentes')}
            aria-pressed={aba === 'pendentes'}
          >
            Pendentes ({pendentes.length})
          </Button>
          <Button
            variante={aba === 'historico' ? 'primario' : 'secundario'}
            tamanho="pequeno"
            onClick={() => setAba('historico')}
            aria-pressed={aba === 'historico'}
          >
            Histórico ({historico.length})
          </Button>
        </div>
      </div>

      {recomendacoes.isLoading ? <LoadingState variante="cards" /> : null}
      {recomendacoes.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(recomendacoes.error)}
          onTentarNovamente={() => void recomendacoes.refetch()}
        />
      ) : null}

      {recomendacoes.isSuccess && lista.length === 0 ? (
        <EmptyState
          titulo={aba === 'pendentes' ? 'Nenhuma recomendação pendente' : 'Nenhuma decisão registrada'}
          descricao={
            aba === 'pendentes'
              ? 'Quando a análise identificar oportunidades de ajuste, as sugestões aparecem aqui para revisão.'
              : 'As recomendações aceitas ou rejeitadas aparecem aqui como histórico de decisões.'
          }
          icone={<Sparkles aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {lista.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {lista.map((recomendacao) => (
            <RecomendacaoCard
              key={recomendacao.id}
              recomendacao={recomendacao}
              onAceitar={setConfirmacao}
              onRejeitar={(item) => void aoRejeitar(item)}
              processando={aceitar.isPending || rejeitar.isPending}
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        aberto={Boolean(confirmacao)}
        titulo="Aplicar sugestão da IA"
        descricao={
          confirmacao
            ? `As atividades sugeridas para ${confirmacao.alunoNome} passarão para o nível ${confirmacao.nivelSugerido}. Você pode revisar depois, se necessário.`
            : ''
        }
        rotuloConfirmar="Aplicar sugestão"
        carregando={aceitar.isPending}
        onConfirmar={() => void confirmarAceite()}
        onFechar={() => setConfirmacao(null)}
      />
    </div>
  );
}
