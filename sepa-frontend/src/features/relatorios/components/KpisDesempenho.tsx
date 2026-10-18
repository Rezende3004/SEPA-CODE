import { Activity, Percent, Repeat, Sparkles, TrendingUp } from 'lucide-react';
import type { ResumoDesempenho } from '@/shared/types';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { TendenciaBadge } from '@/shared/components/TendenciaBadge';
import { formatarPercentual } from '@/shared/lib/format';

export function KpisDesempenho({ resumo }: { resumo: ResumoDesempenho }) {
  const indicadores = [
    {
      rotulo: 'Média de resultados',
      valor: formatarPercentual(resumo.mediaResultado),
      detalhe: `${resumo.totalExecucoes} execuções no período`,
      icone: Percent,
    },
    {
      rotulo: 'Total de tentativas',
      valor: `${resumo.totalTentativas}`,
      detalhe: 'Somatório das tentativas registradas',
      icone: Repeat,
    },
    {
      rotulo: 'Tendência (slope)',
      valor: `${resumo.slope > 0 ? '+' : ''}${resumo.slope} pts/sessão`,
      detalhe: 'Coeficiente angular da curva',
      icone: TrendingUp,
    },
    {
      rotulo: 'Pedidos de ajuda',
      valor: `${resumo.pedidosAjuda}`,
      detalhe: 'Execuções com apoio solicitado',
      icone: Sparkles,
    },
  ];

  return (
    <section aria-labelledby="resumo-titulo" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="resumo-titulo" className="text-lg font-semibold text-ink">
          Resumo do período
        </h2>
        <TendenciaBadge tendencia={resumo.tendencia} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map(({ rotulo, valor, detalhe, icone: Icone }) => (
          <Card key={rotulo}>
            <CardContent className="pt-5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Icone aria-hidden="true" className="size-4" />
                {rotulo}
              </p>
              <p className="mt-1 text-xl font-bold text-ink">{valor}</p>
              <p className="text-xs text-muted">{detalhe}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {resumo.totalExecucoes === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Activity aria-hidden="true" className="size-4" />
          Nenhuma execução registrada no período selecionado.
        </p>
      ) : null}
    </section>
  );
}
