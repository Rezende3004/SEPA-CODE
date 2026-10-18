import type { ReactNode } from 'react';

interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  voltar?: ReactNode;
  sobretitulo?: string;
}

export function PageHeader({ titulo, descricao, acoes, voltar, sobretitulo }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-line/70 pb-5">
      {voltar}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {sobretitulo ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {sobretitulo}
            </p>
          ) : null}
          <h1 className="text-balance text-2xl font-bold text-ink sm:text-3xl">{titulo}</h1>
          {descricao ? <p className="max-w-3xl text-sm text-muted">{descricao}</p> : null}
        </div>
        {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
      </div>
    </header>
  );
}
