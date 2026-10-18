import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardList, LineChart, Mail, Plus, UserRound } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { TendenciaBadge } from '@/shared/components/TendenciaBadge';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { calcularIdade, formatarData, formatarPercentual } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { PlanoCard } from '@/features/planos/components/PlanoCard';
import { PlanoFormModal } from '@/features/planos/components/PlanoFormModal';
import { usePlanos } from '@/features/planos/hooks';
import { useAluno } from '../hooks';

export function AlunoDetailPage() {
  const { alunoId } = useParams();
  const id = Number(alunoId);
  const aluno = useAluno(id);
  const planos = usePlanos(id);
  const [modalPlano, setModalPlano] = useState(false);

  if (aluno.isLoading) return <LoadingState mensagem="Carregando aluno…" />;

  if (aluno.isError) {
    return (
      <ErrorState
        mensagem={getApiErrorMessage(aluno.error)}
        onTentarNovamente={() => void aluno.refetch()}
      />
    );
  }

  if (!aluno.data) return null;
  const dados = aluno.data;

  return (
    <div className="space-y-6">
      <Link
        to={rotas.profissional.alunos}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para alunos
      </Link>

      <PageHeader
        sobretitulo="Acompanhamento"
        titulo={dados.nome}
        descricao={dados.observacoes || 'Sem observações registradas.'}
        acoes={
          <>
            <Link
              to={rotas.profissional.relatorio(dados.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 text-sm font-semibold text-primary-dark hover:bg-primary-soft"
            >
              <LineChart aria-hidden="true" className="size-4" />
              Relatório
            </Link>
            <Button onClick={() => setModalPlano(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Novo plano
            </Button>
          </>
        }
      />

      <section aria-labelledby="dados-aluno" className="space-y-3">
        <h2 id="dados-aluno" className="sr-only">
          Dados do aluno
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <UserRound aria-hidden="true" className="size-4" />
                Idade
              </p>
              <p className="mt-1 text-xl font-bold text-ink">
                {calcularIdade(dados.dataNascimento)} anos
              </p>
              <p className="text-xs text-muted">Nascimento em {formatarData(dados.dataNascimento)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Mail aria-hidden="true" className="size-4" />
                Responsável
              </p>
              <p className="mt-1 font-semibold text-ink">{dados.responsavelNome}</p>
              <p className="break-all text-xs text-muted">{dados.responsavelEmail}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <CalendarDays aria-hidden="true" className="size-4" />
                Média recente
              </p>
              <p className="mt-1 text-xl font-bold text-ink">
                {formatarPercentual(dados.mediaRecente)}
              </p>
              <TendenciaBadge tendencia={dados.tendencia} className="mt-1" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <ClipboardList aria-hidden="true" className="size-4" />
                Planos
              </p>
              <p className="mt-1 text-xl font-bold text-ink">{dados.totalPlanos}</p>
              <p className="text-xs text-muted">Planos de atendimento vinculados</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="planos-titulo" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="planos-titulo" className="text-lg font-semibold text-ink">
            Planos de atendimento
          </h2>
          <Button variante="secundario" tamanho="pequeno" onClick={() => setModalPlano(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Adicionar plano
          </Button>
        </div>

        {planos.isLoading ? <LoadingState variante="cards" /> : null}
        {planos.isError ? (
          <ErrorState
            mensagem={getApiErrorMessage(planos.error)}
            onTentarNovamente={() => void planos.refetch()}
          />
        ) : null}

        {planos.isSuccess && (planos.data ?? []).length === 0 ? (
          <EmptyState
            titulo="Nenhum plano criado"
            descricao="Crie um plano para organizar objetivos e associar atividades ao aluno."
            acao={<Button onClick={() => setModalPlano(true)}>Criar primeiro plano</Button>}
          />
        ) : null}

        {planos.data && planos.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planos.data.map((plano) => (
              <PlanoCard key={plano.id} plano={plano} />
            ))}
          </div>
        ) : null}
      </section>

      <PlanoFormModal
        aberto={modalPlano}
        alunoId={id}
        onFechar={() => setModalPlano(false)}
      />
    </div>
  );
}
