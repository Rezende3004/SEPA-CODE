"""Engenharia de features do módulo de IA (sem identificadores pessoais)."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from apps.execucao.models import HistoricoAtividade
from apps.relatorios.statistics import media, round_2, slope

FEATURES = [
    "media_resultado",
    "media_tentativas",
    "tempo_medio_resposta",
    "taxa_pedidos_ajuda",
    "slope",
]

FEATURE_LABELS = {
    "media_resultado": "Média de resultados",
    "media_tentativas": "Tentativas por sessão",
    "tempo_medio_resposta": "Tempo médio de resposta",
    "taxa_pedidos_ajuda": "Taxa de pedidos de ajuda",
    "slope": "Tendência (slope)",
}


def extrair_features(historicos: Iterable[HistoricoAtividade]) -> dict[str, float]:
    registros = list(historicos)
    resultados = [float(registro.resultado) for registro in registros]
    tentativas = [float(registro.tentativas) for registro in registros]
    tempos = [float(registro.tempo_resposta_seg) for registro in registros]
    ajudas = [1.0 if registro.pediu_ajuda else 0.0 for registro in registros]
    return {
        "media_resultado": round_2(media(resultados)),
        "media_tentativas": round_2(media(tentativas)),
        "tempo_medio_resposta": round_2(media(tempos)),
        "taxa_pedidos_ajuda": round_2(media(ajudas)),
        "slope": round_2(slope(resultados)),
    }


def features_do_aluno(aluno) -> dict[str, float]:
    return extrair_features(
        HistoricoAtividade.objects.filter(aluno=aluno).order_by("data_hora", "id")
    )


def vetor_features(features: dict[str, float]) -> list[float]:
    return [float(features[nome]) for nome in FEATURES]


def features_por_atividade(aluno) -> dict[int, dict[str, float]]:
    resultado: dict[int, dict[str, float]] = {}
    for atividade_id in (
        HistoricoAtividade.objects.filter(aluno=aluno)
        .values_list("atividade_id", flat=True)
        .distinct()
    ):
        registros = HistoricoAtividade.objects.filter(
            aluno=aluno, atividade_id=atividade_id
        ).order_by("data_hora", "id")
        resultado[atividade_id] = extrair_features(registros)
    return resultado


def rotulo_delta(delta: int) -> str:
    if delta > 0:
        return "aumentar"
    if delta < 0:
        return "diminuir"
    return "manter"


def features_formatadas(features: dict[str, float]) -> dict[str, Any]:
    return {FEATURE_LABELS[nome]: valor for nome, valor in features.items()}
