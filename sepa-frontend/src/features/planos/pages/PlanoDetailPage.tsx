// RF-002 / RF-003 — plano de atendimento e associação de atividades.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Alert } from '@/shared/components/ui/Alert';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { formatarData } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { AtividadesDoPlano } from '../components/AtividadesDoPlano';
import { PlanoFormModal } from '../components/PlanoFormModal';
import { SeletorAtividades } from '../components/SeletorAtividades';
import { useExcluirPlano, usePlano } from '../hooks';

export function PlanoDetailPage() {
  const { alunoId, planoId } = useParams();
  const navigate = useNavigate();
  const id = Number(planoId);
  const plano = usePlano(id);
  const excluir = useExcluirPlano();
  const [editando, setEditando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (plano.isLoading) return <LoadingState mensagem="Carregando plano…" />;
  if (plano.isError) {
    return (
      <ErrorState
        mensagem={getApiErrorMessage(plano.error)}
        onTentarNovamente={() => void plano.refetch()}
      />
    );
  }
  if (!plano.data) return null;
  const dados = plano.data;

  async function confirmarExclusao() {
    setErro(null);
    try {
      await excluir.mutateAsync(id);
      navigate(rotas.profissional.aluno(alunoId ?? dados.alunoId), { replace: true });
    } catch (erroExclusao) {
      setErro(getApiErrorMessage(erroExclusao, 'Não foi possível excluir o plano.'));
      setConfirmandoExclusao(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to={rotas.profissional.aluno(dados.alunoId)}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para {dados.alunoNome}
      </Link>

      <PageHeader
        sobretitulo="Plano de atendimento"
        titulo={dados.nomePlano}
        descricao={dados.objetivos}
        acoes={
          <>
            <Button variante="secundario" onClick={() => setEditando(true)}>
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Button>
            <Button
              variante="perigo"
              onClick={() => setConfirmandoExclusao(true)}
              aria-label="Excluir plano"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Excluir
            </Button>
          </>
        }
      />

      {erro ? <Alert tom="perigo">{erro}</Alert> : null}

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <CalendarDays aria-hidden="true" className="size-4" />
              Início
            </p>
            <p className="mt-1 font-semibold text-ink">{formatarData(dados.dataInicio)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <UserRound aria-hidden="true" className="size-4" />
              Profissional responsável
            </p>
            <p className="mt-1 font-semibold text-ink">{dados.profissionalNome}</p>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="atividades-plano" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="atividades-plano" className="text-lg font-semibold text-ink">
            Atividades do plano ({dados.atividades.length})
          </h2>
          <Button variante="secundario" tamanho="pequeno" onClick={() => setAdicionando(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Adicionar atividades
          </Button>
        </div>
        <AtividadesDoPlano plano={dados} />
      </section>

      <PlanoFormModal
        aberto={editando}
        alunoId={dados.alunoId}
        plano={dados}
        onFechar={() => setEditando(false)}
      />
      {adicionando ? (
        <SeletorAtividades aberto plano={dados} onFechar={() => setAdicionando(false)} />
      ) : null}
      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo="Excluir plano de atendimento"
        descricao={`O plano “${dados.nomePlano}” será removido. As atividades do catálogo não serão apagadas. Esta ação não pode ser desfeita.`}
        rotuloConfirmar="Excluir plano"
        carregando={excluir.isPending}
        onConfirmar={() => void confirmarExclusao()}
        onFechar={() => setConfirmandoExclusao(false)}
      />
    </div>
  );
}
