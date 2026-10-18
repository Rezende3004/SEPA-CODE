import { http, HttpResponse } from 'msw';
import { historicoSchema } from '@/features/execucao/schemas';
import type { HistoricoAtividade } from '@/shared/types';
import { buscarAluno, buscarAtividade, db, proximoId } from '../db';
import {
  aguardar,
  corpoJson,
  erroValidacao,
  obterSessao,
  respostaErro,
  semAutorizacao,
} from '../lib/http';

export const historicoHandlers = [
  http.post('*/api/historico/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'ALUNO') {
      return respostaErro('Somente o aluno registra a execução das próprias atividades.', 403);
    }

    const corpo = await corpoJson(request);
    const analisado = historicoSchema.safeParse({
      atividadeId: Number(corpo.atividadeId),
      resultado: Number(corpo.resultado),
      tentativas: Number(corpo.tentativas),
      tempoRespostaSeg: Number(corpo.tempoRespostaSeg),
      feedback: typeof corpo.feedback === 'string' ? corpo.feedback : '',
      pediuAjuda: Boolean(corpo.pediuAjuda),
    });

    if (!analisado.success) {
      const campos: Record<string, string[]> = {};
      analisado.error.issues.forEach((issue) => {
        const campo = String(issue.path[0] ?? 'detail');
        campos[campo] = [...(campos[campo] ?? []), issue.message];
      });
      return erroValidacao(campos);
    }

    const dados = analisado.data;
    const atividade = buscarAtividade(dados.atividadeId);
    if (!atividade) return erroValidacao({ atividadeId: ['Atividade não encontrada.'] });

    const aluno = buscarAluno(sessao.usuarioId);
    if (!aluno) return erroValidacao({ alunoId: ['Aluno não encontrado.'] });
    if (atividade.instituicaoId !== aluno.instituicaoId) {
      return respostaErro('A atividade pertence a outra instituição (RN-003).', 403);
    }

    const registro: HistoricoAtividade = {
      id: proximoId(db.historico),
      dataHora: new Date().toISOString(),
      resultado: dados.resultado,
      tentativas: dados.tentativas,
      tempoRespostaSeg: dados.tempoRespostaSeg,
      feedback: dados.feedback,
      alunoId: aluno.id,
      atividadeId: atividade.id,
      pediuAjuda: dados.pediuAjuda,
    };

    db.historico.push(registro);
    return HttpResponse.json(registro, { status: 201 });
  }),
];
