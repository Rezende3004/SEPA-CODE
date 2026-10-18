import { CheckCircle2, XCircle } from 'lucide-react';

interface FeedbackRespostaProps {
  estado: 'correto' | 'incorreto' | null;
}

export function FeedbackResposta({ estado }: FeedbackRespostaProps) {
  return (
    <div aria-live="polite" className="flex min-h-14 items-center justify-center">
      {estado === 'correto' ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-4 py-2 text-base font-semibold text-success">
          <CheckCircle2 aria-hidden="true" className="size-5" />
          Muito bem! Está certo.
        </p>
      ) : null}
      {estado === 'incorreto' ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-danger-soft px-4 py-2 text-base font-semibold text-danger">
          <XCircle aria-hidden="true" className="size-5" />
          Quase! Tente mais uma vez com calma.
        </p>
      ) : null}
      {estado === null ? (
        <span className="sr-only" aria-live="polite">
          Escolha uma opção.
        </span>
      ) : null}
    </div>
  );
}
