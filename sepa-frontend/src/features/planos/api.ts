import type { PlanoDetalhado } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';
import type { DadosPlano } from './schemas';

export async function listarPlanos(alunoId?: number): Promise<PlanoDetalhado[]> {
  const { data } = await apiClient.get<PlanoDetalhado[]>('/planos/', {
    params: alunoId ? { aluno: alunoId } : undefined,
  });
  return data;
}

export async function obterPlano(planoId: number): Promise<PlanoDetalhado> {
  const { data } = await apiClient.get<PlanoDetalhado>(`/planos/${planoId}/`);
  return data;
}

export async function criarPlano(alunoId: number, dados: DadosPlano): Promise<PlanoDetalhado> {
  const { data } = await apiClient.post<PlanoDetalhado>('/planos/', { ...dados, alunoId });
  return data;
}

export async function atualizarPlano(
  planoId: number,
  dados: DadosPlano,
): Promise<PlanoDetalhado> {
  const { data } = await apiClient.patch<PlanoDetalhado>(`/planos/${planoId}/`, dados);
  return data;
}

export async function excluirPlano(planoId: number): Promise<void> {
  await apiClient.delete(`/planos/${planoId}/`);
}

export async function associarAtividade(
  planoId: number,
  atividadeId: number,
): Promise<PlanoDetalhado> {
  const { data } = await apiClient.post<PlanoDetalhado>(`/planos/${planoId}/atividades/`, {
    atividadeId,
  });
  return data;
}

export async function removerAtividade(planoId: number, atividadeId: number): Promise<void> {
  await apiClient.delete(`/planos/${planoId}/atividades/${atividadeId}/`);
}
