import { http, HttpResponse } from 'msw';
import type { RecomendacaoDetalhada, RecomendacaoIA } from '@/shared/types';
import { buscarAluno, buscarAtividade, db, nomeUsuario } from '../db';
import {
  aguardar,
  naoEncontrado,
  numero,
  obterSessao,
  respostaErro,
  semAutorizacao,
  semPermissao,
  urlDaRequisicao,
} from '../lib/http';
import { podeDecidirRecomendacao, podeVerAluno } from '../lib/rules';

function enriquecer(recomendacao: RecomendacaoIA): RecomendacaoDetalhada {
  const atividades = recomendacao.atividadeIds
    .map((id) => buscarAtividade(id))
    .filter((atividade): atividade is NonNullable<typeof atividade> => Boolean(atividade));
  return {
    ...recomendacao,
    alunoNome: nomeUsuario(recomendacao.alunoId),
    atividades,
  };
}

export const recomendacoesHandlers = [
  http.get('*/api/recomendacoes/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'PROFISSIONAL' && sessao.tipoUsuario !== 'ADMINISTRADOR') {
      return semPermissao();
    }

    const params = urlDaRequisicao(request).searchParams;
    const alunoId = numero(params.get('aluno'));
    const status = params.get('status');

    let recomendacoes = db.recomendacoes;
    if (sessao.tipoUsuario === 'PROFISSIONAL') {
      recomendacoes = recomendacoes.filter((recomendacao) => {
        const aluno = buscarAluno(recomendacao.alunoId);
        return aluno?.instituicaoId === sessao.instituicaoId;
      });
    }
    if (alunoId !== null) {
      recomendacoes = recomendacoes.filter((recomendacao) => recomendacao.alunoId === alunoId);
    }
    if (status) {
      recomendacoes = recomendacoes.filter((recomendacao) => recomendacao.status === status);
    }

    return HttpResponse.json(
      [...recomendacoes]
        .sort((a, b) => b.dataGeracao.localeCompare(a.dataGeracao))
        .map(enriquecer),
    );
  }),

  http.post('*/api/recomendacoes/:id/aceitar/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const recomendacao = db.recomendacoes.find((item) => item.id === Number(params.id));
    if (!recomendacao) return naoEncontrado('Recomendação');
    const aluno = buscarAluno(recomendacao.alunoId);
    if (!aluno) return naoEncontrado('Aluno');

    // RN-004: somente profissional da instituição do aluno, e nunca automático.
    if (!podeDecidirRecomendacao(sessao, aluno)) {
      return respostaErro(
        'Somente um profissional da instituição do aluno pode aceitar esta recomendação (RN-004).',
        403,
      );
    }
    if (recomendacao.status !== 'PENDENTE') {
      return respostaErro('Esta recomendação já foi decidida.', 409);
    }

    const nivel = Math.min(5, Math.max(1, recomendacao.nivelSugerido));
    recomendacao.atividadeIds.forEach((atividadeId) => {
      const atividade = buscarAtividade(atividadeId);
      if (atividade) atividade.nivelDificuldade = nivel;
    });
    recomendacao.status = 'ACEITA';
    recomendacao.nivelAtual = nivel;
    return HttpResponse.json(enriquecer(recomendacao));
  }),

  http.post('*/api/recomendacoes/:id/rejeitar/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const recomendacao = db.recomendacoes.find((item) => item.id === Number(params.id));
    if (!recomendacao) return naoEncontrado('Recomendação');
    const aluno = buscarAluno(recomendacao.alunoId);
    if (!aluno) return naoEncontrado('Aluno');

    if (!podeDecidirRecomendacao(sessao, aluno)) {
      return respostaErro('Somente um profissional pode rejeitar esta recomendação (RN-004).', 403);
    }
    if (recomendacao.status !== 'PENDENTE') {
      return respostaErro('Esta recomendação já foi decidida.', 409);
    }

    recomendacao.status = 'REJEITADA';
    return HttpResponse.json(enriquecer(recomendacao));
  }),

  http.get('*/api/recomendacoes/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const recomendacao = db.recomendacoes.find((item) => item.id === Number(params.id));
    if (!recomendacao) return naoEncontrado('Recomendação');
    const aluno = buscarAluno(recomendacao.alunoId);
    if (!aluno || !podeVerAluno(sessao, aluno)) return semPermissao();
    return HttpResponse.json(enriquecer(recomendacao));
  }),
];
