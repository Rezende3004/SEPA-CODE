import { useEffect, useMemo, useRef, useState } from 'react';
import type { Atividade } from '@/shared/types';
import { Check } from 'lucide-react';
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

export function AtividadeSequencia({ atividade, alunoId, aoConcluir }: MotorProps) {
  const som = useSom(alunoId);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [erros, setErros] = useState(0);
  const [pediuAjuda, setPediuAjuda] = useState(false);
  const [ajudaVisivel, setAjudaVisivel] = useState(false);
  const [feedback, setFeedback] = useState<'correto' | 'incorreto' | null>(null);
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

  const opcoes = useMemo(
    () => embaralhar(atividade.itens, atividade.id * 53 + 11),
    [atividade.itens, atividade.id],
  );

  const total = atividade.itens.length;
  const proximo = atividade.itens[selecionados.length];

  function concluir(errosTotais: number) {
    const resultado = Math.max(40, 100 - errosTotais * 15);
    som.conclusao();
    aoConcluir({
      resultado,
      tentativas: total + errosTotais,
      tempoRespostaSeg: calcularTempoSegundos(inicio.current || agoraMs()),
      pediuAjuda,
    });
  }

  function escolher(itemId: number) {
    if (bloqueado || !proximo) return;
    if (selecionados.includes(itemId)) return;

    if (itemId !== proximo.id) {
      setErros((valor) => valor + 1);
      setFeedback('incorreto');
      som.erro();
      return;
    }

    const novos = [...selecionados, itemId];
    setSelecionados(novos);
    setFeedback('correto');
    som.acerto();

    if (novos.length === total) {
      setBloqueado(true);
      timer.current = window.setTimeout(() => concluir(erros), 700);
    }
  }

  return (
    <div className="space-y-5">
      <ProgressoAtividade atual={selecionados.length} total={total} rotulo="Passo" />

      <section
        aria-labelledby="instrucao-sequencia"
        className="rounded-2xl border border-kid-primary/20 bg-white p-5 shadow-card sm:p-7"
      >
        <h2 id="instrucao-sequencia" className="text-center text-lg font-semibold text-kid-muted">
          Toque nos passos na ordem certa
        </h2>

        <div className="mt-3 flex justify-center">
          <NivelDificuldade nivel={atividade.nivelDificuldade} tom="crianca" />
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-kid-primary/30 bg-kid-soft/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-kid-muted">
            Sua ordem
          </p>
          {selecionados.length === 0 ? (
            <p className="text-sm text-kid-muted">Ainda não escolheu nenhum passo.</p>
          ) : (
            <ol className="space-y-2">
              {selecionados.map((itemId, posicao) => {
                const item = atividade.itens.find((candidato) => candidato.id === itemId);
                if (!item) return null;
                return (
                  <li
                    key={itemId}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-kid-muted"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-kid-primary text-xs text-white">
                      {posicao + 1}
                    </span>
                    <span aria-hidden="true">{item.valor}</span>
                    {item.rotulo}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {opcoes.map((opcao) => {
            const escolhido = selecionados.includes(opcao.id);
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => escolher(opcao.id)}
                disabled={escolhido || bloqueado}
                aria-pressed={escolhido}
                className={cn(
                  'sepa-kid-focus flex min-h-16 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-lg font-semibold transition-colors',
                  escolhido
                    ? 'border-success/40 bg-success-soft text-success'
                    : 'border-kid-primary/25 bg-white text-kid-muted hover:border-kid-primary hover:bg-kid-soft',
                  'disabled:cursor-default',
                )}
              >
                <span aria-hidden="true" className="text-2xl">
                  {opcao.valor}
                </span>
                <span className="flex-1">{opcao.rotulo}</span>
                {escolhido ? <Check aria-hidden="true" className="size-5" /> : null}
              </button>
            );
          })}
        </div>

        <FeedbackResposta estado={feedback} />
      </section>

      <BotaoAjuda
        dica={proximo?.dica ?? 'Você já escolheu todos os passos.'}
        visivel={ajudaVisivel}
        aoPedirAjuda={() => {
          setPediuAjuda(true);
          setAjudaVisivel(true);
        }}
      />
    </div>
  );
}
