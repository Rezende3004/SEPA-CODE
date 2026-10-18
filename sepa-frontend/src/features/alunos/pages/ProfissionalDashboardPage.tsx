import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardList,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { formatarPercentual } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/use-auth';
import { rotas } from '@/app/router/paths';
import { AlunoFormModal } from '../components/AlunoFormModal';
import { AlunoResumoCard } from '../components/AlunosTable';
import { useAlunos } from '../hooks';
import { usePlanos } from '@/features/planos/hooks';

export function ProfissionalDashboardPage() {
  const { usuario } = useAuth();
  const alunos = useAlunos();
  const planos = usePlanos();
  const [modalAberto, setModalAberto] = useState(false);

  const lista = alunos.data ?? [];
  const emAtencao = lista.filter((aluno) => aluno.tendencia === 'ESTAGNACAO');
  const mediaGeral =
    lista.length > 0 ? lista.reduce((soma, aluno) => soma + aluno.mediaRecente, 0) / lista.length : 0;

  const indicadores = [
    { rotulo: 'Alunos acompanhados', valor: `${lista.length}`, icone: Users, tom: 'primario' },
    {
      rotulo: 'Precisam de atenção',
      valor: `${emAtencao.length}`,
      icone: AlertTriangle,
      tom: 'atencao',
    },
    {
      rotulo: 'Planos ativos',
      valor: `${(planos.data ?? []).length}`,
      icone: ClipboardList,
      tom: 'primario',
    },
    {
      rotulo: 'Média geral recente',
      valor: formatarPercentual(mediaGeral),
      icone: TrendingIcon,
      tom: 'sucesso',
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        sobretitulo={`Olá, ${usuario?.nome.split(' ')[0] ?? 'profissional'}`}
        titulo="Visão geral da instituição"
        descricao="Acompanhe os alunos, identifique quem precisa de atenção e acesse rapidamente planos, relatórios e recomendações."
        acoes={
          <>
            <Link
              to={rotas.profissional.atividades}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              <BookOpenCheck aria-hidden="true" className="size-4" />
              Catálogo
            </Link>
            <Button onClick={() => setModalAberto(true)}>
              <UserPlus aria-hidden="true" className="size-4" />
              Novo aluno
            </Button>
          </>
        }
      />

      {alunos.isLoading ? <LoadingState variante="cards" /> : null}
      {alunos.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(alunos.error)}
          onTentarNovamente={() => void alunos.refetch()}
        />
      ) : null}

      {alunos.isSuccess ? (
        <>
          <section aria-labelledby="indicadores-titulo" className="space-y-3">
            <h2 id="indicadores-titulo" className="sr-only">
              Indicadores
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {indicadores.map(({ rotulo, valor, icone: Icone, tom }) => (
                <Card key={rotulo}>
                  <CardContent className="flex items-center gap-3 pt-5">
                    <span
                      className={
                        tom === 'atencao'
                          ? 'flex size-11 items-center justify-center rounded-lg bg-warning-soft text-warning'
                          : tom === 'sucesso'
                            ? 'flex size-11 items-center justify-center rounded-lg bg-success-soft text-success'
                            : 'flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary'
                      }
                    >
                      <Icone aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-muted">{rotulo}</p>
                      <p className="text-xl font-bold text-ink">{valor}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {emAtencao.length > 0 ? (
            <section
              aria-labelledby="atencao-titulo"
              className="rounded-xl border border-warning/30 bg-warning-soft/60 p-4"
            >
              <h2
                id="atencao-titulo"
                className="flex items-center gap-2 text-base font-semibold text-warning"
              >
                <AlertTriangle aria-hidden="true" className="size-5" />
                Alunos em estagnação
              </h2>
              <p className="mt-1 text-sm text-ink">
                A tendência recente não mostra ganho consistente. Vale revisar o plano e as
                recomendações da IA.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {emAtencao.map((aluno) => (
                  <li key={aluno.id}>
                    <Link
                      to={rotas.profissional.relatorio(aluno.id)}
                      className="inline-flex min-h-10 items-center rounded-lg border border-warning/30 bg-surface px-3 text-sm font-semibold text-warning hover:bg-warning-soft"
                    >
                      {aluno.nome} · {formatarPercentual(aluno.mediaRecente)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="alunos-titulo" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="alunos-titulo" className="text-lg font-semibold text-ink">
                Meus alunos
              </h2>
              <Link
                to={rotas.profissional.alunos}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-primary hover:bg-primary-soft"
              >
                Ver todos
              </Link>
            </div>

            {lista.length === 0 ? (
              <EmptyState
                titulo="Nenhum aluno vinculado"
                descricao="Cadastre o primeiro aluno para começar a montar planos de atendimento."
                acao={<Button onClick={() => setModalAberto(true)}>Cadastrar aluno</Button>}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((aluno) => (
                  <AlunoResumoCard key={aluno.id} aluno={aluno} />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              to={rotas.profissional.recomendacoes}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-card hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-ink">Recomendações da IA</span>
                <span className="block text-sm text-muted">
                  Revise sugestões com explicabilidade e decida.
                </span>
              </span>
            </Link>
            <Link
              to={rotas.profissional.mensagens}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-card hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-secondary-soft text-secondary-dark">
                <ClipboardList aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-ink">Mensagens</span>
                <span className="block text-sm text-muted">
                  Converse com responsáveis sobre o acompanhamento.
                </span>
              </span>
            </Link>
          </section>
        </>
      ) : null}

      <AlunoFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return <Sparkles aria-hidden="true" className={className} />;
}
