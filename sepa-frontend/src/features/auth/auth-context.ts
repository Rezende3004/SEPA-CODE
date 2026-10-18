import { createContext } from 'react';
import type { SessaoUsuario } from '@/shared/types';
import type { DadosCadastro, DadosLogin } from './schemas';

export type StatusSessao = 'carregando' | 'autenticado' | 'anonimo';

export interface ValorContextoAuth {
  usuario: SessaoUsuario | null;
  status: StatusSessao;
  entrar: (dados: DadosLogin) => Promise<SessaoUsuario>;
  cadastrar: (dados: DadosCadastro) => Promise<SessaoUsuario>;
  sair: () => void;
  definirUsuario: (usuario: SessaoUsuario | null) => void;
}

export const ContextoAuth = createContext<ValorContextoAuth | null>(null);
