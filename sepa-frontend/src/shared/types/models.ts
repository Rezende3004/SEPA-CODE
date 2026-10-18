export const TIPOS_USUARIO = [
  'PROFISSIONAL',
  'ALUNO',
  'RESPONSAVEL',
  'ADMINISTRADOR',
] as const;
export type TipoUsuario = (typeof TIPOS_USUARIO)[number];

export const ESPECIALIDADES = ['PSICOLOGO', 'FONOAUDIOLOGO', 'PEDAGOGO'] as const;
export type Especialidade = (typeof ESPECIALIDADES)[number];

export const TIPOS_ATIVIDADE = ['ASSOCIACAO', 'SEQUENCIA'] as const;
export type TipoAtividade = (typeof TIPOS_ATIVIDADE)[number];

export const STATUS_ASSINATURA = ['ATIVA', 'SUSPENSA', 'TESTE'] as const;
export type StatusAssinatura = (typeof STATUS_ASSINATURA)[number];

export const TENDENCIAS = ['EVOLUCAO', 'ESTAGNACAO', 'REGRESSAO'] as const;
export type Tendencia = (typeof TENDENCIAS)[number];

export const STATUS_RECOMENDACAO = ['PENDENTE', 'ACEITA', 'REJEITADA'] as const;
export type StatusRecomendacao = (typeof STATUS_RECOMENDACAO)[number];

export interface Instituicao {
  id: number;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  statusAssinatura: StatusAssinatura;
}

export interface InstituicaoPublica {
  id: number;
  nomeFantasia: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  instituicaoId: number | null;
  /** Ativação da conta (RF-010). */
  ativo: boolean;
}

export interface Profissional extends Usuario {
  tipoUsuario: 'PROFISSIONAL';
  especialidade: Especialidade;
  registroProfissional: string;
}

export interface Responsavel extends Usuario {
  tipoUsuario: 'RESPONSAVEL';
  telefone: string;
}

export interface Aluno extends Usuario {
  tipoUsuario: 'ALUNO';
  dataNascimento: string;
  observacoes: string;
  responsavelId: number;
}

/** Retorno enriquecido de /api/alunos/ para as telas de acompanhamento. */
export interface AlunoResumo extends Aluno {
  responsavelNome: string;
  responsavelEmail: string;
  instituicaoNome: string;
  mediaRecente: number;
  tendencia: Tendencia;
  totalPlanos: number;
}

export interface ConteudoMultimidia {
  id: number;
  nomeArquivo: string;
  tipoArquivo: string;
  url: string;
  instituicaoId: number;
}

export type TipoItemAtividade = 'EMOJI' | 'TEXTO';

/**
 * Conteúdo jogável da atividade. O modelo relacional guarda apenas
 * referências de mídia; este campo de leitura é uma extensão documentada
 * no contrato para viabilizar os dois motores de atividade.
 */
export interface ItemAtividade {
  id: number;
  tipo: TipoItemAtividade;
  valor: string;
  rotulo: string;
  dica: string;
}

export interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  nivelDificuldade: number;
  tipoAtividade: TipoAtividade;
  instituicaoId: number;
  conteudoIds: number[];
  itens: ItemAtividade[];
}

export interface AtividadeAtribuida extends Atividade {
  planoId: number;
  planoNome: string;
  totalExecucoes: number;
  ultimaExecucao: string | null;
}

export interface PlanoDeAtendimento {
  id: number;
  nomePlano: string;
  dataInicio: string;
  objetivos: string;
  profissionalId: number;
  alunoId: number;
  atividadeIds: number[];
}

export interface PlanoDetalhado extends PlanoDeAtendimento {
  alunoNome: string;
  profissionalNome: string;
  atividades: Atividade[];
}

export interface HistoricoAtividade {
  id: number;
  dataHora: string;
  resultado: number;
  tentativas: number;
  tempoRespostaSeg: number;
  feedback: string;
  alunoId: number;
  atividadeId: number;
  pediuAjuda: boolean;
}

export interface Relatorio {
  id: number;
  tituloRelatorio: string;
  dataGeracao: string;
  periodoInicio: string;
  periodoFim: string;
  conteudoObservacoes: string;
  profissionalId: number;
  alunoId: number;
}

export interface AnaliseAprendizado {
  id: number;
  dataAnalise: string;
  pontuacaoCurva: number;
  tendencia: Tendencia;
  observacoesIA: string;
  alunoId: number;
}

export interface FatorRecomendacao {
  metrica: string;
  valor: number;
  peso: number;
}

export interface RecomendacaoIA {
  id: number;
  dataGeracao: string;
  descricaoRecomendacao: string;
  status: StatusRecomendacao;
  analiseId: number;
  atividadeIds: number[];
  nivelSugerido: number;
  nivelAtual: number;
  fatores: FatorRecomendacao[];
  alunoId: number;
}

export interface RecomendacaoDetalhada extends RecomendacaoIA {
  alunoNome: string;
  atividades: Atividade[];
}

export interface Mensagem {
  id: number;
  conteudoTexto: string;
  dataEnvio: string;
  remetenteId: number;
  destinatarioId: number;
  lida: boolean;
}

export interface ConversaResumo {
  usuarioId: number;
  nome: string;
  tipoUsuario: TipoUsuario;
  ultimaMensagem: string;
  dataEnvio: string;
  naoLidas: number;
}

export interface SessaoUsuario extends Usuario {
  instituicaoNome: string | null;
  especialidade?: Especialidade;
  registroProfissional?: string;
  telefone?: string;
  dataNascimento?: string;
  responsavelId?: number;
}
