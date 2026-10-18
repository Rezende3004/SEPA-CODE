// RF-005 — relatório analítico por aluno.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LineChart } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { diasAtras, paraInputDate } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { useAluno } from '@/features/alunos/hooks';
import { AlertaEstagnacao } from '../components/AlertaEstagnacao';
import { CurvaAprendizado } from '../components/CurvaAprendizado';
import { FiltroPeriodo } from '../components/FiltroPeriodo';
import { KpisDesempenho } from '../components/KpisDesempenho';
import { TabelaDesempenho } from '../components/TabelaDesempenho';
import { useRelatorioDesempenho } from '../hooks';

export function RelatorioAlunoPage() {
  const { alunoId } = useParams();
  const id = Number(alunoId);
  const aluno = useAluno(id);
  const [inicio, setInicio] = useState(paraInputDate(diasAtras(60)));
  const [fim, setFim] = useState(paraInputDate(new Date()));
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<number | null>(null);
  const relatorio = useRelatorioDesempenho(id, inicio, fim);

  if (aluno.isLoading) return <LoadingState mensagem="Carregando aluno…" />;
  if (aluno.isError) {
    return (
      <ErrorState
        mensagem={getApiErrorMessage(aluno.error)}
        onTentarNovamente={() => void aluno.refetch()}
      />
    );
  }

  const nome = aluno.data?.nome ?? 'Aluno';
  const dados = relatorio.data;
  const atividade =
    dados?.porAtividade.find((item) => item.atividadeId === atividadeSelecionada) ??
    dados?.porAtividade[0];

  return (
    <div className="space-y-6">
      <Link
        to={rotas.profissional.aluno(id)}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para o acompanhamento
      </Link>

      <PageHeader
        sobretitulo="Relatório analítico"
        titulo={nome}
        descricao="Média, tentativas, tendência e curva de aprendizado por atividade. Use o período para investigar mudanças."
      />

      <FiltroPeriodo
        inicio={inicio}
        fim={fim}
        onMudar={(novoInicio, novoFim) => {
          setInicio(novoInicio);
          setFim(novoFim);
          setAtividadeSelecionada(null);
        }}
      />

      {relatorio.isLoading ? <LoadingState variante="cards" /> : null}
      {relatorio.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(relatorio.error)}
          onTentarNovamente={() => void relatorio.refetch()}
        />
      ) : null}

      {dados ? (
        <>
          {dados.alertaEstagnacao ? <AlertaEstagnacao /> : null}
          <KpisDesempenho resumo={dados.resumo} />

          {dados.porAtividade.length === 0 ? (
            <EmptyState
              titulo="Sem execuções no período"
              descricao="Escolha outro intervalo ou aguarde o aluno concluir atividades para visualizar a curva."
              icone={<LineChart aria-hidden="true" className="size-6" />}
            />
          ) : (
            <>
              {atividade ? (
                <CurvaAprendizado
                  key={atividade.atividadeId}
                  titulo={atividade.titulo}
                  pontos={atividade.pontos}
                />
              ) : null}

              <section aria-labelledby="tabela-titulo" className="space-y-3">
                <h2 id="tabela-titulo" className="text-lg font-semibold text-ink">
                  Desempenho por atividade
                </h2>
                <TabelaDesempenho
                  dados={dados.porAtividade}
                  selecionadaId={atividade?.atividadeId}
                  onSelecionar={setAtividadeSelecionada}
                />
              </section>

              <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
                <strong className="text-ink">Leitura do período:</strong> {dados.observacoes}
              </p>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
