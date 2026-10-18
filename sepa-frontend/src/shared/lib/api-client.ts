import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { LoginResposta, RefreshResposta } from '@/shared/types';
import { tokenStore } from './token-store';

export const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const SESSION_EXPIRED_EVENT = 'sepa:session-expired';

interface ConfigComRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let promessaRefresh: Promise<string> | null = null;

async function renovarAccessToken(): Promise<string> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error('Sessão expirada.');
  const { data } = await axios.post<RefreshResposta>(`${API_URL}/auth/refresh/`, { refresh });
  tokenStore.setAccess(data.access);
  return data.access;
}

apiClient.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError) => {
    const config = erro.config as ConfigComRetry | undefined;
    const url = config?.url ?? '';
    const ehRotaDeAutenticacao =
      url.includes('/auth/login/') || url.includes('/auth/refresh/') || url.includes('/auth/register/');

    if (erro.response?.status !== 401 || !config || config._retry || ehRotaDeAutenticacao) {
      return Promise.reject(erro);
    }

    config._retry = true;
    try {
      promessaRefresh ??= renovarAccessToken().finally(() => {
        promessaRefresh = null;
      });
      const access = await promessaRefresh;
      config.headers.Authorization = `Bearer ${access}`;
      return await apiClient(config);
    } catch (erroRefresh) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return Promise.reject(erroRefresh);
    }
  },
);

export function guardarSessao(resposta: LoginResposta): void {
  tokenStore.setAccess(resposta.access);
  tokenStore.setRefresh(resposta.refresh);
}

function primeiroValor(registro: Record<string, unknown>): string | null {
  for (const valor of Object.values(registro)) {
    if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0];
    if (typeof valor === 'string') return valor;
  }
  return null;
}

export function getApiErrorMessage(
  erro: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  if (axios.isAxiosError(erro)) {
    const dados = erro.response?.data;
    if (typeof dados === 'string' && dados.trim()) return dados;
    if (dados && typeof dados === 'object') {
      const registro = dados as Record<string, unknown>;
      if (typeof registro.detail === 'string') return registro.detail;
      const mensagem = primeiroValor(registro);
      if (mensagem) return mensagem;
    }
    if (erro.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
  }
  return fallback;
}

/** Converte o corpo DRF `{ campo: ["mensagem"] }` em erros por campo. */
export function getApiFieldErrors(erro: unknown): Record<string, string> {
  if (!axios.isAxiosError(erro)) return {};
  const dados = erro.response?.data;
  if (!dados || typeof dados !== 'object') return {};
  const registro = dados as Record<string, unknown>;
  const resultado: Record<string, string> = {};
  for (const [campo, valor] of Object.entries(registro)) {
    if (Array.isArray(valor) && typeof valor[0] === 'string') {
      resultado[campo] = valor[0];
    } else if (typeof valor === 'string') {
      resultado[campo] = valor;
    }
  }
  return resultado;
}
