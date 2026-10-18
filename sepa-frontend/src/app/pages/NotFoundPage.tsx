import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { destinoPorPerfil, rotas } from '@/app/router/paths';

export function NotFoundPage() {
  const { usuario } = useAuth();
  const destino = usuario ? destinoPorPerfil(usuario.tipoUsuario) : rotas.login;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Compass aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
          Erro 404
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted">
          O endereço acessado não existe ou foi movido. Use o botão abaixo para voltar.
        </p>
        <Link
          to={destino}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-dark"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
