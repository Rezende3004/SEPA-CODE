import type {
  Aluno,
  AnaliseAprendizado,
  Atividade,
  ConteudoMultimidia,
  HistoricoAtividade,
  Instituicao,
  Mensagem,
  PlanoDeAtendimento,
  Profissional,
  RecomendacaoIA,
  Relatorio,
  Responsavel,
  Usuario,
} from '@/shared/types';
import { criarBanco } from './seed';

export interface Banco {
  instituicoes: Instituicao[];
  usuarios: Usuario[];
  profissionais: Profissional[];
  responsaveis: Responsavel[];
  alunos: Aluno[];
  atividades: Atividade[];
  conteudos: ConteudoMultimidia[];
  planos: PlanoDeAtendimento[];
  niveisAtribuidos: Record<string, number>;
  historico: HistoricoAtividade[];
  relatorios: Relatorio[];
  analises: AnaliseAprendizado[];
  recomendacoes: RecomendacaoIA[];
  mensagens: Mensagem[];
  credenciais: Record<string, string>;
}

export let db: Banco = criarBanco();

export function resetDb(): void {
  db = criarBanco();
}

export function proximoId(colecao: { id: number }[]): number {
  return colecao.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

export function buscarUsuario(id: number): Usuario | undefined {
  return db.usuarios.find((usuario) => usuario.id === id);
}

export function buscarAluno(id: number): Aluno | undefined {
  return db.alunos.find((aluno) => aluno.id === id);
}

export function buscarAtividade(id: number): Atividade | undefined {
  return db.atividades.find((atividade) => atividade.id === id);
}

export function nomeUsuario(id: number): string {
  return buscarUsuario(id)?.nome ?? 'Usuário';
}
