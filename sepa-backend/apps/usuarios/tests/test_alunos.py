from __future__ import annotations

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.usuarios.models import Aluno, Profissional, Usuario
from apps.usuarios.tests.factories import InstituicaoFactory


@pytest.mark.django_db
def test_factory_cria_instituicao():
    instituicao = InstituicaoFactory()
    assert instituicao.pk is not None
    assert instituicao.status_assinatura == "ATIVA"


@pytest.mark.django_db
def test_listagem_de_alunos_e_recortada_por_perfil(
    admin_user, prof_a, prof_b, resp_a, aluno_a, aluno_b, autenticar
):
    resposta = autenticar(prof_a.usuario).get("/api/alunos/")
    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()] == [aluno_a.pk]

    resposta_b = autenticar(prof_b.usuario).get("/api/alunos/")
    assert [item["id"] for item in resposta_b.json()] == [aluno_b.pk]

    resposta_resp = autenticar(resp_a.usuario).get("/api/alunos/")
    assert [item["id"] for item in resposta_resp.json()] == [aluno_a.pk]

    resposta_aluno = autenticar(aluno_a.usuario).get("/api/alunos/")
    assert [item["id"] for item in resposta_aluno.json()] == [aluno_a.pk]

    resposta_admin = autenticar(admin_user).get("/api/alunos/")
    assert {item["id"] for item in resposta_admin.json()} == {aluno_a.pk, aluno_b.pk}


@pytest.mark.django_db
def test_aluno_resumo_traz_campos_enriquecidos(prof_a, aluno_a, autenticar):
    item = autenticar(prof_a.usuario).get("/api/alunos/").json()[0]
    assert item["responsavelNome"] == "Responsável A"
    assert item["instituicaoNome"] == "Instituto A"
    assert "mediaRecente" in item
    assert item["tendencia"] in {"EVOLUCAO", "ESTAGNACAO", "REGRESSAO"}
    assert item["totalPlanos"] == 0


@pytest.mark.django_db
def test_aluno_de_outra_instituicao_retorna_403(prof_b, aluno_a, autenticar):
    resposta = autenticar(prof_b.usuario).get(f"/api/alunos/{aluno_a.pk}/")
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_aluno_inexistente_retorna_404(prof_a, autenticar):
    resposta = autenticar(prof_a.usuario).get("/api/alunos/9999/")
    assert resposta.status_code == 404


@pytest.mark.django_db
def test_criar_aluno_sem_responsavel_retorna_400(prof_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/alunos/",
        {
            "nome": "Aluno Sem Responsável",
            "email": "sem.responsavel@teste.exemplo",
            "dataNascimento": "2018-04-01",
            "observacoes": "",
        },
        format="json",
    )
    assert resposta.status_code == 400
    assert "responsavelId" in resposta.json()


@pytest.mark.django_db
def test_banco_exige_responsavel(aluno_a, instituicao_a):
    usuario = Usuario.objects.create_user(
        email="orfao@teste.exemplo",
        password="Senha@123",
        nome="Aluno Órfão",
        tipo_usuario=Usuario.TipoUsuario.ALUNO,
        instituicao=instituicao_a,
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        Aluno.objects.create(
            usuario=usuario,
            data_nascimento="2018-01-01",
            observacoes="",
            responsavel=None,
        )


@pytest.mark.django_db
def test_criar_aluno_valido(prof_a, resp_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/alunos/",
        {
            "nome": "Aluno Novo",
            "email": "aluno.novo@teste.exemplo",
            "dataNascimento": "2019-06-15",
            "observacoes": "Gosta de música",
            "responsavelId": resp_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["responsavelId"] == resp_a.pk
    usuario = Usuario.objects.get(email="aluno.novo@teste.exemplo")
    assert usuario.tipo_usuario == Usuario.TipoUsuario.ALUNO
    assert usuario.instituicao_id == prof_a.usuario.instituicao_id


@pytest.mark.django_db
def test_responsavel_de_outra_instituicao_e_rejeitado(prof_a, resp_b, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/alunos/",
        {
            "nome": "Aluno Cross",
            "email": "aluno.cross@teste.exemplo",
            "dataNascimento": "2019-06-15",
            "responsavelId": resp_b.pk,
        },
        format="json",
    )
    assert resposta.status_code == 400
    assert "responsavelId" in resposta.json()


@pytest.mark.django_db
def test_responsavel_e_aluno_nao_podem_cadastrar(resp_a, aluno_a, autenticar):
    for usuario in (resp_a.usuario, aluno_a.usuario):
        resposta = autenticar(usuario).post(
            "/api/alunos/",
            {
                "nome": "Aluno Proibido",
                "email": f"proibido.{usuario.pk}@teste.exemplo",
                "dataNascimento": "2019-06-15",
                "responsavelId": resp_a.pk,
            },
            format="json",
        )
        assert resposta.status_code == 403


@pytest.mark.django_db
def test_minimizacao_de_dados_para_responsavel(prof_a, resp_a, aluno_a, autenticar):
    visto_profissional = autenticar(prof_a.usuario).get("/api/alunos/").json()[0]
    visto_responsavel = autenticar(resp_a.usuario).get("/api/alunos/").json()[0]
    assert visto_profissional["observacoes"] == "Observação clínica sensível"
    assert visto_responsavel["observacoes"] is None


@pytest.mark.django_db
def test_lista_de_responsaveis_e_por_instituicao(
    admin_user, prof_a, prof_b, resp_a, resp_b, autenticar
):
    resposta_a = autenticar(prof_a.usuario).get("/api/responsaveis/")
    assert [item["id"] for item in resposta_a.json()] == [resp_a.pk]

    resposta_admin = autenticar(admin_user).get("/api/responsaveis/")
    assert {item["id"] for item in resposta_admin.json()} == {resp_a.pk, resp_b.pk}

    resposta_resp = autenticar(resp_a.usuario).get("/api/responsaveis/")
    assert resposta_resp.status_code == 403


@pytest.mark.django_db
def test_usuario_resumo_so_mesma_instituicao(prof_a, prof_b, resp_a, autenticar):
    assert autenticar(prof_a.usuario).get(f"/api/usuarios/{resp_a.pk}/").status_code == 200
    assert autenticar(prof_b.usuario).get(f"/api/usuarios/{resp_a.pk}/").status_code == 403


@pytest.mark.django_db
def test_consentimento_do_responsavel(resp_a):
    assert resp_a.consentimento_em is not None
    assert resp_a.consentimento_em <= timezone.now()


@pytest.mark.django_db
def test_profissional_tem_registro_unico_por_usuario(prof_a):
    assert Profissional.objects.filter(usuario=prof_a.usuario).count() == 1
