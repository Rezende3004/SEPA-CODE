import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { destinoPorPerfil } from '@/app/router/paths';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to={destinoPorPerfil(usuario.tipoUsuario)} replace />;

  return (
    <div className="sepa-container py-8 sm:py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Bem-vindo ao SEPA
        </p>
        <h1 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
          Acompanhamento personalizado, no ritmo de cada criança
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Planos de atendimento, atividades acessíveis e relatórios que aproximam profissionais e
          famílias. Ambiente acessível, com dados fictícios de demonstração.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Conformidade com a LGPD desde o protótipo
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-xs text-muted">
        Problemas para acessar? Fale com a administração da sua instituição.
      </p>
    </div>
  );
}
