import type { DesempenhoPorAtividade, ResumoDesempenho, Tendencia } from '@/shared/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/Card';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { formatarPercentual } from '@/shared/lib/format';

interface ProgressoSimplificadoProps {
  nome: string;
  resumo: ResumoDesempenho;
  atividades: DesempenhoPorAtividade[];
}

function textoResumo(tendencia: Tendencia): string {
  if (tendencia === 'EVOLUCAO') {
    return 'Os resultados mostram que está aprendendo e ganhando confiança a cada atividade.';
  }
  if (tendencia === 'REGRESSAO') {
    return 'Os resultados caíram um pouco. A equipe já foi informada e vai ajustar o acompanhamento.';
  }
  return 'Os resultados estão estáveis. É normal ter momentos de consolidação antes de avançar.';
}

export function ProgressoSimplificado({ nome, resumo, atividades }: ProgressoSimplificadoProps) {
  const pontosFortes = atividades.filter((atividade) => atividade.mediaResultado >= 70);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Como está o acompanhamento de {nome}</CardTitle>
          <CardDescription>{textoResumo(resumo.tendencia)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            valor={resumo.mediaResultado}
            rotulo="Resultado geral das atividades"
            tom={resumo.tendencia === 'EVOLUCAO' ? 'sucesso' : 'primario'}
          />
          <p className="text-sm text-muted">
            No período acompanhado foram {resumo.totalExecucoes} atividade
            {resumo.totalExecucoes === 1 ? '' : 's'} concluída
            {resumo.totalExecucoes === 1 ? '' : 's'}, com média de{' '}
            {formatarPercentual(resumo.mediaResultado)} de acerto.
          </p>
          {resumo.pedidosAjuda > 0 ? (
            <p className="rounded-lg bg-success-soft p-3 text-sm text-success">
              Pediu ajuda {resumo.pedidosAjuda} vez
              {resumo.pedidosAjuda === 1 ? '' : 'es'} quando teve dúvida. Isso mostra autonomia para
              reconhecer quando precisa de apoio.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {pontosFortes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Atividades em que se destaca</CardTitle>
            <CardDescription>O que está indo bem no momento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pontosFortes.map((atividade) => (
              <ProgressBar
                key={atividade.atividadeId}
                valor={atividade.mediaResultado}
                rotulo={atividade.titulo}
                tom="sucesso"
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>O que estamos praticando</CardTitle>
          <CardDescription>Mesma atividade, com o título que aparece para o aluno.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {atividades.map((atividade) => (
              <li key={atividade.atividadeId}>
                <ProgressBar
                  valor={atividade.mediaResultado}
                  rotulo={`${atividade.titulo} (${atividade.totalExecucoes} vez${
                    atividade.totalExecucoes === 1 ? '' : 'es'
                  })`}
                  tom="primario"
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
