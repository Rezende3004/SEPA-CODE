import type { Tendencia } from '@/shared/types';

export function arredondar(valor: number, casas = 1): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

export function media(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

/**
 * Média móvel progressiva: os primeiros pontos usam a janela disponível,
 * evitando buracos no início do gráfico.
 */
export function mediaMovel(valores: readonly number[], janela = 3): number[] {
  return valores.map((_, indice) => {
    const inicio = Math.max(0, indice - janela + 1);
    return media(valores.slice(inicio, indice + 1));
  });
}

/** Média ponderada exponencial (EWMA), mesma ideia do protótipo Python (span=3). */
export function ewma(valores: readonly number[], span = 3): number[] {
  if (valores.length === 0) return [];
  const alpha = 2 / (span + 1);
  const resultado: number[] = [];
  let anterior = valores[0];
  for (const valor of valores) {
    anterior = alpha * valor + (1 - alpha) * anterior;
    resultado.push(anterior);
  }
  return resultado;
}

/** Coeficiente angular (slope) por regressão linear simples: x = 0..n-1. */
export function slope(valores: readonly number[]): number {
  if (valores.length < 2) return 0;
  const n = valores.length;
  const mediaX = (n - 1) / 2;
  const mediaY = media(valores);
  let numerador = 0;
  let denominador = 0;
  valores.forEach((valor, indice) => {
    numerador += (indice - mediaX) * (valor - mediaY);
    denominador += (indice - mediaX) ** 2;
  });
  if (denominador === 0) return 0;
  return numerador / denominador;
}

/** Limiares em pontos percentuais por sessão. */
export function classificarTendencia(coeficiente: number): Tendencia {
  if (coeficiente >= 1) return 'EVOLUCAO';
  if (coeficiente <= -1) return 'REGRESSAO';
  return 'ESTAGNACAO';
}
