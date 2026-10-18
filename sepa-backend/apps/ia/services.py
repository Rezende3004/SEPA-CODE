"""Serviço de análise e recomendações (RF-009/RN-004)."""

from __future__ import annotations

import numpy as np
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from xgboost import DMatrix

from apps.atividades.models import Atividade
from apps.execucao.models import HistoricoAtividade
from apps.ia.features import (
    FEATURE_LABELS,
    FEATURES,
    features_do_aluno,
    rotulo_delta,
    vetor_features,
)
from apps.ia.models import AnaliseAprendizado, RecomendacaoIA
from apps.ia.training import carregar_modelo
from apps.planos.models import Contem
from apps.relatorios.statistics import classificar_tendencia, media, round_1, round_2
from apps.usuarios.models import Aluno, Usuario
from common.exceptions import Conflict
from common.permissions import can_decide_recomendacao
from common.services import registrar_auditoria

DELTA_POR_CLASSE = {0: -1, 1: 0, 2: 1}
PESOS_HEURISTICOS = {
    "media_resultado": 0.32,
    "slope": 0.26,
    "media_tentativas": 0.18,
    "taxa_pedidos_ajuda": 0.14,
    "tempo_medio_resposta": 0.1,
}


def _heuristico(features: dict[str, float]) -> int:
    if (
        features["media_resultado"] >= 75
        and features["slope"] >= 0.5
        and features["taxa_pedidos_ajuda"] <= 0.35
    ):
        return 2
    if (
        features["media_resultado"] < 55
        or features["slope"] <= -0.5
        or (features["media_tentativas"] >= 3.5 and features["taxa_pedidos_ajuda"] >= 0.5)
    ):
        return 0
    return 1


def prever_classe(features: dict[str, float]) -> tuple[int, object | None]:
    modelo = carregar_modelo()
    if modelo is None:
        return _heuristico(features), None
    valores = np.array([vetor_features(features)], dtype=float)
    try:
        classe = int(modelo.predict(valores)[0])
    except Exception:  # noqa: BLE001
        return _heuristico(features), None
    return classe, modelo


def _contribuicoes_modelo(modelo, features: dict[str, float]) -> list[float]:
    valores = DMatrix(np.array([vetor_features(features)], dtype=float))
    contribuicoes = np.asarray(
        modelo.get_booster().predict(valores, pred_contribs=True), dtype=float
    )
    # XGBoost multiclasse retorna (1, classes, features+viés); binário, (1, features+viés).
    matriz = contribuicoes[0]
    if matriz.ndim == 2:
        if matriz.shape[1] == len(FEATURES) + 1:
            contribuicoes = np.abs(matriz[:, : len(FEATURES)]).sum(axis=0)
        else:
            contribuicoes = np.abs(matriz[: len(FEATURES), :]).sum(axis=1)
    else:
        contribuicoes = np.abs(matriz[: len(FEATURES)])
    total = float(contribuicoes.sum())
    if total <= 0:
        importances = np.asarray(modelo.feature_importances_, dtype=float)
        total = float(importances.sum())
        return list(importances / total) if total > 0 else [1 / len(FEATURES)] * len(FEATURES)
    return list(contribuicoes / total)


def explicar(features: dict[str, float], modelo) -> list[dict]:
    if modelo is not None:
        try:
            pesos = _contribuicoes_modelo(modelo, features)
        except Exception:  # noqa: BLE001
            pesos = [PESOS_HEURISTICOS[nome] for nome in FEATURES]
    else:
        pesos = [PESOS_HEURISTICOS[nome] for nome in FEATURES]

    return [
        {
            "metrica": FEATURE_LABELS[nome],
            "valor": round_2(features[nome]),
            "peso": round(float(peso) / max(sum(pesos), 1e-9), 4),
        }
        for nome, peso in zip(FEATURES, pesos, strict=True)
    ]


def _atividades_do_aluno(aluno: Aluno) -> list[Atividade]:
    return list(
        Atividade.objects.filter(planos__aluno=aluno)
        .distinct()
        .prefetch_related("itens", "conteudos")
        .order_by("nivel_dificuldade", "id")
    )


def _descricao(
    aluno: Aluno, delta: int, features: dict[str, float], nivel_atual: int, nivel_sugerido: int
) -> str:
    if delta > 0:
        return (
            f"{aluno.usuario.nome} apresenta média de {features['media_resultado']:.1f}%, "
            f"tendência de {features['slope']:.2f} ponto(s) por sessão e baixa taxa de ajuda. "
            f"A sugestão é avançar do nível {nivel_atual} para o nível {nivel_sugerido}."
        )
    if delta < 0:
        return (
            f"{aluno.usuario.nome} apresenta média de {features['media_resultado']:.1f}%, "
            f"tendência de {features['slope']:.2f} ponto(s) por sessão e "
            f"{features['taxa_pedidos_ajuda'] * 100:.0f}% de pedidos de ajuda. "
            f"A sugestão é consolidar a base no nível {nivel_sugerido}."
        )
    return (
        f"{aluno.usuario.nome} está com média de {features['media_resultado']:.1f}% e "
        f"tendência estável ({features['slope']:.2f} ponto(s) por sessão). "
        f"A recomendação é manter o nível {nivel_atual} e observar as próximas sessões."
    )


@transaction.atomic
def analisar_aluno(
    aluno: Aluno, executante: Usuario, request=None
) -> tuple[AnaliseAprendizado, RecomendacaoIA]:
    historicos = list(HistoricoAtividade.objects.filter(aluno=aluno).order_by("data_hora", "id"))
    if not historicos:
        raise ValidationError({"aluno": ["O aluno ainda não possui histórico suficiente."]})

    features = features_do_aluno(aluno)
    classe, modelo = prever_classe(features)
    delta = DELTA_POR_CLASSE.get(classe, 0)
    atividades = _atividades_do_aluno(aluno)
    niveis_atribuidos = list(
        Contem.objects.filter(
            plano__aluno=aluno,
            atividade_id__in=[atividade.id for atividade in atividades],
        ).values_list("nivel_atribuido", flat=True)
    )
    nivel_atual = max(niveis_atribuidos, default=1)
    nivel_sugerido = max(1, min(5, nivel_atual + delta))
    tendencia = classificar_tendencia(features["slope"])
    pontuacao = round_1(media([float(h.resultado) for h in historicos]))
    descricao_tendencia = {
        "EVOLUCAO": "ganho consistente ao longo das sessões",
        "REGRESSAO": "queda nos resultados recentes",
        "ESTAGNACAO": "estabilidade sem ganho consistente",
    }[tendencia]
    analise = AnaliseAprendizado.objects.create(
        aluno=aluno,
        pontuacao_curva=pontuacao,
        tendencia=tendencia,
        observacoes_ia=(
            f"Análise de {len(historicos)} sessões: {descricao_tendencia}. "
            f"Média de {features['media_resultado']:.1f}%, "
            f"{features['media_tentativas']:.1f} tentativa(s) por sessão e "
            f"tendência de {features['slope']:.2f} ponto(s) por sessão."
        ),
    )
    recomendacao = RecomendacaoIA.objects.create(
        analise=analise,
        descricao_recomendacao=_descricao(aluno, delta, features, nivel_atual, nivel_sugerido),
        status=RecomendacaoIA.Status.PENDENTE,
        nivel_atual=nivel_atual,
        nivel_sugerido=nivel_sugerido,
        fatores=explicar(features, modelo),
    )
    recomendacao.atividades.set(atividades[:2])
    registrar_auditoria(
        usuario=executante,
        acao="gerar_recomendacao",
        objeto=recomendacao,
        detalhes={"classe": rotulo_delta(delta), "modelo": modelo is not None},
        request=request,
    )
    return analise, recomendacao


@transaction.atomic
def aceitar_recomendacao(
    recomendacao: RecomendacaoIA, executante: Usuario, request=None
) -> RecomendacaoIA:
    if not can_decide_recomendacao(executante, recomendacao):
        raise PermissionDenied(
            "Somente um profissional da instituição do aluno pode aceitar esta recomendação (RN-004)."
        )
    if recomendacao.status != RecomendacaoIA.Status.PENDENTE:
        raise Conflict("Esta recomendação já foi decidida.")
    nivel = max(1, min(5, recomendacao.nivel_sugerido))
    # O catálogo permanece intacto: o nível é atribuído apenas às atividades
    # dos planos do aluno desta recomendação.
    atividade_ids = list(recomendacao.atividades.values_list("id", flat=True))
    Contem.objects.filter(
        plano__aluno=recomendacao.analise.aluno,
        atividade_id__in=atividade_ids,
    ).update(nivel_atribuido=nivel)
    recomendacao.status = RecomendacaoIA.Status.ACEITA
    recomendacao.nivel_atual = nivel
    recomendacao.decidido_por = executante
    recomendacao.decidido_em = timezone.now()
    recomendacao.save(update_fields=["status", "nivel_atual", "decidido_por", "decidido_em"])
    registrar_auditoria(
        usuario=executante,
        acao="aceitar_recomendacao",
        objeto=recomendacao,
        detalhes={"nivelAplicado": nivel},
        request=request,
    )
    return recomendacao


@transaction.atomic
def rejeitar_recomendacao(
    recomendacao: RecomendacaoIA, executante: Usuario, request=None
) -> RecomendacaoIA:
    if not can_decide_recomendacao(executante, recomendacao):
        raise PermissionDenied(
            "Somente um profissional da instituição do aluno pode rejeitar esta recomendação (RN-004)."
        )
    if recomendacao.status != RecomendacaoIA.Status.PENDENTE:
        raise Conflict("Esta recomendação já foi decidida.")
    recomendacao.status = RecomendacaoIA.Status.REJEITADA
    recomendacao.decidido_por = executante
    recomendacao.decidido_em = timezone.now()
    recomendacao.save(update_fields=["status", "decidido_por", "decidido_em"])
    registrar_auditoria(
        usuario=executante,
        acao="rejeitar_recomendacao",
        objeto=recomendacao,
        request=request,
    )
    return recomendacao
