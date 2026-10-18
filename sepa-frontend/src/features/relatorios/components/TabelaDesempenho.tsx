import type { DesempenhoPorAtividade } from '@/shared/types';
import { TendenciaBadge } from '@/shared/components/TendenciaBadge';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { formatarPercentual } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface DesempenhoPorAtividadeProps {
  dados: DesempenhoPorAtividade[];
  selecionadaId?: number;
  onSelecionar: (atividadeId: number) => void;
}

export function TabelaDesempenho({
  dados,
  selecionadaId,
  onSelecionar,
}: DesempenhoPorAtividadeProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">Desempenho por atividade no período</caption>
        <thead className="bg-canvas/70 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Atividade
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Nível
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Média
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Execuções
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Tendência
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Ver curva</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.map((linha) => (
            <tr
              key={linha.atividadeId}
              className={cn(
                'border-t border-line/70',
                selecionadaId === linha.atividadeId && 'bg-primary-soft/40',
              )}
            >
              <td className="px-4 py-3 font-semibold text-ink">{linha.titulo}</td>
              <td className="px-4 py-3">
                <NivelDificuldade nivel={linha.nivelDificuldade} comRotulo={false} />
              </td>
              <td className="px-4 py-3 font-medium text-ink">
                {formatarPercentual(linha.mediaResultado)}
              </td>
              <td className="px-4 py-3 text-muted">{linha.totalExecucoes}</td>
              <td className="px-4 py-3">
                <TendenciaBadge tendencia={linha.tendencia} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelecionar(linha.atividadeId)}
                  aria-pressed={selecionadaId === linha.atividadeId}
                  className="min-h-9 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
                >
                  Ver curva
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
