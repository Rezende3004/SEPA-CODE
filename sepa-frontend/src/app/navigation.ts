import {
  BookOpenCheck,
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import type { TipoUsuario } from '@/shared/types';
import { rotas } from '@/app/router/paths';

export interface ItemNavegacao {
  rotulo: string;
  para: string;
  icone: typeof LayoutDashboard;
  fim?: boolean;
}

export const navegacaoPorPerfil: Record<TipoUsuario, ItemNavegacao[]> = {
  PROFISSIONAL: [
    { rotulo: 'Visão geral', para: rotas.profissional.raiz, icone: LayoutDashboard, fim: true },
    { rotulo: 'Alunos e planos', para: rotas.profissional.alunos, icone: Users },
    { rotulo: 'Catálogo de atividades', para: rotas.profissional.atividades, icone: BookOpenCheck },
    { rotulo: 'Relatórios', para: rotas.profissional.relatorios, icone: LineChart },
    { rotulo: 'Recomendações da IA', para: rotas.profissional.recomendacoes, icone: Sparkles },
    { rotulo: 'Mensagens', para: rotas.profissional.mensagens, icone: MessageSquare },
  ],
  ALUNO: [
    { rotulo: 'Minhas atividades', para: rotas.aluno.raiz, icone: FolderKanban, fim: true },
    { rotulo: 'Preferências', para: rotas.aluno.preferencias, icone: ClipboardList },
  ],
  RESPONSAVEL: [
    { rotulo: 'Meus filhos', para: rotas.responsavel.raiz, icone: Users, fim: true },
    { rotulo: 'Mensagens', para: rotas.responsavel.mensagens, icone: MessageSquare },
  ],
  ADMINISTRADOR: [
    { rotulo: 'Visão geral', para: rotas.admin.raiz, icone: LayoutDashboard, fim: true },
    { rotulo: 'Instituições', para: rotas.admin.instituicoes, icone: Building2 },
    { rotulo: 'Profissionais', para: rotas.admin.profissionais, icone: Users },
  ],
};

export const rotuloPerfil: Record<TipoUsuario, string> = {
  PROFISSIONAL: 'Profissional',
  ALUNO: 'Aluno',
  RESPONSAVEL: 'Responsável',
  ADMINISTRADOR: 'Administrador',
};
