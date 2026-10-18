import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { useAuth } from '@/features/auth/use-auth';
import { rotas } from '@/app/router/paths';

export function RequireAuth() {
  const { usuario, status } = useAuth();
  const local = useLocation();

  if (status === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <LoadingState mensagem="Verificando sua sessão…" className="max-w-md" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to={rotas.login} state={{ from: local }} replace />;
  }

  return <Outlet />;
}
