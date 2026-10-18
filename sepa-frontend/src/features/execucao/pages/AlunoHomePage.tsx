import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { CartaoAtividade } from '../components/CartaoAtividade';
import { useAtividadesAluno } from '../hooks';

export function AlunoHomePage() {
  const { usuario } = useAuth();
  const atividades = useAtividadesAluno();
  const lista = atividades.data ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-kid-primary">Olá, {usuario?.nome.split(' ')[0]}!</p>
        <h1 className="text-balance text-3xl font-bold text-kid-muted sm:text-4xl">
          O que vamos praticar hoje?
        </h1>
        <p className="max-w-2xl text-base text-kid-muted">
          Escolha uma atividade. Você pode pedir ajuda quando quiser — não tem tempo para acabar.
        </p>
      </header>

      {atividades.isLoading ? <LoadingState variante="cards" /> : null}

      {atividades.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(atividades.error)}
          onTentarNovamente={() => void atividades.refetch()}
        />
      ) : null}

      {atividades.isSuccess && lista.length === 0 ? (
        <EmptyState
          titulo="Nenhuma atividade por enquanto"
          descricao="Seu profissional ainda não atribuiu atividades. Assim que elas chegarem, aparecerão aqui."
          icone={<ClipboardList aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {lista.length > 0 ? (
        <>
          <p aria-live="polite" className="text-sm font-medium text-kid-muted">
            {lista.length} atividade{lista.length === 1 ? '' : 's'} para você.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((atividade) => (
              <CartaoAtividade key={atividade.id} atividade={atividade} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
