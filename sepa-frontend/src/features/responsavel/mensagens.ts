import type { Tendencia } from '@/shared/types';

export function mensagemSimples(tendencia: Tendencia): string {
  if (tendencia === 'EVOLUCAO') return 'Está evoluindo bem nas atividades.';
  if (tendencia === 'REGRESSAO') return 'Teve uma queda nas últimas semanas. A equipe está atenta.';
  return 'Está em um momento de estabilidade. A equipe está acompanhando de perto.';
}
