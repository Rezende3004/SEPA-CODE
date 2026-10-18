from __future__ import annotations

import pytest

from apps.mensagens.models import Mensagem


@pytest.mark.django_db
def test_profissional_e_responsavel_compartilham_aluno(prof_a, resp_a, aluno_a, plano_a):
    from apps.mensagens.services import pode_conversar

    assert pode_conversar(prof_a.usuario, resp_a.usuario)
    assert pode_conversar(resp_a.usuario, prof_a.usuario)


@pytest.mark.django_db
def test_responsavel_sem_vinculo_nao_conversa(prof_a, resp_sem_vinculo, aluno_a, plano_a):
    from apps.mensagens.services import pode_conversar

    assert not pode_conversar(prof_a.usuario, resp_sem_vinculo.usuario)


@pytest.mark.django_db
def test_envio_entre_parceiros_com_aluno(prof_a, resp_a, aluno_a, plano_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/mensagens/",
        {"destinatarioId": resp_a.pk, "conteudoTexto": "Olá, responsável!"},
        format="json",
    )
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["remetenteId"] == prof_a.pk
    assert corpo["destinatarioId"] == resp_a.pk
    assert corpo["lida"] is False


@pytest.mark.django_db
def test_envio_fora_do_vinculo_bloqueado(prof_a, resp_sem_vinculo, aluno_a, plano_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/mensagens/",
        {"destinatarioId": resp_sem_vinculo.pk, "conteudoTexto": "Não deveria passar"},
        format="json",
    )
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_responsavel_nao_pode_enviar_para_outra_instituicao(
    resp_a, prof_b, aluno_a, plano_a, autenticar
):
    resposta = autenticar(resp_a.usuario).post(
        "/api/mensagens/",
        {"destinatarioId": prof_b.pk, "conteudoTexto": "Outra instituição"},
        format="json",
    )
    assert resposta.status_code == 403


@pytest.mark.django_db
def test_lista_e_conversa_por_contato(prof_a, resp_a, mensagem_a, autenticar):
    client = autenticar(prof_a.usuario)
    resposta = client.get("/api/mensagens/")
    assert resposta.status_code == 200
    assert len(resposta.json()) == 1

    conversa = client.get(f"/api/mensagens/?com={resp_a.pk}")
    assert conversa.status_code == 200
    assert conversa.json()[0]["conteudoTexto"] == "Mensagem de teste"


@pytest.mark.django_db
def test_marcar_lida_somente_destinatario(prof_a, resp_a, mensagem_a, autenticar):
    assert (
        autenticar(prof_a.usuario).post(f"/api/mensagens/{mensagem_a.pk}/lida/").status_code == 403
    )
    resposta = autenticar(resp_a.usuario).post(f"/api/mensagens/{mensagem_a.pk}/lida/")
    assert resposta.status_code == 200
    assert resposta.json()["lida"] is True


@pytest.mark.django_db
def test_admin_nao_acessa_mensagens(admin_user, autenticar):
    assert autenticar(admin_user).get("/api/mensagens/").status_code == 403


@pytest.mark.django_db
def test_mensagem_nao_pode_ser_para_si_mesmo(prof_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/mensagens/",
        {"destinatarioId": prof_a.pk, "conteudoTexto": "Eu mesmo"},
        format="json",
    )
    assert resposta.status_code == 400


@pytest.mark.django_db
def test_mensagem_vazia_rejeitada(prof_a, resp_a, aluno_a, plano_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/mensagens/",
        {"destinatarioId": resp_a.pk, "conteudoTexto": "   "},
        format="json",
    )
    assert resposta.status_code == 400
    assert not Mensagem.objects.filter(conteudo_texto="   ").exists()
