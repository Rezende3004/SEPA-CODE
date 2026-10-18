import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: 'medio' | 'largo';
}

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = 'medio',
}: ModalProps) {
  const tituloId = useId();
  const descricaoId = useId();
  const painelRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    if (!aberto) return;
    const elementoAnterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focarPrimeiro = window.setTimeout(() => {
      const painel = painelRef.current;
      const primeiro = painel?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      primeiro?.focus();
    }, 20);

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        fecharRef.current();
        return;
      }
      if (evento.key !== 'Tab') return;
      const painel = painelRef.current;
      if (!painel) return;
      const focaveis = Array.from(
        painel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((elemento) => elemento.offsetParent !== null);
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener('keydown', aoPressionarTecla);
    return () => {
      window.clearTimeout(focarPrimeiro);
      document.removeEventListener('keydown', aoPressionarTecla);
      document.body.style.overflow = overflowAnterior;
      elementoAnterior?.focus();
    };
  }, [aberto]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-surface shadow-soft sm:rounded-xl',
          largura === 'largo' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 id={tituloId} className="text-xl font-semibold text-ink">
              {titulo}
            </h2>
            {descricao ? (
              <p id={descricaoId} className="mt-1 text-sm text-muted">
                {descricao}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-canvas"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {rodape ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-5">
            {rodape}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
