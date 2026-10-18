import { Info } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';

export function AvisoDecisaoHumana() {
  return (
    <Alert tom="info" titulo="A decisão é sempre do profissional (RN-004)">
      <p className="flex items-start gap-2">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />A IA apenas sugere. Nenhum
        plano ou nível de atividade muda sem que um profissional aceite a recomendação
        explicitamente.
      </p>
    </Alert>
  );
}
