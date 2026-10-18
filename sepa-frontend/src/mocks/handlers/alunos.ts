import { http, HttpResponse } from 'msw';
import { classificarTendencia, media, slope } from '@/shared/lib/stats';
import type { Aluno, AlunoResumo } from '@/shared/types';
import { buscarUsuario, db, proximoId } from '../db';
import {
  aguardar,
  corpoJson,
  erroValidacao,
  naoEncontrado,
  numero,
  obterSessao,
  semAutorizacao,
  semPermissao,
  texto,
} from '../lib/http';
import { podeVerAluno, validarResponsavelObrigatorio } from '../lib/rules';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function enriquecerAluno(aluno: Aluno): AlunoResumo {
  const responsavel = buscarUsuario(aluno.responsavelId);
  const instituicao = db.instituicoes.find((item) => item.id === aluno.instituicaoId);
  const resultados = db.historico
    .filter((registro) => registro.alunoId === aluno.id)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    .slice(-10)
    .map((registro) => registro.resultado);

  return {
    ...aluno,
    responsavelNome: responsavel?.nome ?? 'Não informado',
    responsavelEmail: responsavel?.email ?? '',
    instituicaoNome: instituicao?.nomeFantasia ?? '',
    mediaRecente: Number(media(resultados).toFixed(1)),
    tendencia: classificarTendencia(slope(resultados)),
    totalPlanos: db.planos.filter((plano) => plano.alunoId === aluno.id).length,
  };
}

function alunosVisiveis(sessao: NonNullable<ReturnType<typeof obterSessao>>): Aluno[] {
  if (sessao.tipoUsuario === 'ADMINISTRADOR') return db.alunos;
  if (sessao.tipoUsuario === 'RESPONSAVEL') {
    return db.alunos.filter((aluno) => aluno.responsavelId === sessao.usuarioId);
  }
  if (sessao.tipoUsuario === 'ALUNO') {
    return db.alunos.filter((aluno) => aluno.id === sessao.usuarioId);
  }
  return db.alunos.filter((aluno) => aluno.instituicaoId === sessao.instituicaoId);
}

export const alunosHandlers = [
  http.get('*/api/alunos/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    return HttpResponse.json(alunosVisiveis(sessao).map(enriquecerAluno));
  }),

  http.get('*/api/alunos/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    const aluno = db.alunos.find((item) => item.id === Number(params.id));
    if (!aluno) return naoEncontrado('Aluno');
    if (!podeVerAluno(sessao, aluno)) return semPermissao();
    return HttpResponse.json(enriquecerAluno(aluno));
  }),

  http.post('*/api/alunos/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'PROFISSIONAL' && sessao.tipoUsuario !== 'ADMINISTRADOR') {
      return semPermissao();
    }

    const corpo = await corpoJson(request);
    const nome = texto(corpo.nome);
    const email = texto(corpo.email).toLowerCase();
    const dataNascimento = texto(corpo.dataNascimento);
    const observacoes = texto(corpo.observacoes);
    const responsavelId = numero(corpo.responsavelId);

    const erros: Record<string, string[]> = {};
    if (nome.length < 3) erros.nome = ['Informe o nome completo do aluno.'];
    if (!EMAIL_REGEX.test(email)) erros.email = ['Informe um e-mail válido.'];
    if (!dataNascimento) erros.dataNascimento = ['Informe a data de nascimento.'];

    const mensagemResponsavel = validarResponsavelObrigatorio(responsavelId);
    if (mensagemResponsavel) erros.responsavelId = [mensagemResponsavel];

    if (db.usuarios.some((item) => item.email.toLowerCase() === email)) {
      erros.email = ['Já existe uma conta com este e-mail.'];
    }

    const responsavel = db.responsaveis.find((item) => item.id === responsavelId);
    if (responsavelId && !responsavel) {
      erros.responsavelId = ['Responsável não encontrado.'];
    }

    const instituicaoId = responsavel?.instituicaoId ?? sessao.instituicaoId;
    if (!instituicaoId) {
      erros.responsavelId = ['Não foi possível determinar a instituição do aluno.'];
    }
    if (
      sessao.tipoUsuario === 'PROFISSIONAL' &&
      responsavel &&
      responsavel.instituicaoId !== sessao.instituicaoId
    ) {
      erros.responsavelId = ['O responsável pertence a outra instituição.'];
    }

    if (Object.keys(erros).length > 0) return erroValidacao(erros);

    const id = proximoId(db.usuarios);
    const aluno: Aluno = {
      id,
      nome,
      email,
      tipoUsuario: 'ALUNO',
      instituicaoId,
      ativo: true,
      dataNascimento,
      observacoes,
      responsavelId: responsavelId as number,
    };

    db.usuarios.push(aluno);
    db.alunos.push(aluno);
    db.credenciais[email] = 'Sepa@2026';

    return HttpResponse.json(enriquecerAluno(aluno), { status: 201 });
  }),

  http.get('*/api/responsaveis/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();
    if (sessao.tipoUsuario !== 'PROFISSIONAL' && sessao.tipoUsuario !== 'ADMINISTRADOR') {
      return semPermissao();
    }
    const responsaveis = db.responsaveis.filter(
      (item) =>
        sessao.tipoUsuario === 'ADMINISTRADOR' || item.instituicaoId === sessao.instituicaoId,
    );
    return HttpResponse.json(
      responsaveis.map((item) => ({
        id: item.id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        instituicaoId: item.instituicaoId,
      })),
    );
  }),
];
