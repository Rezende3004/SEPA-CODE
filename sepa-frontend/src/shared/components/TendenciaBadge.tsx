import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { Tendencia } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { rotuloTendencia } from '@/shared/lib/format';

interface TendenciaBadgeProps {
  tendencia: Tendencia;
  className?: string;
}

const configuracao = {
  EVOLUCAO: { variante: 'sucesso' as const, Icone: TrendingUp },
  ESTAGNACAO: { variante: 'atencao' as const, Icone: Minus },
  REGRESSAO: { variante: 'perigo' as const, Icone: TrendingDown },
};

export function TendenciaBadge({ tendencia, className }: TendenciaBadgeProps) {
  const { variante, Icone } = configuracao[tendencia];
  return (
    <Badge variante={variante} className={className}>
      <Icone aria-hidden="true" className="size-3.5" />
      {rotuloTendencia(tendencia)}
    </Badge>
  );
}
