import { useEffect, useMemo, useRef, useState } from 'react';
import type { Atividade } from '@/shared/types';
import { NivelDificuldade } from '@/shared/components/NivelDificuldade';
import { cn } from '@/shared/lib/cn';
import { embaralhar } from '@/shared/lib/shuffle';
import { useSom } from '../hooks/use-som';
import { agoraMs, calcularTempoSegundos, type ResultadoExecucao } from '../types';
import { BotaoAjuda } from './BotaoAjuda';
import { FeedbackResposta } from './FeedbackResposta';
import { ProgressoAtividade } from './ProgressoAtividade';

interface MotorProps {
  atividade: Atividade;
  alunoId: number;
  aoConcluir: (resultado: ResultadoExecucao) => void;
}

export function AtividadeAssociacao({ atividade, alunoId, aoConcluir }: MotorProps) {
  const som = useSom(alunoId);
  const [indice, setIndice] = useState(0);
  const [erros, setErros] = useState(0);
  const [pediuAjuda, setPediuAjuda] = useState(false);
  const [ajudaVisivel, setAjudaVisivel] = useState(false);
  const [feedback, setFeedback] = useState<'correto' | 'incorreto' | null>(null);
  const [opcaoErrada, setOpcaoErrada] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const inicio = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const rodadas = useMemo(
    () =>
      atividade.itens.map((item, posicao) => ({
        item,
        opcoes: embaralhar(atividade.itens, atividade.id * 100 + posicao * 7),
      })),
    [atividade],
  );

  const rodada = rodadas[indice];
  if (!rodada) return null;
  const total = rodadas.length;

  function concluir(errosTotais: number) {
    const resultado = Math.max(40, Math.round((total / (total + errosTotais)) * 100));
    som.conclusao();
    aoConcluir({
      resultado,
      tentativas: total + errosTotais,
      tempoRespostaSeg: calcularTempoSegundos(inicio.current || agoraMs()),
      pediuAjuda,
    });
  }

  function responder(rotulo: string) {
    if (bloqueado) return;
    const acertou = rotulo === rodada.item.rotulo;

    if (!acertou) {
      setErros((valor) => valor + 1);
      setFeedback('incorreto');
      setOpcaoErrada(rotulo);
      som.erro();
      return;
    }

    setFeedback('correto');
    setOpcaoErrada(null);
    setBloqueado(true);
    som.acerto();
    timer.current = window.setTimeout(() => {
      if (indice + 1 >= total) {
        concluir(erros);
        return;
      }
      setIndice((valor) => valor + 1);
      setFeedback(null);
      setBloqueado(false);
    }, 700);
  }

  return (
    <div className="space-y-5">
      <ProgressoAtividade atual={indice + 1} total={total} rotulo="Figura" />

      <section
        aria-labelledby="instrucao-associacao"
        className="rounded-2xl border border-kid-primary/20 bg-white p-5 shadow-card sm:p-7"
      >
        <h2 id="instrucao-associacao" className="text-center text-lg font-semibold text-kid-muted">
          Qual palavra combina com a figura?
        </h2>

        <div className="mt-4 flex flex-col items-center">
          <span
            aria-hidden="true"
            className="flex size-32 items-center justify-center rounded-2xl bg-kid-soft text-7xl sm:size-40 sm:text-8xl"
          >
            {rodada.item.valor}
          </span>
          <span className="sr-only">{rodada.item.dica}</span>
          <div className="mt-2">
            <NivelDificuldade
              nivel={atividade.nivelAtribuido ?? atividade.nivelDificuldade}
              tom="crianca"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rodada.opcoes.map((opcao) => {
            const errada = opcaoErrada === opcao.rotulo;
            const correta = feedback === 'correto' && opcao.rotulo === rodada.item.rotulo;
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => responder(opcao.rotulo)}
                disabled={bloqueado}
                className={cn(
                  'sepa-kid-focus flex min-h-16 items-center justify-center rounded-xl border-2 px-4 py-3 text-lg font-semibold transition-colors',
                  correta
                    ? 'border-success bg-success-soft text-success'
                    : errada
                      ? 'border-danger bg-danger-soft text-danger'
                      : 'border-kid-primary/25 bg-white text-kid-muted hover:border-kid-primary hover:bg-kid-soft',
                  'disabled:cursor-default',
                )}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>

        <FeedbackResposta estado={feedback} />
      </section>

      <BotaoAjuda
        dica={rodada.item.dica}
        visivel={ajudaVisivel}
        aoPedirAjuda={() => {
          setPediuAjuda(true);
          setAjudaVisivel(true);
        }}
      />
    </div>
  );
}
