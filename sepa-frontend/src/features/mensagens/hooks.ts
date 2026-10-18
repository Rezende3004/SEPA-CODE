import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  enviarMensagem,
  listarMensagens,
  marcarMensagemLida,
  obterUsuarioResumo,
} from './api';

const INTERVALO_POLLING = 10_000;

export function useMensagens(com?: number) {
  return useQuery({
    queryKey: ['mensagens', com ?? 'todas'],
    queryFn: () => listarMensagens(com),
    refetchInterval: INTERVALO_POLLING,
    refetchIntervalInBackground: false,
  });
}

export function useUsuarioResumo(usuarioId: number | undefined) {
  return useQuery({
    queryKey: ['usuarios', usuarioId ?? 'nenhum'],
    queryFn: () => obterUsuarioResumo(usuarioId as number),
    enabled: typeof usuarioId === 'number' && usuarioId > 0,
    staleTime: 5 * 60_000,
  });
}

export function useEnviarMensagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { destinatarioId: number; conteudoTexto: string }) =>
      enviarMensagem(dados.destinatarioId, dados.conteudoTexto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
    },
  });
}

export function useMarcarMensagemLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => marcarMensagemLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
    },
  });
}
