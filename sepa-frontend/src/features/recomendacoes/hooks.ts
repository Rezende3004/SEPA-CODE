import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aceitarRecomendacao, listarRecomendacoes, rejeitarRecomendacao } from './api';
import type { FiltrosRecomendacao } from './api';

function useInvalidarRecomendacoes() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['recomendacoes'] });
    queryClient.invalidateQueries({ queryKey: ['atividades'] });
    queryClient.invalidateQueries({ queryKey: ['planos'] });
    queryClient.invalidateQueries({ queryKey: ['alunos'] });
  };
}

export function useRecomendacoes(filtros: FiltrosRecomendacao = {}) {
  return useQuery({
    queryKey: ['recomendacoes', filtros.alunoId ?? 'todos', filtros.status ?? 'todos'],
    queryFn: () => listarRecomendacoes(filtros),
  });
}

export function useAceitarRecomendacao() {
  const invalidar = useInvalidarRecomendacoes();
  return useMutation({
    mutationFn: (id: number) => aceitarRecomendacao(id),
    onSuccess: invalidar,
  });
}

export function useRejeitarRecomendacao() {
  const invalidar = useInvalidarRecomendacoes();
  return useMutation({
    mutationFn: (id: number) => rejeitarRecomendacao(id),
    onSuccess: invalidar,
  });
}
