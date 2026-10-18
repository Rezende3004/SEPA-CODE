import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db';
import { criarAccessToken } from '@/mocks/lib/token';
import { tokenStore } from '@/shared/lib/token-store';
import { renderizarComProviders } from '@/shared/test/render';
import type { SessaoUsuario } from '@/shared/types';
import { RecomendacoesPage } from './pages/RecomendacoesPage';

function sessaoAna(): SessaoUsuario {
  const ana = db.profissionais.find((item) => item.id === 2);
  if (!ana) throw new Error('Profissional do seed não encontrado.');
  return { ...ana, instituicaoNome: 'Instituto Horizonte Azul' };
}

describe('aceite de recomendação da IA (RF-009 e RN-004)', () => {
  beforeEach(() => {
    const ana = db.profissionais.find((item) => item.id === 2);
    if (!ana) throw new Error('Profissional do seed não encontrado.');
    tokenStore.setAccess(criarAccessToken(ana));
  });

  it('aplica o nível sugerido somente após a confirmação do profissional', async () => {
    const usuario = userEvent.setup();
    const recomendacaoHelena = db.recomendacoes.find((item) => item.alunoId === 12);
    if (!recomendacaoHelena) throw new Error('Recomendação da Helena não encontrada.');
    const nivelEsperado = recomendacaoHelena.nivelSugerido;

    renderizarComProviders(<RecomendacoesPage />, { usuario: sessaoAna() });

    const cartao = await screen.findByRole('article', { name: /Helena Costa/ });
    expect(db.atividades.find((item) => item.id === 6)?.nivelDificuldade).not.toBe(nivelEsperado);

    await usuario.click(within(cartao).getByRole('button', { name: 'Aceitar recomendação' }));
    await usuario.click(await screen.findByRole('button', { name: 'Aplicar sugestão' }));

    expect(await screen.findByText(/Recomendação de Helena Costa aceita/)).toBeInTheDocument();

    await waitFor(() => {
      expect(db.recomendacoes.find((item) => item.id === recomendacaoHelena.id)?.status).toBe(
        'ACEITA',
      );
    });
    expect(db.atividades.find((item) => item.id === 6)?.nivelDificuldade).toBe(nivelEsperado);
    expect(db.atividades.find((item) => item.id === 9)?.nivelDificuldade).toBe(nivelEsperado);
  });
});
