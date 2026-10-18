import { http, HttpResponse } from 'msw';
import type { Mensagem, MensagemDetalhada } from '@/shared/types';
import { db, nomeUsuario, proximoId } from '../db';
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

function detalhar(mensagem: Mensagem): MensagemDetalhada {
  return {
    ...mensagem,
    remetenteNome: nomeUsuario(mensagem.remetenteId),
    destinatarioNome: nomeUsuario(mensagem.destinatarioId),
  };
}

function envolvem(usuarioId: number, outraParte?: number): Mensagem[] {
  return db.mensagens.filter((mensagem) => {
    const participa = mensagem.remetenteId === usuarioId || mensagem.destinatarioId === usuarioId;
    if (!participa) return false;
    if (outraParte === undefined) return true;
    return mensagem.remetenteId === outraParte || mensagem.destinatarioId === outraParte;
  });
}

export const mensagensHandlers = [
  http.get('*/api/mensagens/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const comParam = urlDaRequisicao(request).searchParams.get('com');
    const com = numero(comParam);

    if (com !== null) {
      const conversa = envolvem(sessao.usuarioId, com)
        .sort((a, b) => a.dataEnvio.localeCompare(b.dataEnvio))
        .map(detalhar);
      return HttpResponse.json(conversa);
    }

    const todas = envolvem(sessao.usuarioId)
      .sort((a, b) => b.dataEnvio.localeCompare(a.dataEnvio))
      .map(detalhar);
    return HttpResponse.json(todas);
  }),

  http.post('*/api/mensagens/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const corpo = await corpoJson(request);
    const destinatarioId = numero(corpo.destinatarioId);
    const conteudoTexto = texto(corpo.conteudoTexto);

    const erros: Record<string, string[]> = {};
    if (!destinatarioId) erros.destinatarioId = ['Selecione o destinatário.'];
    if (conteudoTexto.length === 0) erros.conteudoTexto = ['Escreva uma mensagem.'];
    if (conteudoTexto.length > 4000) erros.conteudoTexto = ['Mensagem muito longa.'];

    const destinatario = db.usuarios.find((usuario) => usuario.id === destinatarioId);
    if (destinatarioId && !destinatario) {
      erros.destinatarioId = ['Destinatário não encontrado.'];
    }
    if (destinatarioId && destinatarioId === sessao.usuarioId) {
      erros.destinatarioId = ['Escolha outra pessoa para conversar.'];
    }
    if (destinatario && destinatario.instituicaoId !== sessao.instituicaoId) {
      return respostaErro('Não é possível enviar mensagens para outra instituição.', 403);
    }

    if (Object.keys(erros).length > 0) return erroValidacao(erros);

    const mensagem: Mensagem = {
      id: proximoId(db.mensagens),
      conteudoTexto,
      dataEnvio: new Date().toISOString(),
      remetenteId: sessao.usuarioId,
      destinatarioId: destinatarioId as number,
      lida: false,
    };
    db.mensagens.push(mensagem);
    return HttpResponse.json(detalhar(mensagem), { status: 201 });
  }),

  http.post('*/api/mensagens/:id/lida/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const mensagem = db.mensagens.find((item) => item.id === Number(params.id));
    if (!mensagem) return naoEncontrado('Mensagem');
    if (mensagem.destinatarioId !== sessao.usuarioId) return semPermissao();

    mensagem.lida = true;
    return HttpResponse.json(detalhar(mensagem));
  }),

  http.get('*/api/usuarios/:id/', async ({ request, params }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const usuario = db.usuarios.find((item) => item.id === Number(params.id));
    if (!usuario) return naoEncontrado('Usuário');
    const mesmoLocal =
      usuario.instituicaoId !== null && usuario.instituicaoId === sessao.instituicaoId;
    if (!mesmoLocal && usuario.id !== sessao.usuarioId) return semPermissao();

    return HttpResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      tipoUsuario: usuario.tipoUsuario,
      instituicaoId: usuario.instituicaoId,
    });
  }),
];
