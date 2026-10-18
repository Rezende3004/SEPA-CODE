import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarAtividadesAluno, registrarHistorico } from './api';

export function useAtividadesAluno() {
  return useQuery({
    queryKey: ['aluno-atividades'],
    queryFn: listarAtividadesAluno,
  });
}

export function useRegistrarHistorico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarHistorico,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aluno-atividades'] });
      queryClient.invalidateQueries({ queryKey: ['historico'] });
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
    },
  });
}
