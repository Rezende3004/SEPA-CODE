import { describe, expect, it } from 'vitest';
import { alunoSchema } from './schemas';

const dadosValidos = {
  nome: 'Lucas Costa',
  email: 'lucas@exemplo.com',
  dataNascimento: '2017-03-12',
  observacoes: '',
  responsavelId: 6,
};

describe('validação de aluno (RN-001)', () => {
  it('aceita aluno com responsável', () => {
    expect(alunoSchema.safeParse(dadosValidos).success).toBe(true);
  });

  it('rejeita aluno sem responsável', () => {
    const resultado = alunoSchema.safeParse({ ...dadosValidos, responsavelId: 0 });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain('responsável');
    }
  });

  it('rejeita e-mail inválido e data vazia', () => {
    const resultado = alunoSchema.safeParse({
      ...dadosValidos,
      email: 'sem-arroba',
      dataNascimento: '',
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const campos = resultado.error.issues.map((issue) => issue.path[0]);
      expect(campos).toContain('email');
      expect(campos).toContain('dataNascimento');
    }
  });
});
