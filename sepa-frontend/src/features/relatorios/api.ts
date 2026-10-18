import type { RelatorioDesempenho } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';

export async function obterRelatorioDesempenho(
  alunoId: number,
  inicio: string,
  fim: string,
): Promise<RelatorioDesempenho> {
  const { data } = await apiClient.get<RelatorioDesempenho>('/relatorios/desempenho/', {
    params: { aluno: alunoId, inicio, fim },
  });
  return data;
}
