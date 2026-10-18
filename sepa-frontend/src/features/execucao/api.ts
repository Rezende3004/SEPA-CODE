import type { AtividadeAtribuida } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';
import type { DadosHistorico } from './schemas';

export async function listarAtividadesAluno(): Promise<AtividadeAtribuida[]> {
  const { data } = await apiClient.get<AtividadeAtribuida[]>('/aluno/atividades/');
  return data;
}

export async function registrarHistorico(dados: DadosHistorico): Promise<void> {
  await apiClient.post('/historico/', dados);
}
