import { http, HttpResponse } from 'msw';
import type {
  DesempenhoPorAtividade,
  HistoricoAtividade,
  PontoCurva,
  RelatorioDesempenho,
  Tendencia,
} from '@/shared/types';
import { classificarTendencia, ewma, media, mediaMovel, slope } from '@/shared/lib/stats';
import { buscarAluno, buscarAtividade, db, nomeUsuario } from '../db';
import {
  aguardar,
  naoEncontrado,
  numero,
  obterSessao,
  semAutorizacao,
  semPermissao,
  texto,
  urlDaRequisicao,
} from '../lib/http';
import { podeVerAluno } from '../lib/rules';

function inicioDoDia(data: Date): Date {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function fimDoDia(data: Date): Date {
  const copia = new Date(data);
  copia.setHours(23, 59, 59, 999);
  return copia;
}

function pontosDaAtividade(registros: HistoricoAtividade[]): PontoCurva[] {
  const resultados = registros.map((registro) => registro.resultado);
  const medias = mediaMovel(resultados, 3);
  const suavizados = ewma(resultados, 3);
  return registros.map((registro, indice) => ({
    data: registro.dataHora,
    resultado: registro.resultado,
    mediaMovel: Number((medias[indice] ?? 0).toFixed(1)),
    ewma: Number((suavizados[indice] ?? 0).toFixed(1)),
  }));
}

export const relatoriosHandlers = [
  http.get('*/api/relatorios/desempenho/', async ({ request }) => {
    await aguardar();
    const sessao = obterSessao(request);
    if (!sessao) return semAutorizacao();

    const params = urlDaRequisicao(request).searchParams;
    const alunoId = numero(params.get('aluno'));
    if (!alunoId) return naoEncontrado('Aluno');

    const aluno = buscarAluno(alunoId);
    if (!aluno) return naoEncontrado('Aluno');
    if (!podeVerAluno(sessao, aluno)) return semPermissao();

    const hoje = new Date();
    const inicioParam = texto(params.get('inicio'));
    const fimParam = texto(params.get('fim'));
    const inicio = inicioParam ? inicioDoDia(new Date(`${inicioParam}T00:00:00`)) : new Date();
    if (!inicioParam) inicio.setDate(hoje.getDate() - 60);
    const fim = fimParam ? fimDoDia(new Date(`${fimParam}T00:00:00`)) : hoje;

    const registros = db.historico
      .filter((registro) => {
        if (registro.alunoId !== alunoId) return false;
        const data = new Date(registro.dataHora).getTime();
        return data >= inicio.getTime() && data <= fim.getTime();
      })
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora));

    const resultados = registros.map((registro) => registro.resultado);
    const coeficiente = slope(resultados);
    const tendenciaGeral: Tendencia = classificarTendencia(coeficiente);
    const mediaGeral = media(resultados);

    const porAtividade: DesempenhoPorAtividade[] = [];
    const idsAtividades = Array.from(new Set(registros.map((registro) => registro.atividadeId)));

    for (const atividadeId of idsAtividades) {
      const atividade = buscarAtividade(atividadeId);
      if (!atividade) continue;
      const registrosAtividade = registros.filter(
        (registro) => registro.atividadeId === atividadeId,
      );
      const valores = registrosAtividade.map((registro) => registro.resultado);
      porAtividade.push({
        atividadeId,
        titulo: atividade.titulo,
        nivelDificuldade: atividade.nivelDificuldade,
        mediaResultado: Number(media(valores).toFixed(1)),
        totalExecucoes: registrosAtividade.length,
        tendencia: classificarTendencia(slope(valores)),
        pontos: pontosDaAtividade(registrosAtividade),
      });
    }

    const relatorio: RelatorioDesempenho = {
      alunoId,
      alunoNome: nomeUsuario(alunoId),
      periodoInicio: inicio.toISOString(),
      periodoFim: fim.toISOString(),
      resumo: {
        mediaResultado: Number(mediaGeral.toFixed(1)),
        totalTentativas: registros.reduce((soma, registro) => soma + registro.tentativas, 0),
        totalExecucoes: registros.length,
        pedidosAjuda: registros.filter((registro) => registro.pediuAjuda).length,
        slope: Number(coeficiente.toFixed(2)),
        tendencia: tendenciaGeral,
      },
      porAtividade,
      alertaEstagnacao: registros.length > 0 && tendenciaGeral === 'ESTAGNACAO' && mediaGeral < 65,
      observacoes:
        registros.length === 0
          ? 'Não há execuções registradas no período selecionado.'
          : tendenciaGeral === 'EVOLUCAO'
            ? 'A curva mostra evolução consistente no período. Mantenha o plano e reavalie o nível das atividades.'
            : tendenciaGeral === 'REGRESSAO'
              ? 'A curva mostra queda nos resultados. Vale revisar dificuldade, contexto e apoio durante as atividades.'
              : 'A curva permanece estável no período. Considere ajustar o nível ou revisar as recomendações da IA.',
    };

    return HttpResponse.json(relatorio);
  }),
];
