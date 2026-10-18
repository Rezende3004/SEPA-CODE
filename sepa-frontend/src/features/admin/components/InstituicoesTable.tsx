import type { Instituicao, StatusAssinatura } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Select } from '@/shared/components/ui/Select';
import { Alert } from '@/shared/components/ui/Alert';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { useAtualizarStatusInstituicao } from '../hooks';

const rotuloStatus: Record<StatusAssinatura, string> = {
  ATIVA: 'Ativa',
  SUSPENSA: 'Suspensa',
  TESTE: 'Em teste',
};

export function InstituicoesTable({ instituicoes }: { instituicoes: Instituicao[] }) {
  const atualizar = useAtualizarStatusInstituicao();

  return (
    <div className="space-y-3">
      {atualizar.isError ? <Alert tom="perigo">{getApiErrorMessage(atualizar.error)}</Alert> : null}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <caption className="sr-only">Instituições e status de assinatura</caption>
          <thead className="bg-canvas/70 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Instituição
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                CNPJ
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Endereço
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Alterar assinatura
              </th>
            </tr>
          </thead>
          <tbody>
            {instituicoes.map((instituicao) => {
              const salvando = atualizar.isPending && atualizar.variables?.id === instituicao.id;
              return (
                <tr key={instituicao.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-semibold text-ink">{instituicao.nomeFantasia}</td>
                  <td className="px-4 py-3 text-muted">{instituicao.cnpj}</td>
                  <td className="px-4 py-3 text-muted">{instituicao.endereco}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variante={
                        instituicao.statusAssinatura === 'ATIVA'
                          ? 'sucesso'
                          : instituicao.statusAssinatura === 'TESTE'
                            ? 'atencao'
                            : 'perigo'
                      }
                    >
                      {rotuloStatus[instituicao.statusAssinatura]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      aria-label={`Status da assinatura de ${instituicao.nomeFantasia}`}
                      value={instituicao.statusAssinatura}
                      disabled={salvando}
                      onChange={(evento) =>
                        atualizar.mutate({
                          id: instituicao.id,
                          status: evento.target.value as StatusAssinatura,
                        })
                      }
                      className="max-w-40"
                    >
                      {Object.entries(rotuloStatus).map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>
                          {rotulo}
                        </option>
                      ))}
                    </Select>
                    {salvando ? (
                      <span className="mt-1 block text-xs text-muted">Salvando…</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
