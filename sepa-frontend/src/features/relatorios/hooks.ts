import { useQuery } from '@tanstack/react-query';
import { obterRelatorioDesempenho } from './api';

export function useRelatorioDesempenho(alunoId: number, inicio: string, fim: string) {
  return useQuery({
    queryKey: ['relatorios', alunoId, inicio, fim],
    queryFn: () => obterRelatorioDesempenho(alunoId, inicio, fim),
    enabled: alunoId > 0 && Boolean(inicio) && Boolean(fim),
  });
}
