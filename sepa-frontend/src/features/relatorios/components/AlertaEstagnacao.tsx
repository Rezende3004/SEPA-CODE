import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';
import { rotas } from '@/app/router/paths';

export function AlertaEstagnacao() {
  return (
    <Alert tom="atencao" titulo="Alerta de estagnação">
      <p>
        A tendência do período é de estabilidade, sem ganho consistente e com média abaixo do
        esperado. Revise o plano de atendimento e as recomendações da IA antes de aumentar o nível.
      </p>
      <Link
        to={rotas.profissional.recomendacoes}
        className="mt-2 inline-flex min-h-9 items-center gap-1.5 font-semibold underline"
      >
        <AlertTriangle aria-hidden="true" className="size-4" />
        Ver recomendações da IA
      </Link>
    </Alert>
  );
}
