import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criarAluno, listarAlunos, listarResponsaveis, obterAluno } from './api';

export function useAlunos() {
  return useQuery({
    queryKey: ['alunos'],
    queryFn: listarAlunos,
  });
}

export function useAluno(alunoId: number) {
  return useQuery({
    queryKey: ['alunos', alunoId],
    queryFn: () => obterAluno(alunoId),
    enabled: Number.isFinite(alunoId) && alunoId > 0,
  });
}

export function useResponsaveis() {
  return useQuery({
    queryKey: ['responsaveis'],
    queryFn: listarResponsaveis,
    staleTime: 5 * 60_000,
  });
}

export function useCriarAluno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarAluno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
    },
  });
}
