import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  titulo?: string;
  mensagem: string;
  onTentarNovamente?: () => void;
}

export function ErrorState({
  titulo = 'Algo deu errado',
  mensagem,
  onTentarNovamente,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-6"
    >
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle aria-hidden="true" className="size-5" />
        <p className="font-semibold">{titulo}</p>
      </div>
      <p className="text-sm text-ink">{mensagem}</p>
      {onTentarNovamente ? (
        <Button variante="secundario" tamanho="pequeno" onClick={onTentarNovamente}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
