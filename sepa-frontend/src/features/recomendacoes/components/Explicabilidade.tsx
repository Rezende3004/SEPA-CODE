import type { FatorRecomendacao } from '@/shared/types';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';

interface ExplicabilidadeProps {
  fatores: FatorRecomendacao[];
}

function formatarValor(valor: number): string {
  return Number.isInteger(valor) ? `${valor}` : valor.toFixed(1);
}

export function Explicabilidade({ fatores }: ExplicabilidadeProps) {
  const maiorPeso = Math.max(...fatores.map((fator) => fator.peso), 0.0001);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">Por que a IA sugeriu isso?</h3>
      <ul className="space-y-3">
        {fatores.map((fator) => (
          <li key={fator.metrica} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-ink">{fator.metrica}</span>
              <span className="text-muted">
                valor {formatarValor(fator.valor)} · peso {Math.round(fator.peso * 100)}%
              </span>
            </div>
            <ProgressBar
              valor={fator.peso}
              maximo={maiorPeso}
              rotulo={`${fator.metrica}: peso ${Math.round(fator.peso * 100)}%`}
              tom="primario"
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        As barras comparam a influência relativa de cada métrica na sugestão. Pesos maiores pesaram
        mais na decisão do modelo.
      </p>
    </div>
  );
}
