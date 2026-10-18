export interface ResultadoExecucao {
  resultado: number;
  tentativas: number;
  tempoRespostaSeg: number;
  pediuAjuda: boolean;
}

export function calcularTempoSegundos(inicio: number): number {
  return Math.max(1, Math.round((Date.now() - inicio) / 1000));
}

/** Isola a leitura do relógio para manter os componentes puros em render. */
export function agoraMs(): number {
  return Date.now();
}

export function feedbackConclusao(resultado: number): string {
  if (resultado >= 90) return 'Excelente! Você acertou quase tudo.';
  if (resultado >= 70) return 'Muito bem! Você está aprendendo.';
  return 'Você concluiu a atividade. Cada tentativa conta!';
}
