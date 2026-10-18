from __future__ import annotations

import pytest

from apps.usuarios.models import Profissional, Usuario


@pytest.mark.django_db
def test_admin_institucional_so_ve_dados_da_propria_instituicao(
    admin_a,
    prof_a,
    prof_b,
    aluno_a,
    aluno_b,
    plano_a,
    plano_b,
    atividade_a,
    atividade_b,
    recomendacao_a,
    autenticar,
):
    client = autenticar(admin_a)

    alunos = client.get("/api/alunos/").json()
    assert [item["id"] for item in alunos] == [aluno_a.pk]

    planos = client.get("/api/planos/").json()
    assert [item["id"] for item in planos] == [plano_a.pk]

    atividades = client.get("/api/atividades/").json()
    ids_atividades = [item["id"] for item in atividades]
    assert atividade_a.pk in ids_atividades
    assert atividade_b.pk not in ids_atividades

    recomendacoes = client.get("/api/recomendacoes/").json()
    assert [item["id"] for item in recomendacoes] == [recomendacao_a.pk]

    profissionais = client.get("/api/admin/profissionais/").json()
    assert all(item["instituicaoId"] == admin_a.instituicao_id for item in profissionais)
    assert any(item["id"] == prof_a.pk for item in profissionais)
    assert all(item["id"] != prof_b.pk for item in profissionais)

    instituicoes = client.get("/api/admin/instituicoes/").json()
    assert [item["id"] for item in instituicoes] == [admin_a.instituicao_id]


@pytest.mark.django_db
def test_admin_global_ve_tudo(admin_user, aluno_a, aluno_b, plano_a, plano_b, autenticar):
    client = autenticar(admin_user)
    assert len(client.get("/api/alunos/").json()) == 2
    assert len(client.get("/api/planos/").json()) == 2
    assert len(client.get("/api/admin/instituicoes/").json()) >= 2


@pytest.mark.django_db
def test_admin_institucional_nao_gerencia_outra_instituicao(
    admin_a, prof_b, instituicao_b, autenticar
):
    client = autenticar(admin_a)
    assert (
        client.patch(
            f"/api/admin/instituicoes/{instituicao_b.pk}/",
            {"statusAssinatura": "SUSPENSA"},
            format="json",
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/admin/profissionais/{prof_b.pk}/",
            {"ativo": False},
            format="json",
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/admin/profissionais/",
            {
                "nome": "Profissional Fora",
                "email": "fora@teste.exemplo",
                "senha": "Senha@123",
                "especialidade": "PSICOLOGO",
                "registroProfissional": "CRP 0/00",
                "instituicaoId": instituicao_b.pk,
            },
            format="json",
        ).status_code
        == 403
    )


@pytest.mark.django_db
def test_admin_institucional_cria_na_propria_instituicao(admin_a, instituicao_a, autenticar):
    resposta = autenticar(admin_a).post(
        "/api/admin/profissionais/",
        {
            "nome": "Profissional A2",
            "email": "prof.a2@teste.exemplo",
            "senha": "Senha@123",
            "especialidade": "PEDAGOGO",
            "registroProfissional": "MEC 0002",
            "instituicaoId": instituicao_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 201
    assert resposta.json()["instituicaoId"] == instituicao_a.pk
    assert Profissional.objects.filter(usuario__email="prof.a2@teste.exemplo").exists()


@pytest.mark.django_db
def test_admin_institucional_nao_acessa_aluno_de_outra_instituicao(admin_a, aluno_b, autenticar):
    resposta = autenticar(admin_a).get(f"/api/alunos/{aluno_b.pk}/")
    assert resposta.status_code == 403
    assert autenticar(admin_a).get(f"/api/planos/?aluno={aluno_b.pk}").status_code == 403


@pytest.mark.django_db
def test_superuser_e_global_mesmo_sem_instituicao(admin_user):
    assert admin_user.is_superuser
    assert admin_user.instituicao_id is None
    assert admin_user.tipo_usuario == Usuario.TipoUsuario.ADMINISTRADOR
