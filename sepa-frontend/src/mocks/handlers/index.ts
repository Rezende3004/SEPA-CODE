import { authHandlers } from './auth';
import { alunosHandlers } from './alunos';
import { atividadesHandlers } from './atividades';
import { historicoHandlers } from './historico';
import { instituicoesHandlers } from './instituicoes';
import { planosHandlers } from './planos';
import { recomendacoesHandlers } from './recomendacoes';
import { relatoriosHandlers } from './relatorios';

export const handlers = [
  ...authHandlers,
  ...instituicoesHandlers,
  ...alunosHandlers,
  ...atividadesHandlers,
  ...planosHandlers,
  ...historicoHandlers,
  ...relatoriosHandlers,
  ...recomendacoesHandlers,
];
