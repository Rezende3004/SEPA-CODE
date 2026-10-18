import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import type { SessaoUsuario } from '@/shared/types';
import { renderizarComProviders } from '@/shared/test/render';
import { RequireRole } from './RequireRole';

const profissional: SessaoUsuario = {
  id: 2,
  nome: 'Ana Ribeiro',
  email: 'ana.psicologa@sepa.exemplo',
  tipoUsuario: 'PROFISSIONAL',
  instituicaoId: 1,
  instituicaoNome: 'Instituto Horizonte Azul',
  ativo: true,
  especialidade: 'PSICOLOGO',
  registroProfissional: 'CRP 06/12345',
};

const administrador: SessaoUsuario = {
  id: 1,
  nome: 'Administração SEPA',
  email: 'admin@sepa.exemplo',
  tipoUsuario: 'ADMINISTRADOR',
  instituicaoId: null,
  instituicaoNome: null,
  ativo: true,
};

function montarRotas() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <RequireRole perfis={['ADMINISTRADOR']}>
            <p>Área administrativa</p>
          </RequireRole>
        }
      />
      <Route path="/403" element={<p>Página 403</p>} />
    </Routes>
  );
}

describe('RequireRole', () => {
  it('permite acesso quando o perfil corresponde', () => {
    renderizarComProviders(montarRotas(), { usuario: administrador, rota: '/admin' });
    expect(screen.getByText('Área administrativa')).toBeInTheDocument();
  });

  it('redireciona para 403 quando o perfil não corresponde', () => {
    renderizarComProviders(montarRotas(), { usuario: profissional, rota: '/admin' });
    expect(screen.getByText('Página 403')).toBeInTheDocument();
    expect(screen.queryByText('Área administrativa')).not.toBeInTheDocument();
  });

  it('redireciona usuário anônimo para o login', () => {
    renderizarComProviders(montarRotas(), { usuario: null, rota: '/admin' });
    expect(screen.queryByText('Área administrativa')).not.toBeInTheDocument();
  });
});
