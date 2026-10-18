import { describe, expect, it } from 'vitest';
import { classificarTendencia, ewma, media, mediaMovel, slope } from './stats';

describe('media', () => {
  it('calcula a média e trata lista vazia', () => {
    expect(media([60, 80, 100])).toBe(80);
    expect(media([])).toBe(0);
  });
});

describe('mediaMovel', () => {
  it('usa janela progressiva no início', () => {
    expect(mediaMovel([10, 20, 30, 40], 3)).toEqual([10, 15, 20, 30]);
  });

  it('respeita tamanho de janela 2', () => {
    expect(mediaMovel([10, 20, 30], 2)).toEqual([10, 15, 25]);
  });
});

describe('ewma', () => {
  it('aplica span 3 como no protótipo Python', () => {
    const resultado = ewma([10, 20, 30], 3);
    expect(resultado[0]).toBe(10);
    expect(resultado[1]).toBe(15);
    expect(resultado[2]).toBe(22.5);
  });

  it('retorna lista vazia para entrada vazia', () => {
    expect(ewma([])).toEqual([]);
  });
});

describe('slope', () => {
  it('calcula tendência crescente', () => {
    expect(slope([10, 20, 30, 40])).toBeCloseTo(10);
  });

  it('calcula tendência decrescente', () => {
    expect(slope([40, 30, 20, 10])).toBeCloseTo(-10);
  });

  it('retorna zero para série estável ou curta', () => {
    expect(slope([50, 50, 50])).toBe(0);
    expect(slope([50])).toBe(0);
  });
});

describe('classificarTendencia', () => {
  it('classifica evolução, estagnação e regressão', () => {
    expect(classificarTendencia(1.5)).toBe('EVOLUCAO');
    expect(classificarTendencia(0.2)).toBe('ESTAGNACAO');
    expect(classificarTendencia(-1.2)).toBe('REGRESSAO');
  });
});
