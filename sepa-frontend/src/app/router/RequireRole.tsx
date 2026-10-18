// RF-001 — guarda de rotas por perfil.
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { useAuth } from '@/features/auth/use-auth';
import { rotas } from '@/app/router/paths';
import type { TipoUsuario } from '@/shared/types';

interface RequireRoleProps {
  perfis: TipoUsuario[];
  children?: ReactNode;
}

export function RequireRole({ perfis, children }: RequireRoleProps) {
  const { usuario, status } = useAuth();
  const local = useLocation();

  if (status === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <LoadingState mensagem="Verificando seu acesso…" className="max-w-md" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to={rotas.login} state={{ from: local }} replace />;
  }

  if (!perfis.includes(usuario.tipoUsuario)) {
    return <Navigate to={rotas.proibido} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
