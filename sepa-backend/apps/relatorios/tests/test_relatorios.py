from __future__ import annotations

import pytest

from apps.relatorios.statistics import (
    classificar_tendencia,
    ewma,
    media,
    media_movel,
    slope,
)


def test_media_e_media_movel():
    assert media([10, 20, 30]) == 20
    assert media_movel([10, 20, 30, 40], 3) == [10, 15, 20, 30]


def test_ewma_e_slope():
    assert ewma([10, 20, 30], 3) == [10, 15, 22.5]
    assert slope([10, 20, 30, 40]) == pytest.approx(10)
    assert slope([40, 30, 20, 10]) == pytest.approx(-10)


def test_classificacao_de_tendencia():
    assert classificar_tendencia(1.0) == "EVOLUCAO"
    assert classificar_tendencia(0.2) == "ESTAGNACAO"
    assert classificar_tendencia(-1.0) == "REGRESSAO"


@pytest.mark.django_db
def test_relatorio_calcula_resumo_e_curva(prof_a, aluno_a, plano_a, historicos_a, autenticar):
    resposta = autenticar(prof_a.usuario).get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["alunoId"] == aluno_a.pk
    assert corpo["resumo"]["totalExecucoes"] == len(historicos_a)
    assert corpo["resumo"]["totalTentativas"] == len(historicos_a) * 2
    assert len(corpo["porAtividade"]) == 1
    assert len(corpo["porAtividade"][0]["pontos"]) == len(historicos_a)
    ponto = corpo["porAtividade"][0]["pontos"][0]
    assert {"data", "resultado", "mediaMovel", "ewma"} <= ponto.keys()
    assert corpo["resumo"]["tendencia"] in {"EVOLUCAO", "ESTAGNACAO", "REGRESSAO"}


@pytest.mark.django_db
def test_relatorio_com_filtro_de_periodo(prof_a, aluno_a, plano_a, historicos_a, autenticar):
    inicio = historicos_a[0].data_hora.date().isoformat()
    fim = historicos_a[2].data_hora.date().isoformat()
    resposta = autenticar(prof_a.usuario).get(
        f"/api/relatorios/desempenho/?aluno={aluno_a.pk}&inicio={inicio}&fim={fim}"
    )
    assert resposta.status_code == 200
    assert resposta.json()["resumo"]["totalExecucoes"] == 3


@pytest.mark.django_db
def test_relatorio_isolado_por_perfil(prof_b, resp_a, aluno_a, plano_a, historicos_a, autenticar):
    assert (
        autenticar(prof_b.usuario)
        .get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
        .status_code
        == 403
    )
    assert (
        autenticar(resp_a.usuario)
        .get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
        .status_code
        == 200
    )


@pytest.mark.django_db
def test_relatorio_aluno_so_do_proprio(aluno_a, aluno_b, plano_a, historicos_a, autenticar):
    assert (
        autenticar(aluno_a.usuario)
        .get(f"/api/relatorios/desempenho/?aluno={aluno_b.pk}")
        .status_code
        == 403
    )
    assert (
        autenticar(aluno_a.usuario)
        .get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
        .status_code
        == 200
    )


@pytest.mark.django_db
def test_relatorio_sem_execucoes(prof_a, aluno_a, autenticar):
    resposta = autenticar(prof_a.usuario).get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
    assert resposta.status_code == 200
    assert resposta.json()["resumo"]["totalExecucoes"] == 0
    assert resposta.json()["porAtividade"] == []


@pytest.mark.django_db
def test_relatorio_valida_data(prof_a, aluno_a, autenticar):
    resposta = autenticar(prof_a.usuario).get(
        f"/api/relatorios/desempenho/?aluno={aluno_a.pk}&inicio=31-12-2026"
    )
    assert resposta.status_code == 400
