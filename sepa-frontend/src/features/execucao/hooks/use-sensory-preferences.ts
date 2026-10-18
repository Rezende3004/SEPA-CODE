// RNF-004 — preferências sensoriais por aluno (som, animações, fonte).
import { useSyncExternalStore } from 'react';

export type TamanhoFonte = 'normal' | 'grande' | 'muito-grande';

export interface PreferenciasSensoriais {
  som: boolean;
  volume: number;
  animacoes: boolean;
  tamanhoFonte: TamanhoFonte;
}

export const PREFERENCIAS_PADRAO: PreferenciasSensoriais = {
  som: true,
  volume: 0.4,
  animacoes: true,
  tamanhoFonte: 'normal',
};

const CHAVE_PREFIXO = 'sepa:prefs:';
const cache = new Map<number, PreferenciasSensoriais>();
const ouvintes = new Set<() => void>();

function notificar(): void {
  ouvintes.forEach((ouvinte) => ouvinte());
}

function carregar(alunoId: number): PreferenciasSensoriais {
  const emCache = cache.get(alunoId);
  if (emCache) return emCache;

  let preferencias = PREFERENCIAS_PADRAO;
  try {
    const bruto = localStorage.getItem(`${CHAVE_PREFIXO}${alunoId}`);
    if (bruto) {
      const analisado = JSON.parse(bruto) as Partial<PreferenciasSensoriais>;
      preferencias = {
        som: typeof analisado.som === 'boolean' ? analisado.som : PREFERENCIAS_PADRAO.som,
        volume:
          typeof analisado.volume === 'number'
            ? Math.min(1, Math.max(0, analisado.volume))
            : PREFERENCIAS_PADRAO.volume,
        animacoes:
          typeof analisado.animacoes === 'boolean'
            ? analisado.animacoes
            : PREFERENCIAS_PADRAO.animacoes,
        tamanhoFonte:
          analisado.tamanhoFonte === 'grande' || analisado.tamanhoFonte === 'muito-grande'
            ? analisado.tamanhoFonte
            : 'normal',
      };
    }
  } catch {
    preferencias = PREFERENCIAS_PADRAO;
  }

  cache.set(alunoId, preferencias);
  return preferencias;
}

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function atualizarPreferencias(
  alunoId: number,
  parcial: Partial<PreferenciasSensoriais>,
): PreferenciasSensoriais {
  const novas = { ...carregar(alunoId), ...parcial };
  cache.set(alunoId, novas);
  try {
    localStorage.setItem(`${CHAVE_PREFIXO}${alunoId}`, JSON.stringify(novas));
  } catch {
    // Sem persistência: mantém em memória durante a sessão.
  }
  notificar();
  return novas;
}

export function limparCachePreferencias(): void {
  cache.clear();
  notificar();
}

export function useSensoryPreferences(alunoId: number): PreferenciasSensoriais {
  return useSyncExternalStore(
    inscrever,
    () => carregar(alunoId),
    () => PREFERENCIAS_PADRAO,
  );
}
