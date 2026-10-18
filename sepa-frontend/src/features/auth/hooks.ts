import { useMutation, useQuery } from '@tanstack/react-query';
import { listarInstituicoesPublicas } from './api';
import { useAuth } from './use-auth';
import type { DadosCadastro, DadosLogin } from './schemas';

/** A sessão em si é mantida pelo AuthProvider; a mutação apenas orquestra a chamada. */
export function useLogin() {
  const { entrar } = useAuth();
  return useMutation({
    mutationFn: (dados: DadosLogin) => entrar(dados),
  });
}

export function useCadastro() {
  const { cadastrar } = useAuth();
  return useMutation({
    mutationFn: (dados: DadosCadastro) => cadastrar(dados),
  });
}

export function useInstituicoesPublicas() {
  return useQuery({
    queryKey: ['instituicoes', 'publicas'],
    queryFn: listarInstituicoesPublicas,
    staleTime: 5 * 60_000,
  });
}
