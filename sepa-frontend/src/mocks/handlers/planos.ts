import { http, HttpResponse } from 'msw';
import type { PlanoDeAtendimento, PlanoDetalhado } from '@/shared/types';
import { buscarAluno, buscarAtividade, db, nomeUsuario, proximoId } from '../db';
import {
  aguardar,
  corpoJson,
  erroValidacao,
  naoEncontrado,
  numero,
  obterSessao,
  respostaErro,
  semAutorizacao,
  semPermissao,
  texto,
  urlDaRequisicao,
} from '../lib/http';
import { podeGerenciarPlano, podeVerAluno } from '../lib/rules';

export function enriquecerPlano(plano: PlanoDeAtendimento): PlanoDetalhado {
  const atividades = plano.atividadeIds
    .map((id) => buscarAtividade(id))
    .filter((atividade): atividade is NonNullable<typeof atividade> => Boolean(atividade));
  return {
    ...plano,
    alunoNome: nomeUsuario(plano.alunoId),
    profissionalNome: nomeUsuario(plano.profissionalId),
    atividades,
  };
}

export const planosHandlers = [
  http.get('*/api/planos/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const alunoParam = numero(urlDaRequisicao(request).searchParams.get('aluno'));
    let planos = db.planos;

    if (alunoParam !== null) {
      const aluno = buscarAluno(alunoParam);
      if (!aluno) return naoEncontrado('Aluno');
      if (!podeVerAluno(sessao, aluno)) return semPermissao();
      planos = planos.filter((plano) => plano.alunoId === alunoParam);
    } else if (sessao.tipoUsuario === 'PROFISSIONAL') {
      planos = planos.filter((plano) => {
        const aluno = buscarAluno(plano.alunoId);
        return aluno?.instituicaoId === sessao.instituicaoId;
      });
    } else if (sessao.tipoUsuario === 'RESPONSAVEL') {
      planos = planos.filter((plano) => {
        const aluno = buscarAluno(plano.alunoId);
        return aluno?.responsavelId === sessao.usuarioId;
      });
    } else if (sessao.tipoUsuario === 'ALUNO') {
      planos = planos.filter((plano) => plano.alunoId === sessao.usuarioId);
    }

    return HttpResponse.json(planos.map(enriquecerPlano));
  }),

  http.get('*/api/planos/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const plano = db.planos.find((item) => item.id === Number(params.id));
    if (!plano) return naoEncontrado('Plano');
    const aluno = buscarAluno(plano.alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (!podeVerAluno(sessao, aluno)) return semPermissao();
    return HttpResponse.json(enriquecerPlano(plano));
  }),

  http.post('*/api/planos/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'PROFISSIONAL') {
      return respostaErro('Apenas profissionais podem criar planos de atendimento.', 403);
    }

    const corpo = await corpoJson(request);
    const alunoId = numero(corpo.alunoId);
    const nomePlano = texto(corpo.nomePlano);
    const dataInicio = texto(corpo.dataInicio);
    const objetivos = texto(corpo.objetivos);
    const erros: Record<string, string[]> = {};

    if (!alunoId) erros.alunoId = ['Selecione o aluno.'];
    if (nomePlano.length < 3) erros.nomePlano = ['Informe um nome para o plano.'];
    if (!dataInicio) erros.dataInicio = ['Informe a data de início.'];
    if (objetivos.length < 10) erros.objetivos = ['Descreva os objetivos do plano.'];

    const aluno = alunoId ? buscarAluno(alunoId) : undefined;
    if (alunoId && !aluno) erros.alunoId = ['Aluno não encontrado.'];
    if (aluno && aluno.instituicaoId !== sessao.instituicaoId) {
      return semPermissao();
    }

    if (Object.keys(erros).length > 0) return erroValidacao(erros);

    const plano: PlanoDeAtendimento = {
      id: proximoId(db.planos),
      nomePlano,
      dataInicio,
      objetivos,
      profissionalId: sessao.usuarioId,
      alunoId: alunoId as number,
      atividadeIds: [],
    };
    db.planos.push(plano);
    return HttpResponse.json(enriquecerPlano(plano), { status: 201 });
  }),

  http.patch('*/api/planos/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const plano = db.planos.find((item) => item.id === Number(params.id));
    if (!plano) return naoEncontrado('Plano');
    const aluno = buscarAluno(plano.alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (sessao.tipoUsuario !== 'PROFISSIONAL' || !podeGerenciarPlano(sessao, plano, aluno)) {
      return semPermissao();
    }

    const corpo = await corpoJson(request);
    const erros: Record<string, string[]> = {};
    if (corpo.nomePlano !== undefined) {
      const nomePlano = texto(corpo.nomePlano);
      if (nomePlano.length < 3) erros.nomePlano = ['Informe um nome para o plano.'];
      else plano.nomePlano = nomePlano;
    }
    if (corpo.dataInicio !== undefined) {
      const dataInicio = texto(corpo.dataInicio);
      if (!dataInicio) erros.dataInicio = ['Informe a data de início.'];
      else plano.dataInicio = dataInicio;
    }
    if (corpo.objetivos !== undefined) {
      const objetivos = texto(corpo.objetivos);
      if (objetivos.length < 10) erros.objetivos = ['Descreva os objetivos do plano.'];
      else plano.objetivos = objetivos;
    }

    if (Object.keys(erros).length > 0) return erroValidacao(erros);
    return HttpResponse.json(enriquecerPlano(plano));
  }),

  http.delete('*/api/planos/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const indice = db.planos.findIndex((item) => item.id === Number(params.id));
    if (indice < 0) return naoEncontrado('Plano');
    const plano = db.planos[indice];
    const aluno = buscarAluno(plano.alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (sessao.tipoUsuario !== 'PROFISSIONAL' || !podeGerenciarPlano(sessao, plano, aluno)) {
      return semPermissao();
    }
    db.planos.splice(indice, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/planos/:id/atividades/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const plano = db.planos.find((item) => item.id === Number(params.id));
    if (!plano) return naoEncontrado('Plano');
    const aluno = buscarAluno(plano.alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (sessao.tipoUsuario !== 'PROFISSIONAL' || !podeGerenciarPlano(sessao, plano, aluno)) {
      return semPermissao();
    }

    const corpo = await corpoJson(request);
    const atividadeId = numero(corpo.atividadeId);
    if (!atividadeId) return erroValidacao({ atividadeId: ['Informe a atividade.'] });
    const atividade = buscarAtividade(atividadeId);
    if (!atividade) return erroValidacao({ atividadeId: ['Atividade não encontrada.'] });
    if (atividade.instituicaoId !== aluno.instituicaoId) {
      return respostaErro('A atividade pertence a outra instituição (RN-003).', 403);
    }
    if (!plano.atividadeIds.includes(atividadeId)) {
      plano.atividadeIds.push(atividadeId);
    }
    return HttpResponse.json(enriquecerPlano(plano));
  }),

  http.delete('*/api/planos/:id/atividades/:atividadeId/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const plano = db.planos.find((item) => item.id === Number(params.id));
    if (!plano) return naoEncontrado('Plano');
    const aluno = buscarAluno(plano.alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (sessao.tipoUsuario !== 'PROFISSIONAL' || !podeGerenciarPlano(sessao, plano, aluno)) {
      return semPermissao();
    }
    plano.atividadeIds = plano.atividadeIds.filter((id) => id !== Number(params.atividadeId));
    return new HttpResponse(null, { status: 204 });
  }),
];
