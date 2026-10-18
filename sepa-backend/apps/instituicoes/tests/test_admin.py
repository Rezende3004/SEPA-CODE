from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.instituicoes.models import Instituicao
from apps.usuarios.models import Usuario


@pytest.mark.django_db
def test_instituicoes_publicas_so_ativas(instituicao_a, instituicao_b):
    instituicao_b.status_assinatura = Instituicao.StatusAssinatura.SUSPENSA
    instituicao_b.save(update_fields=["status_assinatura"])
    resposta = APIClient().get("/api/instituicoes/")
    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()] == [instituicao_a.pk]


@pytest.mark.django_db
def test_admin_lista_e_atualiza_instituicoes(admin_user, instituicao_a, autenticar):
    client = autenticar(admin_user)
    resposta = client.get("/api/admin/instituicoes/")
    assert resposta.status_code == 200
    assert resposta.json()[0]["id"] == instituicao_a.pk

    resposta = client.patch(
        f"/api/admin/instituicoes/{instituicao_a.pk}/",
        {"statusAssinatura": "SUSPENSA"},
        format="json",
    )
    assert resposta.status_code == 200
    instituicao_a.refresh_from_db()
    assert instituicao_a.status_assinatura == "SUSPENSA"


@pytest.mark.django_db
def test_nao_admin_nao_gerencia_instituicoes(prof_a, instituicao_a, autenticar):
    client = autenticar(prof_a.usuario)
    assert client.get("/api/admin/instituicoes/").status_code == 403
    assert (
        client.patch(
            f"/api/admin/instituicoes/{instituicao_a.pk}/",
            {"statusAssinatura": "SUSPENSA"},
            format="json",
        ).status_code
        == 403
    )


@pytest.mark.django_db
def test_admin_cria_lista_e_desativa_profissional(admin_user, instituicao_a, autenticar):
    client = autenticar(admin_user)
    resposta = client.post(
        "/api/admin/profissionais/",
        {
            "nome": "Profissional Novo",
            "email": "prof.novo@teste.exemplo",
            "senha": "Senha@123",
            "especialidade": "PEDAGOGO",
            "registroProfissional": "MEC 123456",
            "instituicaoId": instituicao_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 201
    profissional_id = resposta.json()["id"]

    lista = client.get("/api/admin/profissionais/")
    assert lista.status_code == 200
    assert any(item["id"] == profissional_id for item in lista.json())

    desativado = client.patch(
        f"/api/admin/profissionais/{profissional_id}/",
        {"ativo": False},
        format="json",
    )
    assert desativado.status_code == 200
    assert desativado.json()["ativo"] is False
    usuario = Usuario.objects.get(pk=profissional_id)
    assert usuario.is_active is False


@pytest.mark.django_db
def test_admin_nao_cria_profissional_duplicado(admin_user, prof_a, instituicao_a, autenticar):
    resposta = autenticar(admin_user).post(
        "/api/admin/profissionais/",
        {
            "nome": "Duplicado",
            "email": prof_a.usuario.email,
            "senha": "Senha@123",
            "especialidade": "PSICOLOGO",
            "registroProfissional": "CRP 0/0",
            "instituicaoId": instituicao_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 400
    assert "email" in resposta.json()


@pytest.mark.django_db
def test_profissional_nao_acessa_admin_de_profissionais(prof_a, autenticar):
    assert autenticar(prof_a.usuario).get("/api/admin/profissionais/").status_code == 403
