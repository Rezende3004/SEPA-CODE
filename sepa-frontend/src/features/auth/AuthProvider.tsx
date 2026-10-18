// RF-001 — autenticação, restauração de sessão e logout.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SESSION_EXPIRED_EVENT } from '@/shared/lib/api-client';
import { queryClient } from '@/shared/lib/query-client';
import { tokenStore } from '@/shared/lib/token-store';
import type { SessaoUsuario } from '@/shared/types';
import { cadastrar as cadastrarApi, entrar as entrarApi, recuperarSessao } from './api';
import { ContextoAuth, type StatusSessao, type ValorContextoAuth } from './auth-context';
import type { DadosCadastro, DadosLogin } from './schemas';

interface AuthProviderProps {
  children: ReactNode;
  /** Usado pelos testes para começar com uma sessão determinística. */
  usuarioInicial?: SessaoUsuario | null;
  restaurarSessao?: boolean;
}

export function AuthProvider({
  children,
  usuarioInicial = null,
  restaurarSessao = true,
}: AuthProviderProps) {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(usuarioInicial);
  const [status, setStatus] = useState<StatusSessao>(
    usuarioInicial ? 'autenticado' : restaurarSessao ? 'carregando' : 'anonimo',
  );

  const definirUsuario = useCallback((novo: SessaoUsuario | null) => {
    setUsuario(novo);
    setStatus(novo ? 'autenticado' : 'anonimo');
  }, []);

  const sair = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    definirUsuario(null);
  }, [definirUsuario]);

  useEffect(() => {
    if (usuarioInicial || !restaurarSessao) return;
    let cancelado = false;
    void recuperarSessao().then((recuperado) => {
      if (cancelado) return;
      definirUsuario(recuperado);
    });
    return () => {
      cancelado = true;
    };
  }, [definirUsuario, restaurarSessao, usuarioInicial]);

  useEffect(() => {
    function aoExpirarSessao() {
      queryClient.clear();
      definirUsuario(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, aoExpirarSessao);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, aoExpirarSessao);
  }, [definirUsuario]);

  const entrar = useCallback(
    async (dados: DadosLogin) => {
      const sessao = await entrarApi(dados);
      definirUsuario(sessao);
      return sessao;
    },
    [definirUsuario],
  );

  const cadastrar = useCallback(
    async (dados: DadosCadastro) => {
      const sessao = await cadastrarApi(dados);
      definirUsuario(sessao);
      return sessao;
    },
    [definirUsuario],
  );

  const valor = useMemo<ValorContextoAuth>(
    () => ({ usuario, status, entrar, cadastrar, sair, definirUsuario }),
    [usuario, status, entrar, cadastrar, sair, definirUsuario],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}
