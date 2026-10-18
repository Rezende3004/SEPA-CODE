import { z } from 'zod';
import type { Instituicao, ProfissionalAdmin, StatusAssinatura } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';
import { ESPECIALIDADES } from '@/shared/types';

export const profissionalAdminSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo.'),
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  especialidade: z.enum(ESPECIALIDADES, {
    errorMap: () => ({ message: 'Selecione a especialidade.' }),
  }),
  registroProfissional: z.string().trim().min(3, 'Informe o registro profissional.'),
  instituicaoId: z
    .number({ invalid_type_error: 'Selecione a instituição.' })
    .int()
    .positive('Selecione a instituição.'),
});

export type DadosProfissionalAdmin = z.infer<typeof profissionalAdminSchema>;

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
