import type { Aluno, PlanoDeAtendimento } from '@/shared/types';
import type { SessaoMock } from './http';

/** RN-002: profissional acessa apenas alunos da própria instituição. */
export function mesmaInstituicao(sessao: SessaoMock, instituicaoId: number): boolean {
  return sessao.tipoUsuario === 'ADMINISTRADOR' || sessao.instituicaoId === instituicaoId;
}

export function podeVerAluno(sessao: SessaoMock, aluno: Aluno): boolean {
  if (sessao.tipoUsuario === 'ADMINISTRADOR') return true;
  if (sessao.tipoUsuario === 'RESPONSAVEL') return aluno.responsavelId === sessao.usuarioId;
  if (sessao.tipoUsuario === 'ALUNO') return aluno.id === sessao.usuarioId;
  return aluno.instituicaoId === sessao.instituicaoId;
}

/** Escrita em aluno/plano: administrador, profissional da instituição. */
export function podeGerenciarAluno(sessao: SessaoMock, aluno: Aluno): boolean {
  if (sessao.tipoUsuario === 'ADMINISTRADOR') return true;
  return sessao.tipoUsuario === 'PROFISSIONAL' && aluno.instituicaoId === sessao.instituicaoId;
}

export function podeGerenciarPlano(
  sessao: SessaoMock,
  plano: PlanoDeAtendimento,
  aluno: Aluno,
): boolean {
  return podeGerenciarAluno(sessao, aluno) && plano.alunoId === aluno.id;
}

/** RN-004: apenas profissional da instituição do aluno pode decidir. */
export function podeDecidirRecomendacao(sessao: SessaoMock, aluno: Aluno): boolean {
  return sessao.tipoUsuario === 'PROFISSIONAL' && aluno.instituicaoId === sessao.instituicaoId;
}

/**
 * RN-001: o aluno precisa de responsável. A checagem existe no servidor
 * simulado além do formulário, pois a tela não é fonte de verdade.
 */
export function validarResponsavelObrigatorio(valor: unknown): string | null {
  if (typeof valor === 'number' && Number.isInteger(valor) && valor > 0) return null;
  return 'O responsável é obrigatório para cadastrar um aluno (RN-001).';
}
