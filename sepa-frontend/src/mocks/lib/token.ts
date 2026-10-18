import type { TipoUsuario } from '@/shared/types';

const SEGREDO = 'sepa-mock-signature';
export const ACCESS_TTL_SEGUNDOS = 120;
export const REFRESH_TTL_SEGUNDOS = 8 * 60 * 60;

export interface PayloadToken {
  sub: number;
  email: string;
  tipoUsuario: TipoUsuario;
  instituicaoId: number | null;
  tipo: 'access' | 'refresh';
  iat: number;
  exp: number;
}

function base64Url(valor: string): string {
  const bytes = new TextEncoder().encode(valor);
  let binario = '';
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(valor: string): string {
  const normalizado = valor.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizado.padEnd(Math.ceil(normalizado.length / 4) * 4, '=');
  const binario = atob(padding);
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function assinar(payload: string): string {
  let hash = 0;
  const conteudo = `${payload}.${SEGREDO}`;
  for (let indice = 0; indice < conteudo.length; indice += 1) {
    hash = (hash * 31 + conteudo.charCodeAt(indice)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function criarToken(
  usuario: { id: number; email: string; tipoUsuario: TipoUsuario; instituicaoId: number | null },
  tipo: 'access' | 'refresh',
  ttl: number,
): string {
  const agora = Math.floor(Date.now() / 1000);
  const payload: PayloadToken = {
    sub: usuario.id,
    email: usuario.email,
    tipoUsuario: usuario.tipoUsuario,
    instituicaoId: usuario.instituicaoId,
    tipo,
    iat: agora,
    exp: agora + ttl,
  };
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const corpo = base64Url(JSON.stringify(payload));
  const assinatura = assinar(`${header}.${corpo}`);
  return `${header}.${corpo}.${assinatura}`;
}

export function criarAccessToken(usuario: {
  id: number;
  email: string;
  tipoUsuario: TipoUsuario;
  instituicaoId: number | null;
}): string {
  return criarToken(usuario, 'access', ACCESS_TTL_SEGUNDOS);
}

export function criarRefreshToken(usuario: {
  id: number;
  email: string;
  tipoUsuario: TipoUsuario;
  instituicaoId: number | null;
}): string {
  return criarToken(usuario, 'refresh', REFRESH_TTL_SEGUNDOS);
}

export function decodificarToken(token: string): PayloadToken | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [header, corpo, assinatura] = partes;
  if (assinatura !== assinar(`${header}.${corpo}`)) return null;
  try {
    const payload = JSON.parse(deBase64Url(corpo)) as PayloadToken;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function lerTokenSemValidade(token: string): PayloadToken | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(deBase64Url(partes[1])) as PayloadToken;
  } catch {
    return null;
  }
}
