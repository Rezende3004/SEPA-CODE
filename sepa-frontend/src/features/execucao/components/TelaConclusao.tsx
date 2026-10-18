import { Link } from 'react-router-dom';
import { RotateCcw, Star, Trophy } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { rotas } from '@/app/router/paths';
import type { ResultadoExecucao } from '../types';

interface TelaConclusaoProps {
  resultado: ResultadoExecucao;
  salvando: boolean;
  erro: string | null;
  onTentarRegistrar: () => void;
  onJogarNovamente: () => void;
}

export function TelaConclusao({
  resultado,
  salvando,
  erro,
  onTentarRegistrar,
  onJogarNovamente,
}: TelaConclusaoProps) {
  const estrelas = resultado.resultado >= 90 ? 3 : resultado.resultado >= 70 ? 2 : 1;

  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-kid-primary/20 bg-white p-6 text-center shadow-card sm:p-8">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-kid-soft text-kid-primary">
        <Trophy aria-hidden="true" className="size-10" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-kid-muted sm:text-3xl">
          Muito bem! Atividade concluída.
        </h1>
        <p className="mt-2 text-base text-kid-muted">
          Você terminou com <strong className="text-kid-primary">{resultado.resultado}%</strong> de
          acerto. Cada tentativa mostra o seu esforço.
        </p>
      </div>

      <div
        className="flex items-center justify-center gap-2"
        role="img"
        aria-label={`${estrelas} de 3 estrelas`}
      >
        {Array.from({ length: 3 }, (_, indice) => (
          <Star
            key={indice}
            aria-hidden="true"
            className={
              indice < estrelas ? 'size-9 fill-secondary text-secondary' : 'size-9 text-line'
            }
          />
        ))}
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-kid-soft/60 p-3">
          <dt className="text-xs text-kid-muted">Resultado</dt>
          <dd className="text-lg font-bold text-kid-muted">{resultado.resultado}%</dd>
        </div>
        <div className="rounded-lg bg-kid-soft/60 p-3">
          <dt className="text-xs text-kid-muted">Tentativas</dt>
          <dd className="text-lg font-bold text-kid-muted">{resultado.tentativas}</dd>
        </div>
        <div className="rounded-lg bg-kid-soft/60 p-3">
          <dt className="text-xs text-kid-muted">Pediu ajuda</dt>
          <dd className="text-lg font-bold text-kid-muted">
            {resultado.pediuAjuda ? 'Sim' : 'Não'}
          </dd>
        </div>
      </dl>

      <p aria-live="polite" className="text-sm text-kid-muted">
        {salvando ? 'Registrando seu progresso…' : null}
        {!salvando && !erro ? 'Seu progresso foi registrado para o profissional acompanhar.' : null}
      </p>

      {erro ? (
        <Alert tom="perigo" titulo="Não foi possível registrar o progresso">
          {erro}
          <div className="mt-3">
            <Button variante="secundario" onClick={onTentarRegistrar}>
              Tentar registrar novamente
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to={rotas.aluno.raiz}
          className="sepa-kid-focus inline-flex min-h-14 items-center justify-center rounded-lg bg-kid-primary px-6 text-base font-semibold text-white hover:bg-kid-primary/90"
        >
          Voltar para minhas atividades
        </Link>
        <Button variante="secundario" tamanho="grande" onClick={onJogarNovamente}>
          <RotateCcw aria-hidden="true" className="size-5" />
          Jogar de novo
        </Button>
      </div>
    </div>
  );
}
