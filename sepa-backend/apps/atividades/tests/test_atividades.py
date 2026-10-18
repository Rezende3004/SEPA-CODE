from __future__ import annotations

import pytest

from apps.usuarios.tests.utils import criar_atividade


@pytest.mark.django_db
def test_catalogo_recortado_por_instituicao(
    admin_user, prof_a, prof_b, instituicao_a, instituicao_b, autenticar
):
    atividade_a = criar_atividade(instituicao=instituicao_a, titulo="A", nivel=1)
    atividade_b = criar_atividade(instituicao=instituicao_b, titulo="B", nivel=2)

    assert [item["id"] for item in autenticar(prof_a.usuario).get("/api/atividades/").json()] == [
        atividade_a.pk
    ]
    assert [item["id"] for item in autenticar(prof_b.usuario).get("/api/atividades/").json()] == [
        atividade_b.pk
    ]
    assert len(autenticar(admin_user).get("/api/atividades/").json()) == 2


@pytest.mark.django_db
def test_catalogo_filtra_busca_tipo_e_nivel(prof_a, instituicao_a, autenticar):
    from apps.usuarios.tests.utils import criar_atividade

    criar_atividade(instituicao=instituicao_a, titulo="Animais", nivel=1, tipo="ASSOCIACAO")
    criar_atividade(instituicao=instituicao_a, titulo="Rotina", nivel=3, tipo="SEQUENCIA")
    client = autenticar(prof_a.usuario)

    por_busca = client.get("/api/atividades/?busca=rotina").json()
    assert len(por_busca) == 1
    assert por_busca[0]["titulo"] == "Rotina"

    por_tipo = client.get("/api/atividades/?tipo=SEQUENCIA").json()
    assert len(por_tipo) == 1

    por_nivel = client.get("/api/atividades/?nivel=1").json()
    assert len(por_nivel) == 1
    assert por_nivel[0]["nivelDificuldade"] == 1


@pytest.mark.django_db
def test_atividade_traz_itens_e_conteudos(prof_a, instituicao_a, autenticar):
    criar_atividade(instituicao=instituicao_a, titulo="Com itens", nivel=2)
    item = autenticar(prof_a.usuario).get("/api/atividades/").json()[0]
    assert item["itens"][0]["rotulo"] == "Cachorro"
    assert len(item["conteudoIds"]) == 1


@pytest.mark.django_db
def test_aluno_recebe_nivel_atribuido_do_plano(aluno_a, plano_a, atividade_a, autenticar):
    from apps.planos.models import Contem

    client = autenticar(aluno_a.usuario)
    atividade = client.get("/api/aluno/atividades/").json()[0]
    assert atividade["nivelAtribuido"] == 1
    assert atividade["nivelDificuldade"] == 1

    entrada = Contem.objects.get(plano=plano_a, atividade=atividade_a)
    entrada.nivel_atribuido = 4
    entrada.save(update_fields=["nivel_atribuido"])

    atualizada = client.get("/api/aluno/atividades/").json()[0]
    assert atualizada["nivelAtribuido"] == 4
    assert atualizada["nivelDificuldade"] == 4
    atividade_a.refresh_from_db()
    assert atividade_a.nivel_dificuldade == 1
