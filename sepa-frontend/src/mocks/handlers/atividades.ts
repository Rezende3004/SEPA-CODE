import { http, HttpResponse } from 'msw';
import type { Atividade, AtividadeAtribuida } from '@/shared/types';
import { buscarAtividade, db } from '../db';
import { aguardar, obterSessao, semAutorizacao, semPermissao } from '../lib/http';
import { numero, urlDaRequisicao } from '../lib/http';

function atividadesDaSessao(instituicaoId: number | null): Atividade[] {
  if (instituicaoId === null) return db.atividades;
  return db.atividades.filter((atividade) => atividade.instituicaoId === instituicaoId);
}

export const atividadesHandlers = [
  http.get('*/api/atividades/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const params = urlDaRequisicao(request).searchParams;
    const busca = (params.get('busca') ?? '').trim().toLowerCase();
    const tipo = params.get('tipo');
    const nivel = numero(params.get('nivel'));

    const atividades = atividadesDaSessao(sessao.instituicaoId).filter((atividade) => {
      if (busca && !`${atividade.titulo} ${atividade.descricao}`.toLowerCase().includes(busca)) {
        return false;
      }
      if (tipo && atividade.tipoAtividade !== tipo) return false;
      if (nivel !== null && atividade.nivelDificuldade !== nivel) return false;
      return true;
    });

    return HttpResponse.json(atividades);
  }),

  http.get('*/api/aluno/atividades/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'ALUNO') return semPermissao();

    const planos = db.planos.filter((plano) => plano.alunoId === sessao.usuarioId);
    const vistos = new Set<number>();
    const atribuidas: AtividadeAtribuida[] = [];

    for (const plano of planos) {
      for (const atividadeId of plano.atividadeIds) {
        if (vistos.has(atividadeId)) continue;
        const atividade = buscarAtividade(atividadeId);
        if (!atividade) continue;
        vistos.add(atividadeId);
        const execucoes = db.historico
          .filter(
            (registro) =>
              registro.alunoId === sessao.usuarioId && registro.atividadeId === atividadeId,
          )
          .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
        atribuidas.push({
          ...atividade,
          planoId: plano.id,
          planoNome: plano.nomePlano,
          totalExecucoes: execucoes.length,
          ultimaExecucao: execucoes.at(-1)?.dataHora ?? null,
        });
      }
    }

    return HttpResponse.json(atribuidas);
  }),
];
