import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FaixaCores } from '@/shared/components/FaixaCores';

export function Brand({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-offset-4"
      aria-label="SEPA — página inicial"
    >
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-white ring-2 ring-accent ring-offset-2"
      >
        S
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-wide text-ink">SEPA</span>
        {!compacto ? (
          <span className="block text-xs text-muted">Sistema Educacional Personalizado</span>
        ) : null}
      </span>
    </Link>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-line bg-surface">
        <FaixaCores />
        <div className="sepa-container flex min-h-18 items-center justify-between py-3">
          <Brand />
          <nav aria-label="Acesso" className="flex items-center gap-2 text-sm font-semibold">
            <Link to="/login" className="rounded-lg px-3 py-2 text-primary hover:bg-primary-soft">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="rounded-lg bg-secondary-dark px-3 py-2 text-white hover:bg-primary-dark"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line bg-surface py-5">
        <div className="sepa-container flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p>Projeto Integrador — Fase 02 · Dados fictícios para demonstração.</p>
          <p>Interface acessível (WCAG 2.1 AA) · Sem informações reais de crianças.</p>
        </div>
      </footer>
    </div>
  );
}
