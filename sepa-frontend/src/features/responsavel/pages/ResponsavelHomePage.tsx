// RF-006 — visão simplificada dos filhos vinculados.
import { Users } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { FilhoCard } from '../components/FilhoCard';
import { useFilhos } from '../hooks';

export function ResponsavelHomePage() {
  const { usuario } = useAuth();
  const alunos = useFilhos();

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo={`Olá, ${usuario?.nome.split(' ')[0] ?? 'responsável'}`}
        titulo="Progresso dos meus filhos"
        descricao="Uma visão simples do que está sendo trabalhado. Para detalhes técnicos, converse com o profissional responsável."
      />

      {alunos.isLoading ? <LoadingState variante="cards" /> : null}
      {alunos.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(alunos.error)}
          onTentarNovamente={() => void alunos.refetch()}
        />
      ) : null}

      {alunos.isSuccess && (alunos.data ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhum filho vinculado"
          descricao="Se você acredita que isso é um engano, fale com a instituição para vincular o cadastro."
          icone={<Users aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {alunos.data && alunos.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alunos.data.map((aluno) => (
            <FilhoCard key={aluno.id} aluno={aluno} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
