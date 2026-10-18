import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { rotas } from '@/app/router/paths';
import { rotuloTipoAtividade } from '@/features/atividades/labels';
import { AtividadeAssociacao } from '../components/AtividadeAssociacao';
import { AtividadeSequencia } from '../components/AtividadeSequencia';
import { TelaConclusao } from '../components/TelaConclusao';
import { useAtividadesAluno, useRegistrarHistorico } from '../hooks';
import { feedbackConclusao, type ResultadoExecucao } from '../types';
import type { DadosHistorico } from '../schemas';

export function ExecutarAtividadePage() {
  const { atividadeId } = useParams();
  const id = Number(atividadeId);
  const { usuario } = useAuth();
  const atividades = useAtividadesAluno();
  const registrar = useRegistrarHistorico();
  const [resultado, setResultado] = useState<ResultadoExecucao | null>(null);
  const [rodada, setRodada] = useState(0);

  if (atividades.isLoading) return <LoadingState mensagem="Preparando a atividade…" />;

  if (atividades.isError) {
    return (
      <ErrorState
        mensagem={getApiErrorMessage(atividades.error)}
        onTentarNovamente={() => void atividades.refetch()}
      />
    );
  }

  const atividade = (atividades.data ?? []).find((item) => item.id === id);

  if (!atividade) {
    return (
      <div className="space-y-4">
        <Link
          to={rotas.aluno.raiz}
          className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-kid-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Voltar para minhas atividades
        </Link>
        <EmptyState
          titulo="Atividade não encontrada"
          descricao="Esta atividade não está atribuída a você. Volte para a lista e escolha uma das suas atividades."
          icone={<ClipboardList aria-hidden="true" className="size-6" />}
          acao={
            <Link
              to={rotas.aluno.raiz}
              className="inline-flex min-h-12 items-center rounded-lg bg-kid-primary px-5 font-semibold text-white"
            >
              Ver minhas atividades
            </Link>
          }
        />
      </div>
    );
  }

  const atividadeSelecionada = atividade;

  function montarPayload(dados: ResultadoExecucao): DadosHistorico {
    return {
      atividadeId: atividadeSelecionada.id,
      resultado: dados.resultado,
      tentativas: dados.tentativas,
      tempoRespostaSeg: dados.tempoRespostaSeg,
      feedback: `${feedbackConclusao(dados.resultado)} (${atividadeSelecionada.titulo})`,
      pediuAjuda: dados.pediuAjuda,
    };
  }

  function aoConcluir(dados: ResultadoExecucao) {
    setResultado(dados);
    registrar.mutate(montarPayload(dados));
  }

  return (
    <div className="space-y-5">
      {resultado ? (
        <TelaConclusao
          resultado={resultado}
          salvando={registrar.isPending}
          erro={registrar.isError ? getApiErrorMessage(registrar.error) : null}
          onTentarRegistrar={() => {
            if (resultado) registrar.mutate(montarPayload(resultado));
          }}
          onJogarNovamente={() => {
            registrar.reset();
            setResultado(null);
            setRodada((valor) => valor + 1);
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={rotas.aluno.raiz}
              className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-kid-primary hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              Minhas atividades
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-kid-muted">
                {rotuloTipoAtividade[atividade.tipoAtividade]}
              </span>
              <NivelDificuldade nivel={atividade.nivelDificuldade} tom="crianca" />
            </div>
          </div>

          <header>
            <h1 className="text-balance text-2xl font-bold text-kid-muted sm:text-3xl">
              {atividade.titulo}
            </h1>
            <p className="mt-1 text-base text-kid-muted">{atividade.descricao}</p>
          </header>

          {atividade.tipoAtividade === 'ASSOCIACAO' ? (
            <AtividadeAssociacao
              key={`${atividade.id}-${rodada}`}
              atividade={atividade}
              alunoId={usuario?.id ?? 0}
              aoConcluir={aoConcluir}
            />
          ) : (
            <AtividadeSequencia
              key={`${atividade.id}-${rodada}`}
              atividade={atividade}
              alunoId={usuario?.id ?? 0}
              aoConcluir={aoConcluir}
            />
          )}
        </>
      )}
    </div>
  );
}
