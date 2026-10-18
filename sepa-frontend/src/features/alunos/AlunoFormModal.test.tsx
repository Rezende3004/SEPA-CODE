import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db';
import { criarAccessToken } from '@/mocks/lib/token';
import { tokenStore } from '@/shared/lib/token-store';
import { renderizarComProviders } from '@/shared/test/render';
import { AlunoFormModal } from './components/AlunoFormModal';

describe('AlunoFormModal', () => {
  beforeEach(() => {
    const profissional = db.profissionais.find((item) => item.id === 2);
    if (!profissional) throw new Error('Profissional do seed não encontrado.');
    tokenStore.setAccess(criarAccessToken(profissional));
  });

  it('bloqueia o envio sem responsável e não cria aluno (RN-001)', async () => {
    const usuario = userEvent.setup();
    const quantidadeInicial = db.alunos.length;

    renderizarComProviders(<AlunoFormModal aberto onFechar={() => undefined} />);

    await usuario.type(screen.getByLabelText(/Nome completo/), 'Aluno Teste');
    await usuario.type(screen.getByLabelText(/E-mail/), 'aluno.teste@sepa.exemplo');
    await usuario.type(screen.getByLabelText(/Data de nascimento/), '2018-01-10');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar aluno' }));

    expect(await screen.findByText('Selecione o responsável (RN-001).')).toBeInTheDocument();
    await waitFor(() => expect(db.alunos.length).toBe(quantidadeInicial));
  });
});
