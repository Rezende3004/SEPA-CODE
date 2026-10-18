import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizarComProviders } from '@/shared/test/render';
import { LoginPage } from './pages/LoginPage';

function montarRotas() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profissional" element={<p>Painel do profissional</p>} />
      <Route path="/aluno" element={<p>Painel do aluno</p>} />
    </Routes>
  );
}

describe('fluxo de login', () => {
  it('autentica um profissional e redireciona ao painel do perfil', async () => {
    const usuario = userEvent.setup();
    renderizarComProviders(montarRotas(), { rota: '/login' });

    await usuario.type(screen.getByLabelText(/E-mail/), 'ana.psicologa@sepa.exemplo');
    await usuario.type(screen.getByLabelText(/^Senha/), 'Sepa@2026');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Painel do profissional')).toBeInTheDocument();
  });

  it('mostra mensagem de erro para credenciais inválidas', async () => {
    const usuario = userEvent.setup();
    renderizarComProviders(montarRotas(), { rota: '/login' });

    await usuario.type(screen.getByLabelText(/E-mail/), 'ana.psicologa@sepa.exemplo');
    await usuario.type(screen.getByLabelText(/^Senha/), 'senha-incorreta');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument();
  });
});
