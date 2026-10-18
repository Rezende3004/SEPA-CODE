import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PontoCurva } from '@/shared/types';
import { formatarDataCurta, formatarDataHora } from '@/shared/lib/format';

interface CurvaAprendizadoProps {
  titulo: string;
  pontos: PontoCurva[];
}

const rotulos: Record<string, string> = {
  resultado: 'Resultado bruto',
  mediaMovel: 'Média móvel (3)',
  ewma: 'Tendência consolidada (EWMA)',
};

export function CurvaAprendizado({ titulo, pontos }: CurvaAprendizadoProps) {
  return (
    <figure className="rounded-xl border border-line bg-surface p-4">
      <figcaption className="mb-3">
        <p className="font-semibold text-ink">Curva de aprendizado — {titulo}</p>
        <p className="text-xs text-muted">
          Resultado bruto das sessões, média móvel de 3 pontos e tendência suavizada (EWMA),
          equivalente à lógica do protótipo Python.
        </p>
      </figcaption>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={pontos}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D5E2EA" />
            <XAxis
              dataKey="data"
              tickFormatter={(valor: string) => formatarDataCurta(valor)}
              fontSize={12}
              stroke="#4B6273"
            />
            <YAxis domain={[0, 100]} fontSize={12} stroke="#4B6273" unit="%" />
            <Tooltip
              formatter={(valor, nome) => [
                `${Number(valor).toFixed(1)}%`,
                rotulos[String(nome)] ?? String(nome),
              ]}
              labelFormatter={(valor) => formatarDataHora(String(valor))}
            />
            <Legend formatter={(valor) => rotulos[String(valor)] ?? String(valor)} />
            <Line
              type="monotone"
              dataKey="resultado"
              name="resultado"
              stroke="#1F5C8B"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mediaMovel"
              name="mediaMovel"
              stroke="#E07A2F"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ewma"
              name="ewma"
              stroke="#B8860B"
              strokeWidth={2}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
