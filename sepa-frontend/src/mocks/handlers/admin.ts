import { http, HttpResponse } from 'msw';
import type { Profissional, Usuario } from '@/shared/types';
import { db, proximoId } from '../db';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function exigirAdmin(request: Request) {
  const sessao = obterSessao(request);
  if (!sessao) return { erro: semAutorizacao() };
  if (sessao.tipoUsuario !== 'ADMINISTRADOR') return { erro: semPermissao() };
  return { sessao };
}

function detalharProfissional(profissional: Profissional) {
  const instituicao = db.instituicoes.find((item) => item.id === profissional.instituicaoId);
  return {
    ...profissional,
    instituicaoNome: instituicao?.nomeFantasia ?? '',
  };
}

export const adminHandlers = [
  http.get('*/api/admin/instituicoes/', async ({ request }) => {
    await aguardar();
    const { erro } = exigirAdmin(request);
    if (erro) return erro;
    return HttpResponse.json(db.instituicoes);
  }),

  http.patch('*/api/admin/instituicoes/:id/', async ({ request, params }) => {
    await aguardar();
    const { erro } = exigirAdmin(request);
    if (erro) return erro;

    const instituicao = db.instituicoes.find((item) => item.id === Number(params.id));
    if (!instituicao) return naoEncontrado('Instituição');

    const corpo = await corpoJson(request);
    const status = texto(corpo.statusAssinatura);
    if (!['ATIVA', 'SUSPENSA', 'TESTE'].includes(status)) {
      return erroValidacao({ statusAssinatura: ['Status de assinatura inválido.'] });
    }
    instituicao.statusAssinatura = status as typeof instituicao.statusAssinatura;
    return HttpResponse.json(instituicao);
  }),

  http.get('*/api/admin/profissionais/', async ({ request }) => {
    await aguardar();
    const { erro } = exigirAdmin(request);
    if (erro) return erro;
    return HttpResponse.json(db.profissionais.map(detalharProfissional));
  }),

  http.post('*/api/admin/profissionais/', async ({ request }) => {
    await aguardar();
    const { erro } = exigirAdmin(request);
    if (erro) return erro;

    const corpo = await corpoJson(request);
    const nome = texto(corpo.nome);
    const email = texto(corpo.email).toLowerCase();
    const senha = texto(corpo.senha);
    const especialidade = texto(corpo.especialidade);
    const registroProfissional = texto(corpo.registroProfissional);
    const instituicaoId = numero(corpo.instituicaoId);

    const erros: Record<string, string[]> = {};
    if (nome.length < 3) erros.nome = ['Informe o nome completo.'];
    if (!EMAIL_REGEX.test(email)) erros.email = ['Informe um e-mail válido.'];
    if (senha.length < 8) erros.senha = ['A senha deve ter pelo menos 8 caracteres.'];
    if (!['PSICOLOGO', 'FONOAUDIOLOGO', 'PEDAGOGO'].includes(especialidade)) {
      erros.especialidade = ['Selecione a especialidade.'];
    }
    if (!registroProfissional) erros.registroProfissional = ['Informe o registro profissional.'];
    if (!instituicaoId || !db.instituicoes.some((item) => item.id === instituicaoId)) {
      erros.instituicaoId = ['Selecione a instituição.'];
    }
    if (db.usuarios.some((item) => item.email.toLowerCase() === email)) {
      erros.email = ['Já existe uma conta com este e-mail.'];
    }
    if (Object.keys(erros).length > 0) return erroValidacao(erros);

    const base: Usuario = {
      id: proximoId(db.usuarios),
      nome,
      email,
      tipoUsuario: 'PROFISSIONAL',
      instituicaoId: instituicaoId as number,
      ativo: true,
    };
    const profissional: Profissional = {
      ...base,
      tipoUsuario: 'PROFISSIONAL',
      especialidade: especialidade as Profissional['especialidade'],
      registroProfissional,
    };
    db.usuarios.push(profissional);
    db.profissionais.push(profissional);
    db.credenciais[email] = senha;

    return HttpResponse.json(detalharProfissional(profissional), { status: 201 });
  }),

  http.patch('*/api/admin/profissionais/:id/', async ({ request, params }) => {
    await aguardar();
    const { erro } = exigirAdmin(request);
    if (erro) return erro;

    const profissional = db.profissionais.find((item) => item.id === Number(params.id));
    if (!profissional) return naoEncontrado('Profissional');

    const corpo = await corpoJson(request);
    if (corpo.ativo !== undefined) {
      const ativo = Boolean(corpo.ativo);
      profissional.ativo = ativo;
      const usuario = db.usuarios.find((item) => item.id === profissional.id);
      if (usuario) usuario.ativo = ativo;
    }
    if (corpo.nome !== undefined) profissional.nome = texto(corpo.nome);
    if (corpo.especialidade !== undefined) {
      const especialidade = texto(corpo.especialidade);
      if (['PSICOLOGO', 'FONOAUDIOLOGO', 'PEDAGOGO'].includes(especialidade)) {
        profissional.especialidade = especialidade as Profissional['especialidade'];
      }
    }

    return HttpResponse.json(detalharProfissional(profissional));
  }),
];
