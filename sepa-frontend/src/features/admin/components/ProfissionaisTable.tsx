import type { ProfissionalAdmin } from '@/shared/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { useAlternarAtivoProfissional } from '../hooks';

const rotuloEspecialidade: Record<ProfissionalAdmin['especialidade'], string> = {
  PSICOLOGO: 'Psicólogo',
  FONOAUDIOLOGO: 'Fonoaudiólogo',
  PEDAGOGO: 'Pedagogo',
};

export function ProfissionaisTable({ profissionais }: { profissionais: ProfissionalAdmin[] }) {
  const alternar = useAlternarAtivoProfissional();

  return (
    <div className="space-y-3">
      {alternar.isError ? <Alert tom="perigo">{getApiErrorMessage(alternar.error)}</Alert> : null}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="sr-only">Contas de profissionais</caption>
          <thead className="bg-canvas/70 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Profissional
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Especialidade
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Registro
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Instituição
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {profissionais.map((profissional) => {
              const salvando = alternar.isPending && alternar.variables?.id === profissional.id;
              return (
                <tr key={profissional.id} className="border-t border-line/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{profissional.nome}</p>
                    <p className="text-xs text-muted">{profissional.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {rotuloEspecialidade[profissional.especialidade]}
                  </td>
                  <td className="px-4 py-3 text-muted">{profissional.registroProfissional}</td>
                  <td className="px-4 py-3 text-muted">{profissional.instituicaoNome}</td>
                  <td className="px-4 py-3">
                    <Badge variante={profissional.ativo ? 'sucesso' : 'perigo'}>
                      {profissional.ativo ? 'Ativo' : 'Desativado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variante={profissional.ativo ? 'fantasma' : 'secundario'}
                      tamanho="pequeno"
                      carregando={salvando}
                      aria-label={`${profissional.ativo ? 'Desativar' : 'Ativar'} conta de ${profissional.nome}`}
                      onClick={() =>
                        alternar.mutate({ id: profissional.id, ativo: !profissional.ativo })
                      }
                    >
                      {profissional.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
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
