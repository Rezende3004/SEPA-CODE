import { http, HttpResponse } from 'msw';
import type {
  Especialidade,
  Profissional,
  Responsavel,
  SessaoUsuario,
  Usuario,
} from '@/shared/types';
import { db, proximoId } from '../db';
import { aguardar, corpoJson, erroValidacao, obterSessao, respostaErro, texto } from '../lib/http';
import { criarAccessToken, criarRefreshToken, decodificarToken } from '../lib/token';

export function montarSessao(usuario: Usuario): SessaoUsuario {
  const instituicao = db.instituicoes.find((item) => item.id === usuario.instituicaoId);
  const sessao: SessaoUsuario = {
    ...usuario,
    instituicaoNome: instituicao?.nomeFantasia ?? null,
  };

  if (usuario.tipoUsuario === 'PROFISSIONAL') {
    const perfil = db.profissionais.find((item) => item.id === usuario.id);
    if (perfil) {
      sessao.especialidade = perfil.especialidade;
      sessao.registroProfissional = perfil.registroProfissional;
    }
  }

  if (usuario.tipoUsuario === 'RESPONSAVEL') {
    const perfil = db.responsaveis.find((item) => item.id === usuario.id);
    if (perfil) sessao.telefone = perfil.telefone;
  }

  if (usuario.tipoUsuario === 'ALUNO') {
    const perfil = db.alunos.find((item) => item.id === usuario.id);
    if (perfil) {
      sessao.dataNascimento = perfil.dataNascimento;
      sessao.responsavelId = perfil.responsavelId;
    }
  }

  return sessao;
}

function respostaAutenticacao(usuario: Usuario, status = 200) {
  return HttpResponse.json(
    {
      access: criarAccessToken(usuario),
      refresh: criarRefreshToken(usuario),
      usuario: montarSessao(usuario),
    },
    { status },
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authHandlers = [
  http.post('*/api/auth/login/', async ({ request }) => {
    await aguardar();
    const corpo = await corpoJson(request);
    const email = texto(corpo.email).toLowerCase();
    const senha = texto(corpo.senha);
    const usuario = db.usuarios.find((item) => item.email.toLowerCase() === email);

    if (!usuario || db.credenciais[usuario.email] !== senha) {
      return respostaErro('E-mail ou senha inválidos.', 401);
    }
    if (!usuario.ativo) {
      return respostaErro('Esta conta está desativada. Procure o administrador.', 403);
    }
    if (usuario.instituicaoId) {
      const instituicao = db.instituicoes.find((item) => item.id === usuario.instituicaoId);
      if (instituicao?.statusAssinatura === 'SUSPENSA') {
        return respostaErro('A assinatura da instituição está suspensa.', 403);
      }
    }

    return respostaAutenticacao(usuario);
  }),

  http.post('*/api/auth/refresh/', async ({ request }) => {
    await aguardar();
    const corpo = await corpoJson(request);
    const refresh = texto(corpo.refresh);
    const payload = decodificarToken(refresh);
    if (!payload || payload.tipo !== 'refresh') {
      return respostaErro('Token de atualização inválido ou expirado.', 401);
    }
    const usuario = db.usuarios.find((item) => item.id === payload.sub);
    if (!usuario || !usuario.ativo) {
      return respostaErro('Sessão inválida.', 401);
    }
    return HttpResponse.json({ access: criarAccessToken(usuario) });
  }),

  http.post('*/api/auth/register/', async ({ request }) => {
    await aguardar();
    const corpo = await corpoJson(request);
    const nome = texto(corpo.nome);
    const email = texto(corpo.email).toLowerCase();
    const senha = texto(corpo.senha);
    const tipoUsuario = texto(corpo.tipoUsuario);
    const instituicaoId = Number(corpo.instituicaoId);

    const erros: Record<string, string[]> = {};
    if (nome.length < 3) erros.nome = ['Informe o nome completo.'];
    if (!EMAIL_REGEX.test(email)) erros.email = ['Informe um e-mail válido.'];
    if (senha.length < 8) erros.senha = ['A senha deve ter pelo menos 8 caracteres.'];
    if (tipoUsuario !== 'PROFISSIONAL' && tipoUsuario !== 'RESPONSAVEL') {
      erros.tipoUsuario = ['Selecione o perfil de acesso.'];
    }
    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      erros.instituicaoId = ['Selecione a instituição.'];
    }
    if (db.usuarios.some((item) => item.email.toLowerCase() === email)) {
      erros.email = ['Já existe uma conta com este e-mail.'];
    }
    const instituicao = db.instituicoes.find((item) => item.id === instituicaoId);
    if (!instituicao) {
      erros.instituicaoId = ['Instituição não encontrada.'];
    } else if (instituicao.statusAssinatura !== 'ATIVA') {
      erros.instituicaoId = ['A instituição não está com a assinatura ativa.'];
    }

    if (tipoUsuario === 'PROFISSIONAL') {
      const especialidade = texto(corpo.especialidade);
      if (!['PSICOLOGO', 'FONOAUDIOLOGO', 'PEDAGOGO'].includes(especialidade)) {
        erros.especialidade = ['Selecione a especialidade.'];
      }
      if (!texto(corpo.registroProfissional)) {
        erros.registroProfissional = ['Informe o registro profissional.'];
      }
    }
    if (tipoUsuario === 'RESPONSAVEL' && !texto(corpo.telefone)) {
      erros.telefone = ['Informe o telefone de contato.'];
    }

    if (Object.keys(erros).length > 0) return erroValidacao(erros);

    const id = proximoId(db.usuarios);
    const base: Usuario = {
      id,
      nome,
      email,
      tipoUsuario: tipoUsuario as 'PROFISSIONAL' | 'RESPONSAVEL',
      instituicaoId,
      ativo: true,
    };

    let novoUsuario: Usuario = base;
    if (tipoUsuario === 'PROFISSIONAL') {
      const profissional: Profissional = {
        ...base,
        tipoUsuario: 'PROFISSIONAL',
        especialidade: texto(corpo.especialidade) as Especialidade,
        registroProfissional: texto(corpo.registroProfissional),
      };
      db.profissionais.push(profissional);
      novoUsuario = profissional;
    } else {
      const responsavel: Responsavel = {
        ...base,
        tipoUsuario: 'RESPONSAVEL',
        telefone: texto(corpo.telefone),
      };
      db.responsaveis.push(responsavel);
      novoUsuario = responsavel;
    }

    db.usuarios.push(novoUsuario);
    db.credenciais[email] = senha;
    return respostaAutenticacao(novoUsuario, 201);
  }),

  http.get('*/api/me/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return HttpResponse.json({ detail: 'Não autenticado.' }, { status: 401 });
    const usuario = db.usuarios.find((item) => item.id === sessao.usuarioId);
    if (!usuario) return HttpResponse.json({ detail: 'Não autenticado.' }, { status: 401 });
    return HttpResponse.json({ usuario: montarSessao(usuario) });
  }),
];
