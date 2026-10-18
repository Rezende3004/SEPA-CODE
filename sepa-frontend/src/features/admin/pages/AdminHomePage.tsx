// RF-010 — visão geral do administrador.
import { Link } from 'react-router-dom';
import { Building2, Power, Users } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { rotas } from '@/app/router/paths';
import { useInstituicoesAdmin, useProfissionaisAdmin } from '../hooks';

export function AdminHomePage() {
  const instituicoes = useInstituicoesAdmin();
  const profissionais = useProfissionaisAdmin();

  const listaInstituicoes = instituicoes.data ?? [];
  const listaProfissionais = profissionais.data ?? [];
  const ativas = listaInstituicoes.filter((item) => item.statusAssinatura === 'ATIVA').length;
  const suspensas = listaInstituicoes.filter((item) => item.statusAssinatura === 'SUSPENSA').length;
  const profissionaisAtivos = listaProfissionais.filter((item) => item.ativo).length;

  const carregando = instituicoes.isLoading || profissionais.isLoading;
  const erro = instituicoes.isError || profissionais.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Administração"
        titulo="Visão geral da plataforma"
        descricao="Gerencie instituições, assinaturas e contas de profissionais das instituições parceiras."
      />

      {carregando ? <LoadingState variante="cards" /> : null}
      {erro ? (
        <ErrorState
          mensagem={getApiErrorMessage(instituicoes.error ?? profissionais.error)}
          onTentarNovamente={() => {
            void instituicoes.refetch();
            void profissionais.refetch();
          }}
        />
      ) : null}

      {!carregando && !erro ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { rotulo: 'Instituições', valor: listaInstituicoes.length, icone: Building2 },
              { rotulo: 'Assinaturas ativas', valor: ativas, icone: Power },
              { rotulo: 'Assinaturas suspensas', valor: suspensas, icone: Building2 },
              { rotulo: 'Profissionais ativos', valor: profissionaisAtivos, icone: Users },
            ].map(({ rotulo, valor, icone: Icone }) => (
              <Card key={rotulo}>
                <CardContent className="flex items-center gap-3 pt-5">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icone aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-muted">{rotulo}</p>
                    <p className="text-xl font-bold text-ink">{valor}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to={rotas.admin.instituicoes}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 shadow-card hover:border-primary/40"
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Building2 aria-hidden="true" className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink">Instituições</span>
                <span className="block text-sm text-muted">
                  Alterar status da assinatura de cada instituição.
                </span>
              </span>
            </Link>
            <Link
              to={rotas.admin.profissionais}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 shadow-card hover:border-primary/40"
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Users aria-hidden="true" className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink">Profissionais</span>
                <span className="block text-sm text-muted">
                  Criar contas, ativar e desativar profissionais.
                </span>
              </span>
            </Link>
          </div>

          <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
            Dados fictícios de demonstração. Nenhuma informação real de criança ou responsável é
            utilizada nesta versão.
          </p>
        </>
      ) : null}
    </div>
  );
}
