import axios from 'axios';
import type {
  InstituicaoPublica,
  LoginResposta,
  RefreshResposta,
  SessaoUsuario,
} from '@/shared/types';
import { API_URL, apiClient, guardarSessao } from '@/shared/lib/api-client';
import { tokenStore } from '@/shared/lib/token-store';
import type { DadosCadastro, DadosLogin } from './schemas';

export async function entrar(dados: DadosLogin): Promise<SessaoUsuario> {
  const { data } = await apiClient.post<LoginResposta>('/auth/login/', dados);
  guardarSessao(data);
  return data.usuario;
}

export async function cadastrar(dados: DadosCadastro): Promise<SessaoUsuario> {
  const ehProfissional = dados.perfil !== 'RESPONSAVEL';
  const { data } = await apiClient.post<LoginResposta>('/auth/register/', {
    nome: dados.nome,
    email: dados.email,
    senha: dados.senha,
    instituicaoId: dados.instituicaoId,
    tipoUsuario: ehProfissional ? 'PROFISSIONAL' : 'RESPONSAVEL',
    especialidade: ehProfissional ? dados.perfil : undefined,
    registroProfissional: ehProfissional ? dados.registroProfissional : undefined,
    telefone: ehProfissional ? undefined : dados.telefone,
  });
  guardarSessao(data);
  return data.usuario;
}

export async function recuperarSessao(): Promise<SessaoUsuario | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<RefreshResposta>(`${API_URL}/auth/refresh/`, { refresh });
    tokenStore.setAccess(data.access);
    if (data.refresh) {
      tokenStore.setRefresh(data.refresh);
    }
    const resposta = await apiClient.get<{ usuario: SessaoUsuario }>('/me/');
    return resposta.data.usuario;
  } catch {
    tokenStore.clear();
    return null;
  }
}

export async function listarInstituicoesPublicas(): Promise<InstituicaoPublica[]> {
  const { data } = await apiClient.get<InstituicaoPublica[]>('/instituicoes/');
  return data;
}
