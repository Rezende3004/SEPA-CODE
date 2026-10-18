import type { SessaoUsuario } from './models';

export interface LoginResposta {
  access: string;
  refresh: string;
  usuario: SessaoUsuario;
}

export interface RefreshResposta {
  access: string;
}

export interface PontoCurva {
  data: string;
  resultado: number;
  mediaMovel: number;
  ewma: number;
}

export interface ResumoDesempenho {
  mediaResultado: number;
  totalTentativas: number;
  totalExecucoes: number;
  pedidosAjuda: number;
  slope: number;
  tendencia: 'EVOLUCAO' | 'ESTAGNACAO' | 'REGRESSAO';
}

export interface DesempenhoPorAtividade {
  atividadeId: number;
  titulo: string;
  nivelDificuldade: number;
  mediaResultado: number;
  totalExecucoes: number;
  tendencia: 'EVOLUCAO' | 'ESTAGNACAO' | 'REGRESSAO';
  pontos: PontoCurva[];
}

export interface RelatorioDesempenho {
  alunoId: number;
  alunoNome: string;
  periodoInicio: string;
  periodoFim: string;
  resumo: ResumoDesempenho;
  porAtividade: DesempenhoPorAtividade[];
  alertaEstagnacao: boolean;
  observacoes: string;
}
