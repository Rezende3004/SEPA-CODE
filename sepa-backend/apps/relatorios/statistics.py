"""Funções estatísticas puras compartilhadas por relatórios e IA."""

from __future__ import annotations

from collections.abc import Sequence


def media(valores: Sequence[float]) -> float:
    if not valores:
        return 0.0
    return sum(valores) / len(valores)


def media_movel(valores: Sequence[float], janela: int = 3) -> list[float]:
    """Média móvel progressiva (usa a janela disponível no início)."""
    resultado: list[float] = []
    for indice in range(len(valores)):
        inicio = max(0, indice - janela + 1)
        resultado.append(media(valores[inicio : indice + 1]))
    return resultado


def ewma(valores: Sequence[float], span: int = 3) -> list[float]:
    """Média ponderada exponencial, equivalente ao protótipo (span=3)."""
    if not valores:
        return []
    alpha = 2 / (span + 1)
    resultado: list[float] = []
    anterior = float(valores[0])
    for valor in valores:
        anterior = alpha * float(valor) + (1 - alpha) * anterior
        resultado.append(anterior)
    return resultado


def slope(valores: Sequence[float]) -> float:
    """Coeficiente angular por regressão linear simples, x = 0..n-1."""
    if len(valores) < 2:
        return 0.0
    n = len(valores)
    media_x = (n - 1) / 2
    media_y = media(valores)
    numerador = sum((indice - media_x) * (valor - media_y) for indice, valor in enumerate(valores))
    denominador = sum((indice - media_x) ** 2 for indice in range(n))
    if denominador == 0:
        return 0.0
    return numerador / denominador


def classificar_tendencia(coeficiente: float) -> str:
    """Limiares em pontos percentuais por sessão, iguais aos do frontend."""
    if coeficiente >= 1:
        return "EVOLUCAO"
    if coeficiente <= -1:
        return "REGRESSAO"
    return "ESTAGNACAO"


def round_1(valor: float) -> float:
    return round(float(valor), 1)


def round_2(valor: float) -> float:
    return round(float(valor), 2)
