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

const ANA = 2; // psicóloga, instituição 1
const DIEGO = 5; // psicólogo, instituição 2
const MARIANA = 6; // responsável, instituição 1

describe('RN-001 — aluno exige responsável', () => {
  it('rejeita cadastro sem responsável com 400 e mensagem no campo', async () => {
    const resposta = await requisicao(ANA, '/alunos/', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Aluno Sem Responsável',
        email: 'sem.responsavel@sepa.exemplo',
        dataNascimento: '2018-04-01',
        observacoes: '',
      }),
    });

    expect(resposta.status).toBe(400);
    const corpo = (await resposta.json()) as { responsavelId?: string[] };
    expect(corpo.responsavelId?.[0]).toMatch(/responsável/i);
  });
});

describe('RN-002 — isolamento por instituição', () => {
  it('bloqueia acesso a aluno de outra instituição com 403', async () => {
    const resposta = await requisicao(DIEGO, '/alunos/11/');
    expect(resposta.status).toBe(403);
  });

  it('lista apenas alunos da instituição da sessão', async () => {
    const resposta = await requisicao(DIEGO, '/alunos/');
    expect(resposta.status).toBe(200);
    const alunos = (await resposta.json()) as { instituicaoId: number }[];
    expect(alunos.length).toBeGreaterThan(0);
    expect(alunos.every((aluno) => aluno.instituicaoId === 2)).toBe(true);
  });

  it('bloqueia criação de plano para aluno de outra instituição', async () => {
    const resposta = await requisicao(DIEGO, '/planos/', {
      method: 'POST',
      body: JSON.stringify({
        alunoId: 11,
        nomePlano: 'Plano indevido',
        dataInicio: '2026-01-01',
        objetivos: 'Tentativa de acesso indevido entre instituições.',
      }),
    });
    expect(resposta.status).toBe(403);
  });
});

describe('RN-003 — atividades filtradas pela instituição', () => {
  it('retorna apenas atividades da instituição da sessão', async () => {
    const resposta = await requisicao(ANA, '/atividades/');
    expect(resposta.status).toBe(200);
    const atividades = (await resposta.json()) as { instituicaoId: number }[];
    expect(atividades.length).toBe(10);
    expect(atividades.every((atividade) => atividade.instituicaoId === 1)).toBe(true);
  });
});

describe('RN-004 — a IA nunca altera o plano sozinha', () => {
  const recomendacaoId = 1;

  it('não altera o nível sem decisão do profissional', () => {
    expect(db.atividades.find((item) => item.id === 6)?.nivelDificuldade).toBe(3);
    expect(db.recomendacoes.find((item) => item.id === recomendacaoId)?.status).toBe('PENDENTE');
  });

  it('bloqueia responsável e profissional de outra instituição', async () => {
    const doResponsavel = await requisicao(MARIANA, `/recomendacoes/${recomendacaoId}/aceitar/`, {
      method: 'POST',
    });
    expect(doResponsavel.status).toBe(403);

    const deOutraInstituicao = await requisicao(
      DIEGO,
      `/recomendacoes/${recomendacaoId}/aceitar/`,
      { method: 'POST' },
    );
    expect(deOutraInstituicao.status).toBe(403);
    expect(db.atividades.find((item) => item.id === 6)?.nivelDificuldade).toBe(3);
  });

  it('aplica o nível sugerido quando o profissional da instituição aceita', async () => {
    const resposta = await requisicao(ANA, `/recomendacoes/${recomendacaoId}/aceitar/`, {
      method: 'POST',
    });
    expect(resposta.status).toBe(200);
    expect(db.recomendacoes.find((item) => item.id === recomendacaoId)?.status).toBe('ACEITA');
    expect(db.atividades.find((item) => item.id === 6)?.nivelDificuldade).toBe(2);
    expect(db.atividades.find((item) => item.id === 9)?.nivelDificuldade).toBe(2);

    const repetida = await requisicao(ANA, `/recomendacoes/${recomendacaoId}/aceitar/`, {
      method: 'POST',
    });
    expect(repetida.status).toBe(409);
  });
});
