import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  associarAtividade,
  atualizarPlano,
  criarPlano,
  excluirPlano,
  listarPlanos,
  obterPlano,
  removerAtividade,
} from './api';
import type { DadosPlano } from './schemas';

function useInvalidarPlanos() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['planos'] });
    queryClient.invalidateQueries({ queryKey: ['alunos'] });
    queryClient.invalidateQueries({ queryKey: ['aluno-atividades'] });
  };
}

export function usePlanos(alunoId?: number) {
  return useQuery({
    queryKey: ['planos', 'lista', alunoId ?? 'todos'],
    queryFn: () => listarPlanos(alunoId),
  });
}

export function usePlano(planoId: number) {
  return useQuery({
    queryKey: ['planos', 'detalhe', planoId],
    queryFn: () => obterPlano(planoId),
    enabled: Number.isFinite(planoId) && planoId > 0,
  });
}

export function useCriarPlano(alunoId: number) {
  const invalidar = useInvalidarPlanos();
  return useMutation({
    mutationFn: (dados: DadosPlano) => criarPlano(alunoId, dados),
    onSuccess: invalidar,
  });
}

export function useAtualizarPlano(planoId: number) {
  const invalidar = useInvalidarPlanos();
  return useMutation({
    mutationFn: (dados: DadosPlano) => atualizarPlano(planoId, dados),
    onSuccess: invalidar,
  });
}

export function useExcluirPlano() {
  const invalidar = useInvalidarPlanos();
  return useMutation({
    mutationFn: (planoId: number) => excluirPlano(planoId),
    onSuccess: invalidar,
  });
}

export function useAssociarAtividade(planoId: number) {
  const invalidar = useInvalidarPlanos();
  return useMutation({
    mutationFn: (atividadeId: number) => associarAtividade(planoId, atividadeId),
    onSuccess: invalidar,
  });
}

export function useRemoverAtividade(planoId: number) {
  const invalidar = useInvalidarPlanos();
  return useMutation({
    mutationFn: (atividadeId: number) => removerAtividade(planoId, atividadeId),
    onSuccess: invalidar,
  });
}
