import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db';
import { criarAccessToken } from '@/mocks/lib/token';
import { tokenStore } from '@/shared/lib/token-store';
import { renderizarComProviders } from '@/shared/test/render';
import type { SessaoUsuario } from '@/shared/types';
import { ExecutarAtividadePage } from './pages/ExecutarAtividadePage';

function sessaoLucas(): SessaoUsuario {
  const lucas = db.alunos.find((aluno) => aluno.id === 11);
  if (!lucas) throw new Error('Aluno do seed não encontrado.');
  return { ...lucas, instituicaoNome: 'Instituto Horizonte Azul' };
}

function montarRotas() {
  return (
    <Routes>
      <Route path="/aluno/atividades/:atividadeId" element={<ExecutarAtividadePage />} />
      <Route path="/aluno" element={<p>Minhas atividades</p>} />
    </Routes>
  );
}

describe('execução de atividade pelo aluno (RF-008 e RF-004)', () => {
  beforeEach(() => {
    const lucas = db.alunos.find((aluno) => aluno.id === 11);
    if (!lucas) throw new Error('Aluno do seed não encontrado.');
    tokenStore.setAccess(criarAccessToken(lucas));
  });

  it('conclui a associação, registra o histórico e contabiliza o pedido de ajuda', async () => {
    const usuario = userEvent.setup();
    const quantidadeInicial = db.historico.length;

    renderizarComProviders(montarRotas(), { usuario: sessaoLucas(), rota: '/aluno/atividades/1' });

    expect(
      await screen.findByRole('heading', { name: 'Quem é este animal?' }),
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Preciso de ajuda/ }));
    expect(await screen.findByText('Uma dica para você')).toBeInTheDocument();

    for (const rotulo of ['Cachorro', 'Gato', 'Coelho', 'Pássaro']) {
      const opcao = await screen.findByRole('button', { name: rotulo });
      await usuario.click(opcao);
      await waitFor(
        () => {
          expect(screen.queryByText('Muito bem! Está certo.')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    }

    expect(
      await screen.findByRole('heading', { name: /Atividade concluída/ }),
    ).toBeInTheDocument();

    await waitFor(() => expect(db.historico.length).toBe(quantidadeInicial + 1));
    const registro = db.historico.at(-1);
    expect(registro?.alunoId).toBe(11);
    expect(registro?.atividadeId).toBe(1);
    expect(registro?.pediuAjuda).toBe(true);
    expect(registro?.resultado).toBe(100);
  });
});
