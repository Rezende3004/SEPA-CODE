import { Link } from 'react-router-dom';
import { LineChart } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { TendenciaBadge } from '@/shared/components/TendenciaBadge';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { calcularIdade, formatarPercentual } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { useAlunos } from '@/features/alunos/hooks';

export function RelatoriosPage() {
  const alunos = useAlunos();

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Relatórios"
        titulo="Relatórios analíticos por aluno"
        descricao="Selecione um aluno para analisar média, tentativas, tendência e a curva de aprendizado no período."
      />

      {alunos.isLoading ? <LoadingState variante="cards" /> : null}
      {alunos.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(alunos.error)}
          onTentarNovamente={() => void alunos.refetch()}
        />
      ) : null}

      {alunos.isSuccess && (alunos.data ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhum aluno para analisar"
          descricao="Cadastre alunos e registre execuções de atividades para gerar relatórios."
          icone={<LineChart aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {alunos.data && alunos.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {alunos.data.map((aluno) => (
            <Link
              key={aluno.id}
              to={rotas.profissional.relatorio(aluno.id)}
              className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink group-hover:text-primary-dark">
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-muted">
                    {calcularIdade(aluno.dataNascimento)} anos · {aluno.responsavelNome}
                  </p>
                </div>
                <TendenciaBadge tendencia={aluno.tendencia} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted">Média recente</p>
                  <p className="text-2xl font-bold text-ink">
                    {formatarPercentual(aluno.mediaRecente)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  <LineChart aria-hidden="true" className="size-4" />
                  Ver relatório
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
