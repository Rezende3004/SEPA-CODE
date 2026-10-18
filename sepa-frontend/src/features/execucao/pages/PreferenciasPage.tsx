import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { rotas } from '@/app/router/paths';
import { PreferenciasSensoriais } from '../components/PreferenciasSensoriais';

export function PreferenciasPage() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="space-y-5">
      <Link
        to={rotas.aluno.raiz}
        className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-kid-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        Voltar para minhas atividades
      </Link>

      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-kid-muted">Preferências</h1>
        <p className="text-base text-kid-muted">
          Ajuste o som, as animações e o tamanho do texto. Você pode mudar quando quiser.
        </p>
      </header>

      <PreferenciasSensoriais alunoId={usuario.id} />
    </div>
  );
}
