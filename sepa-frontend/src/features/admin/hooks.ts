import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  alternarAtivoProfissional,
  atualizarStatusInstituicao,
  criarProfissionalAdmin,
  listarInstituicoesAdmin,
  listarProfissionaisAdmin,
} from './api';

export function useInstituicoesAdmin() {
  return useQuery({
    queryKey: ['admin', 'instituicoes'],
    queryFn: listarInstituicoesAdmin,
  });
}

export function useAtualizarStatusInstituicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { id: number; status: Parameters<typeof atualizarStatusInstituicao>[1] }) =>
      atualizarStatusInstituicao(dados.id, dados.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instituicoes'] });
      queryClient.invalidateQueries({ queryKey: ['instituicoes'] });
    },
  });
}

export function useProfissionaisAdmin() {
  return useQuery({
    queryKey: ['admin', 'profissionais'],
    queryFn: listarProfissionaisAdmin,
  });
}

export function useCriarProfissionalAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarProfissionalAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profissionais'] });
    },
  });
}

export function useAlternarAtivoProfissional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { id: number; ativo: boolean }) =>
      alternarAtivoProfissional(dados.id, dados.ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profissionais'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instituicoes'] });
    },
  });
}
