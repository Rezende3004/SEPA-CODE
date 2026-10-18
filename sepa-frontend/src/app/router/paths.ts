import type { TipoUsuario } from '@/shared/types';

export const rotas = {
  login: '/login',
  cadastro: '/cadastro',
  proibido: '/403',
  profissional: {
    raiz: '/profissional',
    alunos: '/profissional/alunos',
    aluno: (alunoId: number | string) => `/profissional/alunos/${alunoId}`,
    plano: (alunoId: number | string, planoId: number | string) =>
      `/profissional/alunos/${alunoId}/planos/${planoId}`,
    atividades: '/profissional/atividades',
    relatorios: '/profissional/relatorios',
    relatorio: (alunoId: number | string) => `/profissional/relatorios/${alunoId}`,
    recomendacoes: '/profissional/recomendacoes',
    mensagens: '/profissional/mensagens',
    conversa: (usuarioId: number | string) => `/profissional/mensagens/${usuarioId}`,
  },
  aluno: {
    raiz: '/aluno',
    atividade: (atividadeId: number | string) => `/aluno/atividades/${atividadeId}`,
    preferencias: '/aluno/preferencias',
  },
  responsavel: {
    raiz: '/responsavel',
    filho: (alunoId: number | string) => `/responsavel/filhos/${alunoId}`,
    mensagens: '/responsavel/mensagens',
    conversa: (usuarioId: number | string) => `/responsavel/mensagens/${usuarioId}`,
  },
  admin: {
    raiz: '/admin',
    instituicoes: '/admin/instituicoes',
    profissionais: '/admin/profissionais',
  },
} as const;

export function destinoPorPerfil(tipo: TipoUsuario): string {
  switch (tipo) {
    case 'PROFISSIONAL':
      return rotas.profissional.raiz;
    case 'ALUNO':
      return rotas.aluno.raiz;
    case 'RESPONSAVEL':
      return rotas.responsavel.raiz;
    case 'ADMINISTRADOR':
      return rotas.admin.raiz;
  }
}
