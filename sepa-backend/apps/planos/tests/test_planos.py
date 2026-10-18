from __future__ import annotations


def test_listagem_de_planos_por_perfil(
    admin_user, prof_a, prof_b, resp_a, aluno_a, aluno_b, plano_a, plano_b, autenticar
):
    resposta_a = autenticar(prof_a.usuario).get("/api/planos/")
    assert [item["id"] for item in resposta_a.json()] == [plano_a.pk]

    resposta_b = autenticar(prof_b.usuario).get("/api/planos/")
    assert [item["id"] for item in resposta_b.json()] == [plano_b.pk]

    resposta_resp = autenticar(resp_a.usuario).get("/api/planos/")
    assert [item["id"] for item in resposta_resp.json()] == [plano_a.pk]

    resposta_aluno = autenticar(aluno_a.usuario).get("/api/planos/")
    assert [item["id"] for item in resposta_aluno.json()] == [plano_a.pk]

    resposta_admin = autenticar(admin_user).get("/api/planos/")
    assert {item["id"] for item in resposta_admin.json()} == {plano_a.pk, plano_b.pk}


def test_filtro_por_aluno_e_isolamento(
    prof_a, prof_b, aluno_a, aluno_b, plano_a, plano_b, autenticar
):
    resposta = autenticar(prof_a.usuario).get(f"/api/planos/?aluno={aluno_b.pk}")
    assert resposta.status_code == 403
    resposta = autenticar(prof_a.usuario).get(f"/api/planos/?aluno={aluno_a.pk}")
    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()] == [plano_a.pk]


def test_detalhe_do_plano_traz_atividades_e_nomes(prof_a, plano_a, autenticar):
    resposta = autenticar(prof_a.usuario).get(f"/api/planos/{plano_a.pk}/")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["alunoNome"] == "Aluno A"
    assert corpo["profissionalNome"] == "Profissional A"
    assert len(corpo["atividades"]) == 2
    assert "itens" in corpo["atividades"][0]
    assert "conteudoIds" in corpo["atividades"][0]
    assert corpo["atividades"][0]["nivelAtribuido"] >= 1


def test_nivel_atribuido_do_plano_nao_altera_catalogo(prof_a, plano_a, atividade_a, autenticar):
    from apps.planos.models import Contem

    entrada = Contem.objects.get(plano=plano_a, atividade=atividade_a)
    entrada.nivel_atribuido = 4
    entrada.save(update_fields=["nivel_atribuido"])

    client = autenticar(prof_a.usuario)
    plano = client.get(f"/api/planos/{plano_a.pk}/").json()
    atividade_no_plano = next(item for item in plano["atividades"] if item["id"] == atividade_a.pk)
    assert atividade_no_plano["nivelAtribuido"] == 4
    assert atividade_no_plano["nivelDificuldade"] == 4

    atividade_a.refresh_from_db()
    assert atividade_a.nivel_dificuldade == 1


def test_criar_plano(prof_a, aluno_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/planos/",
        {
            "nomePlano": "Plano novo",
            "dataInicio": "2026-01-10",
            "objetivos": "Objetivos suficientemente longos para o teste",
            "alunoId": aluno_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 201
    assert resposta.json()["atividadeIds"] == []


def test_criar_plano_em_aluno_de_outra_instituicao(prof_a, aluno_b, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        "/api/planos/",
        {
            "nomePlano": "Plano indevido",
            "dataInicio": "2026-01-10",
            "objetivos": "Objetivos suficientemente longos para o teste",
            "alunoId": aluno_b.pk,
        },
        format="json",
    )
    assert resposta.status_code == 403


def test_responsavel_e_aluno_nao_criam_planos(resp_a, aluno_a, plano_a, autenticar):
    for usuario in (resp_a.usuario, aluno_a.usuario):
        resposta = autenticar(usuario).post(
            "/api/planos/",
            {
                "nomePlano": "Plano proibido",
                "dataInicio": "2026-01-10",
                "objetivos": "Objetivos suficientemente longos para o teste",
                "alunoId": plano_a.aluno_id,
            },
            format="json",
        )
        assert resposta.status_code == 403


def test_atualizar_e_excluir_plano(prof_a, plano_a, autenticar):
    client = autenticar(prof_a.usuario)
    resposta = client.patch(
        f"/api/planos/{plano_a.pk}/",
        {"nomePlano": "Plano editado"},
        format="json",
    )
    assert resposta.status_code == 200
    assert resposta.json()["nomePlano"] == "Plano editado"

    resposta = client.delete(f"/api/planos/{plano_a.pk}/")
    assert resposta.status_code == 204
    assert client.get(f"/api/planos/{plano_a.pk}/").status_code == 404


def test_outro_profissional_nao_edita_plano(prof_b, plano_a, autenticar):
    client = autenticar(prof_b.usuario)
    assert (
        client.patch(
            f"/api/planos/{plano_a.pk}/", {"nomePlano": "Invadido"}, format="json"
        ).status_code
        == 403
    )
    assert client.delete(f"/api/planos/{plano_a.pk}/").status_code == 403


def test_associar_e_remover_atividade(prof_a, plano_a, instituicao_a, autenticar):
    from apps.usuarios.tests.utils import criar_atividade

    atividade_extra = criar_atividade(instituicao=instituicao_a, titulo="Nova atividade", nivel=3)
    client = autenticar(prof_a.usuario)
    resposta = client.post(
        f"/api/planos/{plano_a.pk}/atividades/",
        {"atividadeId": atividade_extra.pk},
        format="json",
    )
    assert resposta.status_code == 200
    assert atividade_extra.pk in resposta.json()["atividadeIds"]

    resposta = client.delete(f"/api/planos/{plano_a.pk}/atividades/{atividade_extra.pk}/")
    assert resposta.status_code == 204


def test_associar_atividade_de_outra_instituicao(prof_a, plano_a, atividade_b, autenticar):
    resposta = autenticar(prof_a.usuario).post(
        f"/api/planos/{plano_a.pk}/atividades/",
        {"atividadeId": atividade_b.pk},
        format="json",
    )
    assert resposta.status_code == 403


def test_admin_nao_cria_plano(admin_user, aluno_a, autenticar):
    resposta = autenticar(admin_user).post(
        "/api/planos/",
        {
            "nomePlano": "Plano admin",
            "dataInicio": "2026-01-10",
            "objetivos": "Objetivos suficientemente longos para o teste",
            "alunoId": aluno_a.pk,
        },
        format="json",
    )
    assert resposta.status_code == 403
