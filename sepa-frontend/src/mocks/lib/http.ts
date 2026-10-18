import { HttpResponse } from 'msw';
import type { TipoUsuario } from '@/shared/types';
import { db } from '../db';
import { decodificarToken } from './token';

export const LATENCIA_MS = import.meta.env.MODE === 'test' ? 0 : 220;

export function aguardar(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, LATENCIA_MS);
  });
}

export interface SessaoMock {
  usuarioId: number;
  email: string;
  tipoUsuario: TipoUsuario;
  instituicaoId: number | null;
}

export function obterSessao(request: Request): SessaoMock | null {
  const cabecalho = request.headers.get('Authorization');
  if (!cabecalho?.startsWith('Bearer ')) return null;
  const payload = decodificarToken(cabecalho.slice(7));
  if (!payload || payload.tipo !== 'access') return null;
  const usuario = db.usuarios.find((item) => item.id === payload.sub);
  if (!usuario || !usuario.ativo) return null;
  return {
    usuarioId: usuario.id,
    email: usuario.email,
    tipoUsuario: usuario.tipoUsuario,
    instituicaoId: usuario.instituicaoId,
  };
}

export function respostaErro(detail: string, status: number) {
  return HttpResponse.json({ detail }, { status });
}

export function erroValidacao(campos: Record<string, string[]>) {
  return HttpResponse.json(campos, { status: 400 });
}

export const semAutorizacao = () =>
  respostaErro('As credenciais de autenticação não foram fornecidas ou expiraram.', 401);

export const semPermissao = () =>
  respostaErro('Você não tem permissão para acessar este recurso.', 403);

export const naoEncontrado = (recurso = 'Recurso') =>
  respostaErro(`${recurso} não encontrado.`, 404);

export const somenteLeitura = () => respostaErro('Operação não permitida para este perfil.', 403);

export async function corpoJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const corpo = (await request.json()) as unknown;
    if (corpo && typeof corpo === 'object') return corpo as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function numero(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const convertido = Number(valor);
    if (Number.isFinite(convertido)) return convertido;
  }
  return null;
}

export function urlDaRequisicao(request: Request): URL {
  return new URL(request.url);
}
