import { describe, expect, it } from 'vitest';
import { SENHA_DEMONSTRACAO } from '@/mocks/seed';

const URL_BASE = 'http://localhost/api';

async function login(email: string, senha: string) {
  return fetch(`${URL_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
}

describe('autenticação simulada', () => {
  it('autentica um profissional do seed e devolve usuário com instituição', async () => {
    const resposta = await login('ana.psicologa@sepa.exemplo', SENHA_DEMONSTRACAO);
    expect(resposta.status).toBe(200);

    const corpo = (await resposta.json()) as {
      access: string;
      refresh: string;
      usuario: { tipoUsuario: string; instituicaoNome: string; especialidade?: string };
    };
    expect(corpo.access.split('.')).toHaveLength(3);
    expect(corpo.refresh.split('.')).toHaveLength(3);
    expect(corpo.usuario.tipoUsuario).toBe('PROFISSIONAL');
    expect(corpo.usuario.especialidade).toBe('PSICOLOGO');
    expect(corpo.usuario.instituicaoNome).toBe('Instituto Horizonte Azul');
  });

  it('rejeita senha inválida com 401', async () => {
    const resposta = await login('ana.psicologa@sepa.exemplo', 'senha-errada');
    expect(resposta.status).toBe(401);
    await expect(resposta.json()).resolves.toMatchObject({
      detail: 'E-mail ou senha inválidos.',
    });
  });

  it('exige token para consultar /me/', async () => {
    const resposta = await fetch(`${URL_BASE}/me/`);
    expect(resposta.status).toBe(401);
  });
});
