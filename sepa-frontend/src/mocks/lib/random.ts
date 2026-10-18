/** PRNG determinístico para o seed (mulberry32). */
export function criarRandom(seed: number): () => number {
  let estado = seed;
  return () => {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function inteiroEntre(random: () => number, minimo: number, maximo: number): number {
  return Math.floor(random() * (maximo - minimo + 1)) + minimo;
}

export function escolher<T>(random: () => number, itens: readonly T[]): T {
  return itens[Math.floor(random() * itens.length)];
}

export function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}
