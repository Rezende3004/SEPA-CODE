import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { rotas } from '@/app/router/paths';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useSensoryPreferences } from '@/features/execucao/hooks/use-sensory-preferences';
import { cn } from '@/shared/lib/cn';

export function AlunoLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const preferencias = useSensoryPreferences(usuario?.id ?? 0);
  const animacoesLigadas = preferencias.animacoes && !reduzirMovimento;

  useEffect(() => {
    document.documentElement.dataset.tamanhoFonte = preferencias.tamanhoFonte;
    return () => {
      delete document.documentElement.dataset.tamanhoFonte;
    };
  }, [preferencias.tamanhoFonte]);

  if (!usuario) return null;

  function encerrar() {
    sair();
    navigate(rotas.login, { replace: true });
  }

  const itens = [
    { rotulo: 'Minhas atividades', para: rotas.aluno.raiz, icone: Home, fim: true },
    { rotulo: 'Preferências', para: rotas.aluno.preferencias, icone: SlidersHorizontal, fim: false },
  ];

  return (
    <div
      data-animacoes={animacoesLigadas ? 'on' : 'off'}
      className="min-h-screen bg-kid-canvas text-kid-muted"
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-kid-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <header className="border-b border-kid-primary/15 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <NavLink
            to={rotas.aluno.raiz}
            className="sepa-kid-focus mr-auto inline-flex min-h-12 items-center gap-2 rounded-lg text-kid-primary"
            aria-label="SEPA — minhas atividades"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-kid-primary text-lg font-bold text-white"
            >
              S
            </span>
            <span className="text-lg font-bold">SEPA</span>
          </NavLink>

          <nav aria-label="Menu do aluno" className="flex items-center gap-1">
            {itens.map((item) => {
              const Icone = item.icone;
              return (
                <NavLink
                  key={item.para}
                  to={item.para}
                  end={item.fim}
                  className={({ isActive }) =>
                    cn(
                      'sepa-kid-focus inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-sm font-semibold',
                      isActive
                        ? 'bg-kid-soft text-kid-primary'
                        : 'text-kid-muted hover:bg-kid-soft/70',
                    )
                  }
                >
                  <Icone aria-hidden="true" className="size-5" />
                  <span className="hidden sm:inline">{item.rotulo}</span>
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={encerrar}
              className="sepa-kid-focus inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-kid-muted hover:bg-kid-soft/70"
              aria-label="Sair da conta"
            >
              <LogOut aria-hidden="true" className="size-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
