"""Serviço de relatórios analíticos (RF-005/RF-006)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any

from django.utils import timezone

from apps.execucao.models import HistoricoAtividade
from apps.relatorios.statistics import (
    classificar_tendencia,
    ewma,
    media,
    media_movel,
    round_1,
    round_2,
    slope,
)
from apps.usuarios.models import Aluno


def periodo_padrao() -> tuple[date, date]:
    hoje = timezone.localdate()
    return hoje - timedelta(days=60), hoje


def _limites(inicio: date, fim: date) -> tuple[datetime, datetime]:
    tz = timezone.get_current_timezone()
    return (
        timezone.make_aware(datetime.combine(inicio, time.min), tz),
        timezone.make_aware(datetime.combine(fim, time.max), tz),
    )


def historicos_do_periodo(aluno: Aluno, inicio: date, fim: date):
    inicio_dt, fim_dt = _limites(inicio, fim)
    return HistoricoAtividade.objects.filter(
        aluno=aluno,
        data_hora__gte=inicio_dt,
        data_hora__lte=fim_dt,
    ).order_by("data_hora", "id")


def resumo_aluno(aluno: Aluno, limite: int = 10) -> tuple[float, str]:
    """Média recente e tendência usadas no AlunoResumo."""
    valores = list(
        HistoricoAtividade.objects.filter(aluno=aluno)
        .order_by("-data_hora", "-id")
        .values_list("resultado", flat=True)[:limite]
    )
    valores.reverse()
    return round_1(media(valores)), classificar_tendencia(slope(valores))


def _pontos(registros: list[HistoricoAtividade]) -> list[dict[str, Any]]:
    valores = [registro.resultado for registro in registros]
    medias = media_movel(valores, 3)
    suavizados = ewma(valores, 3)
    return [
        {
            "data": registro.data_hora,
            "resultado": registro.resultado,
            "media_movel": round_1(medias[indice]),
            "ewma": round_1(suavizados[indice]),
        }
        for indice, registro in enumerate(registros)
    ]


def gerar_relatorio(
    aluno: Aluno,
    *,
    inicio: date | None = None,
    fim: date | None = None,
) -> dict[str, Any]:
    inicio_padrao, fim_padrao = periodo_padrao()
    inicio = inicio or inicio_padrao
    fim = fim or fim_padrao
    if inicio > fim:
        inicio, fim = fim, inicio

    registros = list(historicos_do_periodo(aluno, inicio, fim))
    valores = [registro.resultado for registro in registros]
    coeficiente = slope(valores)
    tendencia = classificar_tendencia(coeficiente)
    media_geral = media(valores)

    por_atividade: list[dict[str, Any]] = []
    atividades_ids = sorted({registro.atividade_id for registro in registros})
    for atividade_id in atividades_ids:
        registros_atividade = [
            registro for registro in registros if registro.atividade_id == atividade_id
        ]
        atividade = registros_atividade[0].atividade
        valores_atividade = [registro.resultado for registro in registros_atividade]
        por_atividade.append(
            {
                "atividade_id": atividade_id,
                "titulo": atividade.titulo,
                "nivel_dificuldade": atividade.nivel_dificuldade,
                "media_resultado": round_1(media(valores_atividade)),
                "total_execucoes": len(registros_atividade),
                "tendencia": classificar_tendencia(slope(valores_atividade)),
                "pontos": _pontos(registros_atividade),
            }
        )

    if not registros:
        observacoes = "Não há execuções registradas no período selecionado."
    elif tendencia == "EVOLUCAO":
        observacoes = (
            "A curva mostra evolução consistente no período. "
            "Mantenha o plano e reavalie o nível das atividades."
        )
    elif tendencia == "REGRESSAO":
        observacoes = (
            "A curva mostra queda nos resultados. "
            "Vale revisar dificuldade, contexto e apoio durante as atividades."
        )
    else:
        observacoes = (
            "A curva permanece estável no período. "
            "Considere ajustar o nível ou revisar as recomendações da IA."
        )

    return {
        "aluno_id": aluno.pk,
        "aluno_nome": aluno.usuario.nome,
        "periodo_inicio": _limites(inicio, inicio)[0],
        "periodo_fim": _limites(fim, fim)[1],
        "resumo": {
            "media_resultado": round_1(media_geral),
            "total_tentativas": sum(registro.tentativas for registro in registros),
            "total_execucoes": len(registros),
            "pedidos_ajuda": sum(1 for registro in registros if registro.pediu_ajuda),
            "slope": round_2(coeficiente),
            "tendencia": tendencia,
        },
        "por_atividade": por_atividade,
        "alerta_estagnacao": bool(registros and tendencia == "ESTAGNACAO" and media_geral < 65),
        "observacoes": observacoes,
    }
