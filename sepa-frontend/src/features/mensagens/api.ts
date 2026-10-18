import { z } from 'zod';
import type { MensagemDetalhada, UsuarioResumo } from '@/shared/types';
import { apiClient } from '@/shared/lib/api-client';

export async function listarMensagens(com?: number): Promise<MensagemDetalhada[]> {
  const { data } = await apiClient.get<MensagemDetalhada[]>('/mensagens/', {
    params: com !== undefined ? { com } : undefined,
  });
  return data;
}

export async function enviarMensagem(
  destinatarioId: number,
  conteudoTexto: string,
): Promise<MensagemDetalhada> {
  const { data } = await apiClient.post<MensagemDetalhada>('/mensagens/', {
    destinatarioId,
    conteudoTexto,
  });
  return data;
}

export async function marcarMensagemLida(id: number): Promise<MensagemDetalhada> {
  const { data } = await apiClient.post<MensagemDetalhada>(`/mensagens/${id}/lida/`);
  return data;
}

export async function obterUsuarioResumo(id: number): Promise<UsuarioResumo> {
  const { data } = await apiClient.get<UsuarioResumo>(`/usuarios/${id}/`);
  return data;
}

export const mensagemSchema = z.object({
  conteudoTexto: z
    .string()
    .trim()
    .min(1, 'Escreva uma mensagem.')
    .max(4000, 'A mensagem deve ter no máximo 4000 caracteres.'),
});

export type DadosMensagem = z.infer<typeof mensagemSchema>;
