import { Building2 } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { InstituicoesTable } from '../components/InstituicoesTable';
import { useInstituicoesAdmin } from '../hooks';

export function InstituicoesPage() {
  const instituicoes = useInstituicoesAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Instituições"
        titulo="Assinaturas das instituições"
        descricao="O status da assinatura controla se a instituição pode receber novos cadastros e acessar a plataforma."
      />

      {instituicoes.isLoading ? <LoadingState /> : null}
      {instituicoes.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(instituicoes.error)}
          onTentarNovamente={() => void instituicoes.refetch()}
        />
      ) : null}

      {instituicoes.isSuccess && (instituicoes.data ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhuma instituição cadastrada"
          descricao="As instituições parceiras aparecem aqui para gerenciamento da assinatura."
          icone={<Building2 aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {instituicoes.data && instituicoes.data.length > 0 ? (
        <InstituicoesTable instituicoes={instituicoes.data} />
      ) : null}
    </div>
  );
}
