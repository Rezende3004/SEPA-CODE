import type { RecomendacaoDetalhada, StatusRecomendacao } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';

export interface FiltrosRecomendacao {
  alunoId?: number;
  status?: StatusRecomendacao;
}

export async function listarRecomendacoes(
  filtros: FiltrosRecomendacao = {},
): Promise<RecomendacaoDetalhada[]> {
  const { data } = await apiClient.get<RecomendacaoDetalhada[]>('/recomendacoes/', {
    params: {
      aluno: filtros.alunoId,
      status: filtros.status,
    },
  });
  return data;
}

export async function aceitarRecomendacao(id: number): Promise<RecomendacaoDetalhada> {
  const { data } = await apiClient.post<RecomendacaoDetalhada>(`/recomendacoes/${id}/aceitar/`);
  return data;
}

export async function rejeitarRecomendacao(id: number): Promise<RecomendacaoDetalhada> {
  const { data } = await apiClient.post<RecomendacaoDetalhada>(`/recomendacoes/${id}/rejeitar/`);
  return data;
}
