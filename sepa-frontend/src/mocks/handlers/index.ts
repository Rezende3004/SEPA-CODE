import { authHandlers } from './auth';
import { instituicoesHandlers } from './instituicoes';

export const handlers = [...authHandlers, ...instituicoesHandlers];
