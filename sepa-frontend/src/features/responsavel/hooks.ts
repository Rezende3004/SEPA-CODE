// RF-006 — hooks do responsável. Reutilizam as APIs de alunos, planos e relatórios
// (mesmo contrato), mantendo a feature encapsulada para as páginas.
import { useAlunos } from '@/features/alunos/hooks';
import { usePlanos } from '@/features/planos/hooks';
import { useRelatorioDesempenho } from '@/features/relatorios/hooks';
import { diasAtras, paraInputDate } from '@/shared/lib/format';

export function useFilhos() {
  return useAlunos();
}

export function usePlanosDoFilho(alunoId: number) {
  return usePlanos(alunoId);
}

export function useProgressoFilho(alunoId: number, inicio: string, fim: string) {
  return useRelatorioDesempenho(alunoId, inicio, fim);
}

export function periodoPadraoResponsavel() {
  return {
    inicio: paraInputDate(diasAtras(90)),
    fim: paraInputDate(new Date()),
  };
}
