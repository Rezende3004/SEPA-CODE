import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardTitle } from '@/shared/components/ui/Card';

interface PainelPlaceholderProps {
  titulo: string;
  descricao: string;
}

/** Página temporária de uma etapa; substituída pela feature correspondente. */
export function PainelPlaceholder({ titulo, descricao }: PainelPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader titulo={titulo} descricao={descricao} />
      <Card>
        <CardContent className="pt-5">
          <CardTitle>Em implementação nesta etapa</CardTitle>
          <CardDescription className="mt-2">
            A base de autenticação, rotas protegidas e layout já está funcionando.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
