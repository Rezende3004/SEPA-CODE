import type { Instituicao, ProfissionalAdmin, StatusAssinatura } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';
import type { DadosProfissionalAdmin } from './schemas';

export async function listarInstituicoesAdmin(): Promise<Instituicao[]> {
  const { data } = await apiClient.get<Instituicao[]>('/admin/instituicoes/');
  return data;
}

export async function atualizarStatusInstituicao(
  id: number,
  statusAssinatura: StatusAssinatura,
): Promise<Instituicao> {
  const { data } = await apiClient.patch<Instituicao>(`/admin/instituicoes/${id}/`, {
    statusAssinatura,
  });
  return data;
}

export async function listarProfissionaisAdmin(): Promise<ProfissionalAdmin[]> {
  const { data } = await apiClient.get<ProfissionalAdmin[]>('/admin/profissionais/');
  return data;
}

export async function criarProfissionalAdmin(
  dados: DadosProfissionalAdmin,
): Promise<ProfissionalAdmin> {
  const { data } = await apiClient.post<ProfissionalAdmin>('/admin/profissionais/', dados);
  return data;
}

export async function alternarAtivoProfissional(
  id: number,
  ativo: boolean,
): Promise<ProfissionalAdmin> {
  const { data } = await apiClient.patch<ProfissionalAdmin>(`/admin/profissionais/${id}/`, {
    ativo,
  });
  return data;
}
