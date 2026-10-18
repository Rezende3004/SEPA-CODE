import { authHandlers } from './auth';
import { alunosHandlers } from './alunos';
import { atividadesHandlers } from './atividades';
import { instituicoesHandlers } from './instituicoes';
import { planosHandlers } from './planos';

export const handlers = [
  ...authHandlers,
  ...instituicoesHandlers,
  ...alunosHandlers,
  ...atividadesHandlers,
  ...planosHandlers,
];
