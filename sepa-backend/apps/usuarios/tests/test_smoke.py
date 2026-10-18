from __future__ import annotations

import pytest
from rest_framework.test import APIClient

SENHA = "Senha@123"


def _login(email: str) -> APIClient:
    client = APIClient()
    resposta = client.post(
        "/api/auth/login/",
        {"email": email, "senha": SENHA},
        format="json",
    )
    assert resposta.status_code == 200, resposta.content
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resposta.json()['access']}")
    return client


@pytest.mark.django_db
def test_fluxo_completo_profissional_aluno_responsavel(prof_a, aluno_a, resp_a, atividade_a):
    profissional = _login(prof_a.usuario.email)

    aluno = _login(aluno_a.usuario.email)
    atividades = aluno.get("/api/aluno/atividades/")
    assert atividades.status_code == 200
    assert atividades.json() == []

    plano = profissional.post(
        "/api/planos/",
        {
            "nomePlano": "Plano de fumaça",
            "dataInicio": "2026-01-01",
            "objetivos": "Objetivos do teste de fumaça ponta a ponta",
            "alunoId": aluno_a.pk,
        },
        format="json",
    )
    assert plano.status_code == 201
    plano_id = plano.json()["id"]

    associacao = profissional.post(
        f"/api/planos/{plano_id}/atividades/",
        {"atividadeId": atividade_a.pk},
        format="json",
    )
    assert associacao.status_code == 200

    atividades = aluno.get("/api/aluno/atividades/")
    assert atividades.status_code == 200
    assert len(atividades.json()) == 1
    assert atividades.json()[0]["planoId"] == plano_id

    historico = aluno.post(
        "/api/historico/",
        {
            "atividadeId": atividade_a.pk,
            "resultado": 85,
            "tentativas": 2,
            "tempoRespostaSeg": 40,
            "feedback": "Muito bem!",
            "pediuAjuda": True,
        },
        format="json",
    )
    assert historico.status_code == 201

    analise = profissional.post(f"/api/ia/analisar/?aluno={aluno_a.pk}")
    assert analise.status_code == 201
    recomendacao_id = analise.json()["recomendacao"]["id"]

    aceite = profissional.post(f"/api/recomendacoes/{recomendacao_id}/aceitar/")
    assert aceite.status_code == 200
    assert aceite.json()["status"] == "ACEITA"

    responsavel = _login(resp_a.usuario.email)
    relatorio = responsavel.get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}")
    assert relatorio.status_code == 200
    assert relatorio.json()["resumo"]["totalExecucoes"] == 1


@pytest.mark.django_db
def test_fluxo_bloqueia_acesso_cruzado(prof_b, aluno_a):
    profissional_b = _login(prof_b.usuario.email)
    assert profissional_b.get(f"/api/alunos/{aluno_a.pk}/").status_code == 403
    assert profissional_b.get(f"/api/planos/?aluno={aluno_a.pk}").status_code == 403
    assert profissional_b.get(f"/api/relatorios/desempenho/?aluno={aluno_a.pk}").status_code == 403
