import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { criarAccessToken } from '@/mocks/lib/token';

const URL_BASE = 'http://localhost/api';

function tokenDoUsuario(usuarioId: number): string {
  const usuario = db.usuarios.find((item) => item.id === usuarioId);
  if (!usuario) throw new Error(`Usuário ${usuarioId} não encontrado no seed.`);
  return criarAccessToken(usuario);
}

function requisicao(usuarioId: number, caminho: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL_BASE}${caminho}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDoUsuario(usuarioId)}`,
      ...(init.headers ?? {}),
    },
  });
}

const ANA = 2;
const DIEGO = 5;
const MARIANA = 6;

describe('mensagens (RF-007)', () => {
  it('lista apenas conversas em que o usuário participa', async () => {
    const resposta = await requisicao(MARIANA, '/mensagens/');
    expect(resposta.status).toBe(200);
    const mensagens = (await resposta.json()) as { remetenteId: number; destinatarioId: number }[];
    expect(mensagens.length).toBeGreaterThan(0);
    expect(
      mensagens.every(
        (mensagem) => mensagem.remetenteId === MARIANA || mensagem.destinatarioId === MARIANA,
      ),
    ).toBe(true);
  });

  it('bloqueia mensagem entre instituições diferentes', async () => {
    const resposta = await requisicao(DIEGO, '/mensagens/', {
      method: 'POST',
      body: JSON.stringify({ destinatarioId: MARIANA, conteudoTexto: 'Olá de outra instituição' }),
    });
    expect(resposta.status).toBe(403);
  });

  it('envia mensagem e marca como lida somente o destinatário', async () => {
    const envio = await requisicao(MARIANA, '/mensagens/', {
      method: 'POST',
      body: JSON.stringify({ destinatarioId: ANA, conteudoTexto: 'Bom dia, Ana!' }),
    });
    expect(envio.status).toBe(201);
    const mensagem = (await envio.json()) as { id: number; lida: boolean };
    expect(mensagem.lida).toBe(false);

    const tentativaIndevida = await requisicao(MARIANA, `/mensagens/${mensagem.id}/lida/`, {
      method: 'POST',
    });
    expect(tentativaIndevida.status).toBe(403);

    const leitura = await requisicao(ANA, `/mensagens/${mensagem.id}/lida/`, { method: 'POST' });
    expect(leitura.status).toBe(200);
    expect(((await leitura.json()) as { lida: boolean }).lida).toBe(true);
  });

  it('rejeita mensagem vazia com erro de validação', async () => {
    const resposta = await requisicao(MARIANA, '/mensagens/', {
      method: 'POST',
      body: JSON.stringify({ destinatarioId: ANA, conteudoTexto: '   ' }),
    });
    expect(resposta.status).toBe(400);
    const corpo = (await resposta.json()) as { conteudoTexto?: string[] };
    expect(corpo.conteudoTexto?.[0]).toMatch(/mensagem/i);
  });
});
