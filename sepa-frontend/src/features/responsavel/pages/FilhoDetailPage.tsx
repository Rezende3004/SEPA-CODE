// RF-006 — detalhe simplificado do progresso do filho.
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { calcularIdade } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { useAluno } from '@/features/alunos/hooks';
import { ProgressoSimplificado } from '../components/ProgressoSimplificado';
import { periodoPadraoResponsavel, usePlanosDoFilho, useProgressoFilho } from '../hooks';

export function FilhoDetailPage() {
  const { alunoId } = useParams();
  const id = Number(alunoId);
  const aluno = useAluno(id);
  const planos = usePlanosDoFilho(id);
  const periodo = periodoPadraoResponsavel();
  const relatorio = useProgressoFilho(id, periodo.inicio, periodo.fim);

  if (aluno.isLoading) return <LoadingState mensagem="Carregando informações…" />;
  if (aluno.isError) {
    return (
      <ErrorState
        mensagem={getApiErrorMessage(aluno.error)}
        onTentarNovamente={() => void aluno.refetch()}
      />
    );
  }

  const dados = aluno.data;
  if (!dados) return null;
  const profissionalId = planos.data?.[0]?.profissionalId;

  return (
    <div className="space-y-6">
      <Link
        to={rotas.responsavel.raiz}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para meus filhos
      </Link>

      <PageHeader
        sobretitulo="Acompanhamento"
        titulo={`Progresso de ${dados.nome}`}
        descricao={`${calcularIdade(dados.dataNascimento)} anos · informações registradas pelos profissionais da instituição.`}
        acoes={
          profissionalId ? (
            <Link
              to={rotas.responsavel.conversa(profissionalId)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white hover:bg-primary-dark"
            >
              <MessageSquare aria-hidden="true" className="size-4" />
              Conversar com o profissional
            </Link>
          ) : undefined
        }
      />

      {relatorio.isLoading ? <LoadingState variante="cards" /> : null}
      {relatorio.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(relatorio.error)}
          onTentarNovamente={() => void relatorio.refetch()}
        />
      ) : null}

      {relatorio.data ? (
        relatorio.data.porAtividade.length > 0 ? (
          <ProgressoSimplificado
            nome={dados.nome}
            resumo={relatorio.data.resumo}
            atividades={relatorio.data.porAtividade}
          />
        ) : (
          <EmptyState
            titulo="Ainda não há atividades registradas"
            descricao="Quando o aluno concluir atividades, o progresso aparece aqui de forma simples e sem termos técnicos."
          />
        )
      ) : null}
    </div>
  );
}
