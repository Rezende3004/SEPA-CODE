import type { Atividade } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';

export async function listarAtividades(): Promise<Atividade[]> {
  const { data } = await apiClient.get<Atividade[]>('/atividades/');
  return data;
}
