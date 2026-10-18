/** Embaralhamento determinístico para a mesma atividade/rodada. */
export function embaralhar<T>(itens: readonly T[], semente: number): T[] {
  const resultado = [...itens];
  let estado = semente;
  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    estado = (estado * 1103515245 + 12345) & 0x7fffffff;
    const alvo = estado % (indice + 1);
    [resultado[indice], resultado[alvo]] = [resultado[alvo], resultado[indice]];
  }
  return resultado;
}
