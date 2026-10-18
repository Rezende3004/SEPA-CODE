import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { FaixaCores } from '@/shared/components/FaixaCores';
import { useAuth } from '@/features/auth/use-auth';
import { navegacaoPorPerfil, rotuloPerfil } from '@/app/navigation';
import { rotas } from '@/app/router/paths';
import { cn } from '@/shared/lib/cn';
import { Brand } from './PublicLayout';

export function DashboardLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const local = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!usuario) return null;

  const itens = navegacaoPorPerfil[usuario.tipoUsuario];
  const itemAtual = itens.find(
    (item) => local.pathname === item.para || (!item.fim && local.pathname.startsWith(item.para)),
  );

  function encerrarSessao() {
    sair();
    navigate(rotas.login, { replace: true });
  }

  const navegacao = (
    <>
      <FaixaCores />
      <div className="border-b border-line px-5 py-4">
        <Brand compacto />
        <p className="mt-3 truncate text-xs font-medium text-muted">
          {usuario.instituicaoNome ?? 'Administração da plataforma'}
        </p>
      </div>
      <nav aria-label="Menu principal" className="flex-1 space-y-1 overflow-y-auto p-3">
        {itens.map((item) => {
          const Icone = item.icone;
          return (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.fim}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-secondary bg-primary-soft text-primary-dark'
                    : 'border-transparent text-muted hover:bg-canvas hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone aria-hidden="true" className="size-5 shrink-0" />
                  <span>{item.rotulo}</span>
                  {isActive ? <span className="sr-only"> (página atual)</span> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-canvas p-3">
          <Avatar nome={usuario.nome} tamanho="pequeno" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
            <p className="truncate text-xs text-muted">
              {usuario.especialidade
                ? `${rotuloPerfil[usuario.tipoUsuario]} · ${usuario.especialidade.toLowerCase()}`
                : rotuloPerfil[usuario.tipoUsuario]}
            </p>
          </div>
        </div>
        <Button
          variante="fantasma"
          className="w-full justify-start"
          onClick={encerrarSessao}
          aria-label="Sair da conta"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-surface lg:flex">
        {navegacao}
      </aside>

      {menuAberto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuAberto(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-surface shadow-soft">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-sm font-semibold text-ink">Menu</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
                className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {navegacao}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <FaixaCores />
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              onClick={() => setMenuAberto(true)}
              className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {itemAtual?.rotulo ?? 'SEPA'}
            </p>
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-ink">{usuario.nome}</p>
                <p className="text-xs text-muted">{rotuloPerfil[usuario.tipoUsuario]}</p>
              </div>
              <Avatar nome={usuario.nome} tamanho="pequeno" />
              <Button
                variante="fantasma"
                tamanho="pequeno"
                onClick={encerrarSessao}
                aria-label="Sair da conta"
                className="text-muted"
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>
        <main id="conteudo" className="sepa-container py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
