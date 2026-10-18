// RF-010 — criação e ativação de contas de profissionais.
import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { ProfissionaisTable } from '../components/ProfissionaisTable';
import { ProfissionalFormModal } from '../components/ProfissionalFormModal';
import { useProfissionaisAdmin } from '../hooks';

export function ProfissionaisPage() {
  const profissionais = useProfissionaisAdmin();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Profissionais"
        titulo="Contas de profissionais"
        descricao="Crie contas para psicólogos, fonoaudiólogos e pedagogos. Contas desativadas não conseguem entrar."
        acoes={
          <Button onClick={() => setModalAberto(true)}>
            <UserPlus aria-hidden="true" className="size-4" />
            Nova conta
          </Button>
        }
      />

      {profissionais.isLoading ? <LoadingState /> : null}
      {profissionais.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(profissionais.error)}
          onTentarNovamente={() => void profissionais.refetch()}
        />
      ) : null}

      {profissionais.isSuccess && (profissionais.data ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhum profissional cadastrado"
          descricao="Crie a primeira conta de profissional para uma instituição parceira."
          icone={<Users aria-hidden="true" className="size-6" />}
          acao={<Button onClick={() => setModalAberto(true)}>Criar conta</Button>}
        />
      ) : null}

      {profissionais.data && profissionais.data.length > 0 ? (
        <ProfissionaisTable profissionais={profissionais.data} />
      ) : null}

      <ProfissionalFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  );
}
