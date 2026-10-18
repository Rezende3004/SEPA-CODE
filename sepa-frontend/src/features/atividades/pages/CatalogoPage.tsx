import { useMemo, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import type { TipoAtividade } from '@/shared/types';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { AtividadeCard } from '../components/AtividadeCard';
import { FiltrosCatalogo } from '../components/FiltrosCatalogo';
import { useAtividades } from '../hooks';

export function CatalogoPage() {
  const atividades = useAtividades();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoAtividade | ''>('');
  const [nivel, setNivel] = useState(0);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (atividades.data ?? []).filter((atividade) => {
      if (termo && !`${atividade.titulo} ${atividade.descricao}`.toLowerCase().includes(termo)) {
        return false;
      }
      if (tipo && atividade.tipoAtividade !== tipo) return false;
      if (nivel > 0 && atividade.nivelDificuldade !== nivel) return false;
      return true;
    });
  }, [atividades.data, busca, tipo, nivel]);

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Catálogo"
        titulo="Atividades da instituição"
        descricao="Atividades reutilizáveis nos planos de atendimento. Todas são filtradas pela instituição do seu perfil (RN-003)."
      />

      <FiltrosCatalogo
        busca={busca}
        aoBuscar={setBusca}
        tipo={tipo}
        aoMudarTipo={setTipo}
        nivel={nivel}
        aoMudarNivel={setNivel}
      />

      {atividades.isLoading ? <LoadingState variante="cards" /> : null}

      {atividades.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(atividades.error)}
          onTentarNovamente={() => void atividades.refetch()}
        />
      ) : null}

      {atividades.isSuccess && filtradas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma atividade encontrada"
          descricao="Ajuste a busca ou os filtros para ver outras atividades do catálogo."
          icone={<BookOpenCheck aria-hidden="true" className="size-6" />}
        />
      ) : null}

      {filtradas.length > 0 ? (
        <>
          <p aria-live="polite" className="text-sm text-muted">
            {filtradas.length} atividade{filtradas.length === 1 ? '' : 's'} encontrada
            {filtradas.length === 1 ? '' : 's'}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtradas.map((atividade) => (
              <AtividadeCard key={atividade.id} atividade={atividade} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
