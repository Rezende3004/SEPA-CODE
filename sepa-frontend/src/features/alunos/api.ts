import type { AlunoResumo } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';
import type { DadosAluno } from './schemas';

export interface ResponsavelOpcao {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  instituicaoId: number;
}

export async function listarAlunos(): Promise<AlunoResumo[]> {
  const { data } = await apiClient.get<AlunoResumo[]>('/alunos/');
  return data;
}

export async function obterAluno(alunoId: number): Promise<AlunoResumo> {
  const { data } = await apiClient.get<AlunoResumo>(`/alunos/${alunoId}/`);
  return data;
}

export async function criarAluno(dados: DadosAluno): Promise<AlunoResumo> {
  const { data } = await apiClient.post<AlunoResumo>('/alunos/', dados);
  return data;
}

export async function listarResponsaveis(): Promise<ResponsavelOpcao[]> {
  const { data } = await apiClient.get<ResponsavelOpcao[]>('/responsaveis/');
  return data;
}
