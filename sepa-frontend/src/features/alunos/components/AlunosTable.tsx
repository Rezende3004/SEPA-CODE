import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AlunoResumo } from '@/shared/types';
import { TendenciaBadge } from '@/shared/components/TendenciaBadge';
import { calcularIdade, formatarPercentual } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { cn } from '@/shared/lib/cn';

interface AlunosTableProps {
  alunos: AlunoResumo[];
}

export function AlunosTable({ alunos }: AlunosTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <caption className="sr-only">Alunos da instituição</caption>
        <thead className="bg-canvas/70 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Aluno
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Responsável
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Média recente
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Tendência
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Planos
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id} className="border-t border-line/70 hover:bg-canvas/40">
              <td className="px-4 py-3">
                <Link
                  to={rotas.profissional.aluno(aluno.id)}
                  className="font-semibold text-primary hover:underline"
                >
                  {aluno.nome}
                </Link>
                <p className="text-xs text-muted">{calcularIdade(aluno.dataNascimento)} anos</p>
              </td>
              <td className="px-4 py-3 text-muted">{aluno.responsavelNome}</td>
              <td className="px-4 py-3 font-medium text-ink">
                {formatarPercentual(aluno.mediaRecente)}
              </td>
              <td className="px-4 py-3">
                <TendenciaBadge tendencia={aluno.tendencia} />
              </td>
              <td className="px-4 py-3 text-muted">{aluno.totalPlanos}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={rotas.profissional.aluno(aluno.id)}
                  aria-label={`Abrir acompanhamento de ${aluno.nome}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AlunoResumoCardProps {
  aluno: AlunoResumo;
  className?: string;
}

export function AlunoResumoCard({ aluno, className }: AlunoResumoCardProps) {
  return (
    <Link
      to={rotas.profissional.aluno(aluno.id)}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink group-hover:text-primary-dark">{aluno.nome}</p>
          <p className="text-xs text-muted">
            {calcularIdade(aluno.dataNascimento)} anos · {aluno.totalPlanos} plano
            {aluno.totalPlanos === 1 ? '' : 's'}
          </p>
        </div>
        <TendenciaBadge tendencia={aluno.tendencia} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted">Média recente</p>
          <p className="text-2xl font-bold text-ink">{formatarPercentual(aluno.mediaRecente)}</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Responsável</p>
          <p className="font-medium text-ink">{aluno.responsavelNome}</p>
        </div>
      </div>
    </Link>
  );
}
