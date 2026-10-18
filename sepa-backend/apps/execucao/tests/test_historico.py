from __future__ import annotations

import pytest
from django.db import IntegrityError, transaction

from apps.execucao.models import HistoricoAtividade


def payload(atividade_id: int) -> dict:
    return {
        "atividadeId": atividade_id,
        "resultado": 90,
        "tentativas": 2,
        "tempoRespostaSeg": 45,
        "feedback": "Muito bem!",
        "pediuAjuda": False,
    }


@pytest.mark.django_db
def test_aluno_registra_o_proprio_historico(aluno_a, atividade_a, plano_a, autenticar):
    resposta = autenticar(aluno_a.usuario).post(
        "/api/historico/", payload(atividade_a.pk), format="json"
    )
    assert resposta.status_code == 201
    assert resposta.json()["alunoId"] == aluno_a.pk
    assert resposta.json()["atividadeId"] == atividade_a.pk
    assert HistoricoAtividade.objects.filter(aluno=aluno_a, atividade=atividade_a).exists()


@pytest.mark.django_db
def test_aluno_nao_pode_registrar_em_nome_de_outro(
    aluno_a, aluno_b, atividade_a, plano_a, autenticar
):
    dados = payload(atividade_a.pk) | {"alunoId": aluno_b.pk}
    resposta = autenticar(aluno_a.usuario).post("/api/historico/", dados, format="json")
    assert resposta.status_code == 201
    assert resposta.json()["alunoId"] == aluno_a.pk


@pytest.mark.django_db
def test_atividade_fora_do_plano_e_rejeitada(aluno_a, instituicao_a, autenticar):
    from apps.usuarios.tests.utils import criar_atividade

    atividade_solta = criar_atividade(instituicao=instituicao_a, titulo="Atividade solta", nivel=2)
    resposta = autenticar(aluno_a.usuario).post(
        "/api/historico/", payload(atividade_solta.pk), format="json"
    )
    assert resposta.status_code == 400
    assert "atividadeId" in resposta.json()


@pytest.mark.django_db
def test_atividade_de_outra_instituicao_e_rejeitada(aluno_a, atividade_b, plano_a, autenticar):
    resposta = autenticar(aluno_a.usuario).post(
        "/api/historico/", payload(atividade_b.pk), format="json"
    )
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_profissional_e_responsavel_nao_registram_historico(
    prof_a, resp_a, aluno_a, atividade_a, plano_a, autenticar
):
    for usuario in (prof_a.usuario, resp_a.usuario):
        resposta = autenticar(usuario).post(
            "/api/historico/", payload(atividade_a.pk), format="json"
        )
        assert resposta.status_code == 403


@pytest.mark.django_db
def test_validacao_de_faixas(aluno_a, atividade_a, plano_a, autenticar):
    client = autenticar(aluno_a.usuario)
    for campo, valor in (("resultado", 150), ("tentativas", 0), ("tempoRespostaSeg", -1)):
        resposta = client.post(
            "/api/historico/", payload(atividade_a.pk) | {campo: valor}, format="json"
        )
        assert resposta.status_code == 400


@pytest.mark.django_db
def test_constraints_do_banco(aluno_a, atividade_a):
    with pytest.raises(IntegrityError), transaction.atomic():
        HistoricoAtividade.objects.create(
            aluno=aluno_a,
            atividade=atividade_a,
            resultado=150,
            tentativas=1,
            tempo_resposta_seg=10,
        )
