import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import type { AlunoResumo } from '@/shared/types';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { calcularIdade } from '@/shared/lib/format';
import { rotas } from '@/app/router/paths';
import { mensagemSimples } from '../mensagens';

export function FilhoCard({ aluno }: { aluno: AlunoResumo }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <Heart className="size-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">{aluno.nome}</h2>
          <p className="text-xs text-muted">{calcularIdade(aluno.dataNascimento)} anos</p>
        </div>
      </div>

      <p className="text-sm text-muted">{mensagemSimples(aluno.tendencia)}</p>

      <ProgressBar
        valor={aluno.mediaRecente}
        rotulo="Progresso geral"
        tom={aluno.tendencia === 'EVOLUCAO' ? 'sucesso' : 'primario'}
      />

      <Link
        to={rotas.responsavel.filho(aluno.id)}
        className="mt-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 font-semibold text-white hover:bg-primary-dark"
      >
        Ver progresso
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}
