// RF-002 — lista e busca de alunos da instituição.
import { useMemo, useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Field } from '@/shared/components/ui/Field';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { AlunoFormModal } from '../components/AlunoFormModal';
import { AlunosTable } from '../components/AlunosTable';
import { useAlunos } from '../hooks';

export function AlunosPage() {
  const alunos = useAlunos();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos.data ?? [];
    return (alunos.data ?? []).filter((aluno) =>
      `${aluno.nome} ${aluno.responsavelNome} ${aluno.email}`.toLowerCase().includes(termo),
    );
  }, [alunos.data, busca]);

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Alunos"
        titulo="Alunos e planos de atendimento"
        descricao="Cada aluno pertence a um responsável e pode ter um ou mais planos. O acesso é restrito à sua instituição (RN-002)."
        acoes={
          <Button onClick={() => setModalAberto(true)}>
            <UserPlus aria-hidden="true" className="size-4" />
            Novo aluno
          </Button>
        }
      />

      <div className="max-w-md">
        <Field label="Buscar aluno" htmlFor="busca-aluno">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              id="busca-aluno"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Nome, responsável ou e-mail"
              className="pl-9"
            />
          </div>
        </Field>
      </div>

      {alunos.isLoading ? <LoadingState /> : null}

      {alunos.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(alunos.error)}
          onTentarNovamente={() => void alunos.refetch()}
        />
      ) : null}

      {alunos.isSuccess && filtrados.length === 0 ? (
        <EmptyState
          titulo={busca ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          descricao={
            busca
              ? 'Tente outro nome, responsável ou e-mail.'
              : 'Cadastre o primeiro aluno da instituição para iniciar o acompanhamento.'
          }
          icone={<Users aria-hidden="true" className="size-6" />}
          acao={
            busca ? undefined : (
              <Button onClick={() => setModalAberto(true)}>Cadastrar aluno</Button>
            )
          }
        />
      ) : null}

      {filtrados.length > 0 ? (
        <>
          <p aria-live="polite" className="text-sm text-muted">
            {filtrados.length} aluno{filtrados.length === 1 ? '' : 's'} encontrado
            {filtrados.length === 1 ? '' : 's'}.
          </p>
          <AlunosTable alunos={filtrados} />
        </>
      ) : null}

      <AlunoFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  );
}
