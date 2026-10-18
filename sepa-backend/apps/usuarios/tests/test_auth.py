from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.usuarios.models import Profissional, Usuario

SENHA = "Senha@123"


def login(client: APIClient, email: str, senha: str = SENHA):
    return client.post(
        "/api/auth/login/",
        {"email": email, "senha": senha},
        format="json",
    )


@pytest.mark.django_db
def test_login_retorna_tokens_e_usuario(prof_a):
    client = APIClient()
    resposta = login(client, prof_a.usuario.email)
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert {"access", "refresh", "usuario"} <= corpo.keys()
    assert corpo["usuario"]["tipoUsuario"] == "PROFISSIONAL"
    assert corpo["usuario"]["especialidade"] == "PSICOLOGO"
    assert "instituicaoNome" in corpo["usuario"]


@pytest.mark.django_db
def test_login_rejeita_credenciais_invalidas(prof_a):
    client = APIClient()
    resposta = login(client, prof_a.usuario.email, "senha-errada")
    assert resposta.status_code == 401
    assert resposta.json()["detail"] == "E-mail ou senha inválidos."


@pytest.mark.django_db
def test_login_bloqueia_conta_inativa(prof_a):
    prof_a.usuario.is_active = False
    prof_a.usuario.save(update_fields=["is_active"])
    client = APIClient()
    resposta = login(client, prof_a.usuario.email)
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_login_bloqueia_instituicao_suspensa(prof_a, instituicao_a):
    instituicao_a.status_assinatura = "SUSPENSA"
    instituicao_a.save(update_fields=["status_assinatura"])
    client = APIClient()
    resposta = login(client, prof_a.usuario.email)
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_refresh_com_rotacao_e_blacklist(prof_a):
    client = APIClient()
    corpo = login(client, prof_a.usuario.email).json()
    refresh = corpo["refresh"]

    primeira = client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
    assert primeira.status_code == 200
    assert {"access", "refresh"} <= primeira.json().keys()

    segunda = client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
    assert segunda.status_code == 401


@pytest.mark.django_db
def test_refresh_invalido(api_client):
    resposta = api_client.post("/api/auth/refresh/", {"refresh": "abc"}, format="json")
    assert resposta.status_code == 401


@pytest.mark.django_db
def test_me_exige_token_e_retorna_sessao(prof_a, autenticar):
    assert api_client_sem_token().get("/api/me/").status_code == 401
    client = autenticar(prof_a.usuario)
    resposta = client.get("/api/me/")
    assert resposta.status_code == 200
    assert resposta.json()["usuario"]["email"] == prof_a.usuario.email


def api_client_sem_token() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_cadastro_profissional_e_login(instituicao_a):
    client = APIClient()
    resposta = client.post(
        "/api/auth/register/",
        {
            "nome": "Nova Profissional",
            "email": "nova.profissional@teste.exemplo",
            "senha": SENHA,
            "tipoUsuario": "PROFISSIONAL",
            "instituicaoId": instituicao_a.id,
            "especialidade": "PEDAGOGO",
            "registroProfissional": "MEC 0001",
        },
        format="json",
    )
    assert resposta.status_code == 201
    usuario = Usuario.objects.get(email="nova.profissional@teste.exemplo")
    assert usuario.tipo_usuario == Usuario.TipoUsuario.PROFISSIONAL
    assert Profissional.objects.filter(usuario=usuario).exists()
    assert login(APIClient(), usuario.email).status_code == 200


@pytest.mark.django_db
def test_cadastro_validacoes(instituicao_a):
    client = APIClient()
    resposta = client.post(
        "/api/auth/register/",
        {
            "nome": "A",
            "email": "email-invalido",
            "senha": "123",
            "tipoUsuario": "RESPONSAVEL",
            "instituicaoId": instituicao_a.id,
        },
        format="json",
    )
    assert resposta.status_code == 400
    corpo = resposta.json()
    assert "nome" in corpo
    assert "email" in corpo
    assert "senha" in corpo


@pytest.mark.django_db
def test_cadastro_responsavel_sem_telefone(instituicao_a):
    resposta = APIClient().post(
        "/api/auth/register/",
        {
            "nome": "Responsável sem telefone",
            "email": "resp.sem.telefone@teste.exemplo",
            "senha": SENHA,
            "tipoUsuario": "RESPONSAVEL",
            "instituicaoId": instituicao_a.id,
        },
        format="json",
    )
    assert resposta.status_code == 400
    assert "telefone" in resposta.json()


@pytest.mark.django_db
def test_cadastro_em_instituicao_suspensa(instituicao_a):
    instituicao_a.status_assinatura = "SUSPENSA"
    instituicao_a.save(update_fields=["status_assinatura"])
    client = APIClient()
    resposta = client.post(
        "/api/auth/register/",
        {
            "nome": "Responsável Teste",
            "email": "resp.teste@teste.exemplo",
            "senha": SENHA,
            "tipoUsuario": "RESPONSAVEL",
            "instituicaoId": instituicao_a.id,
            "telefone": "(11) 90000-0000",
        },
        format="json",
    )
    assert resposta.status_code == 400


@pytest.mark.django_db
def test_logout_blacklista_refresh(prof_a):
    client = APIClient()
    corpo = login(client, prof_a.usuario.email).json()
    client.force_authenticate(prof_a.usuario)
    resposta = client.post("/api/auth/logout/", {"refresh": corpo["refresh"]}, format="json")
    assert resposta.status_code == 204
    repetido = APIClient().post("/api/auth/refresh/", {"refresh": corpo["refresh"]}, format="json")
    assert repetido.status_code == 401


@pytest.mark.django_db
def test_senha_usa_bcrypt_na_configuracao_base():
    from config.settings import base

    assert base.PASSWORD_HASHERS[0] == ("django.contrib.auth.hashers.BCryptSHA256PasswordHasher")
