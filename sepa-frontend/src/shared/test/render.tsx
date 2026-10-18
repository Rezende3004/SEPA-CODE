import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import type { SessaoUsuario } from '@/shared/types';

interface OpcoesRenderizacao extends Omit<RenderOptions, 'wrapper'> {
  usuario?: SessaoUsuario | null;
  rota?: string;
}

export function renderizarComProviders(
  ui: ReactElement,
  { usuario = null, rota = '/', ...opcoes }: OpcoesRenderizacao = {},
) {
  const queryClientTeste = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const resultado = render(
    <QueryClientProvider client={queryClientTeste}>
      <AuthProvider usuarioInicial={usuario} restaurarSessao={false}>
        <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
    opcoes,
  );

  return { ...resultado, queryClient: queryClientTeste };
}
