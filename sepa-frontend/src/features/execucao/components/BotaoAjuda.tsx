import { LifeBuoy } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';

interface BotaoAjudaProps {
  dica: string;
  visivel: boolean;
  aoPedirAjuda: () => void;
}

export function BotaoAjuda({ dica, visivel, aoPedirAjuda }: BotaoAjudaProps) {
  return (
    <div className="space-y-3">
      <Button
        variante="secundario"
        tamanho="grande"
        className="w-full"
        onClick={aoPedirAjuda}
        aria-expanded={visivel}
        aria-controls="dica-atividade"
      >
        <LifeBuoy aria-hidden="true" className="size-5" />
        Preciso de ajuda
      </Button>
      {visivel ? (
        <div id="dica-atividade">
          <Alert tom="info" titulo="Uma dica para você">
            {dica}
          </Alert>
        </div>
      ) : (
        <p className="text-center text-xs text-muted">
          Pedir ajuda não tira pontos. Use quando precisar.
        </p>
      )}
    </div>
  );
}
