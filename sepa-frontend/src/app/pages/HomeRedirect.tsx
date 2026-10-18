import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { useAuth } from '@/features/auth/use-auth';
import { destinoPorPerfil, rotas } from '../router/paths';

export function HomeRedirect() {
  const { usuario, status } = useAuth();

  if (status === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <LoadingState mensagem="Carregando o SEPA…" className="max-w-md" />
      </div>
    );
  }

  if (!usuario) return <Navigate to={rotas.login} replace />;

  return <Navigate to={destinoPorPerfil(usuario.tipoUsuario)} replace />;
}
