// RF-001 — cadastro especializado por perfil.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { destinoPorPerfil } from '@/app/router/paths';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to={destinoPorPerfil(usuario.tipoUsuario)} replace />;

  return (
    <div className="sepa-container max-w-3xl py-8 sm:py-12">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Cadastro</p>
        <h1 className="mt-2 text-balance text-3xl font-bold text-ink">
          Junte-se à sua instituição
        </h1>
        <p className="mt-2 text-sm text-muted">
          Responsáveis e profissionais criam a própria conta. Depois do cadastro, o acesso é
          direcionado automaticamente para o painel do perfil escolhido.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
