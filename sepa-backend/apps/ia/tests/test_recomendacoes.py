from __future__ import annotations

import pytest

from apps.ia.features import FEATURES, extrair_features
from apps.ia.services import analisar_aluno, explicar
from apps.ia.training import treinar_modelo
from apps.planos.models import Contem
from apps.usuarios.models import Aluno


def test_features_com_caso_conhecido(historicos_a):
    features = extrair_features(historicos_a)
    assert features["media_resultado"] == pytest.approx(59.17, abs=0.1)
    assert features["media_tentativas"] == 2
    assert features["taxa_pedidos_ajuda"] == 0.5
    assert features["slope"] == pytest.approx(3.37, abs=0.2)
    assert set(features) == set(FEATURES)


@pytest.mark.django_db
def test_features_do_aluno(aluno_a, historicos_a):
    from apps.ia.features import features_do_aluno

    features = features_do_aluno(aluno_a)
    assert features["media_resultado"] > 0
    assert features["tempo_medio_resposta"] == 40


@pytest.mark.django_db
def test_lista_de_recomendacoes_por_instituicao(
    admin_user, prof_a, prof_b, aluno_a, recomendacao_a, autenticar
):
    resposta = autenticar(prof_a.usuario).get("/api/recomendacoes/")
    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()] == [recomendacao_a.pk]
    assert resposta.json()[0]["alunoNome"] == "Aluno A"
    assert resposta.json()[0]["atividades"][0]["titulo"] == "Animais A"

    assert autenticar(prof_b.usuario).get("/api/recomendacoes/").json() == []
    assert len(autenticar(admin_user).get("/api/recomendacoes/").json()) == 1


@pytest.mark.django_db
def test_aceitar_so_apos_decisao_e_aplicar_nivel_nos_planos(
    prof_a, atividade_a, plano_a, recomendacao_a, autenticar
):
    nivel_catalogo_antes = atividade_a.nivel_dificuldade
    entrada = Contem.objects.get(plano=plano_a, atividade=atividade_a)
    assert entrada.nivel_atribuido == nivel_catalogo_antes

    resposta = autenticar(prof_a.usuario).post(f"/api/recomendacoes/{recomendacao_a.pk}/aceitar/")
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "ACEITA"
    assert resposta.json()["nivelSugerido"] == 2

    atividade_a.refresh_from_db()
    entrada.refresh_from_db()
    assert atividade_a.nivel_dificuldade == nivel_catalogo_antes
    assert entrada.nivel_atribuido == 2

    repetida = autenticar(prof_a.usuario).post(f"/api/recomendacoes/{recomendacao_a.pk}/aceitar/")
    assert repetida.status_code == 409


@pytest.mark.django_db
def test_perfis_sem_permissao_nao_aceitam(prof_b, resp_a, admin_user, recomendacao_a, autenticar):
    for usuario in (prof_b.usuario, resp_a.usuario, admin_user):
        resposta = autenticar(usuario).post(f"/api/recomendacoes/{recomendacao_a.pk}/aceitar/")
        assert resposta.status_code in {403, 404}


@pytest.mark.django_db
def test_rejeitar_nao_altera_atividade(prof_a, atividade_a, recomendacao_a, autenticar):
    resposta = autenticar(prof_a.usuario).post(f"/api/recomendacoes/{recomendacao_a.pk}/rejeitar/")
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "REJEITADA"
    atividade_a.refresh_from_db()
    assert atividade_a.nivel_dificuldade == 1


@pytest.mark.django_db
def test_endpoint_de_analise_cria_recomendacao(
    prof_a, aluno_a, atividade_a, historicos_a, autenticar
):
    resposta = autenticar(prof_a.usuario).post(f"/api/ia/analisar/?aluno={aluno_a.pk}")
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert "analise" in corpo
    assert "recomendacao" in corpo
    assert corpo["recomendacao"]["status"] == "PENDENTE"
    assert 1 <= corpo["recomendacao"]["nivelSugerido"] <= 5
    assert sum(fator["peso"] for fator in corpo["recomendacao"]["fatores"]) == pytest.approx(
        1, abs=0.01
    )
    assert Aluno.objects.filter(pk=aluno_a.pk).exists()


@pytest.mark.django_db
def test_servico_de_analise_e_explicabilidade(prof_a, aluno_a, atividade_a, historicos_a):
    analise, recomendacao = analisar_aluno(aluno_a, prof_a.usuario)
    assert analise.tendencia in {"EVOLUCAO", "ESTAGNACAO", "REGRESSAO"}
    assert recomendacao.fatores
    assert sum(fator["peso"] for fator in recomendacao.fatores) == pytest.approx(1, abs=0.01)


@pytest.mark.django_db
def test_rejeitar_so_por_profissional(prof_b, recomendacao_a, autenticar):
    resposta = autenticar(prof_b.usuario).post(f"/api/recomendacoes/{recomendacao_a.pk}/rejeitar/")
    assert resposta.status_code in {403, 404}


@pytest.mark.slow
def test_treinamento_gera_modelo_e_metricas(tmp_path, settings):
    settings.ML_MODEL_PATH = tmp_path / "modelo.joblib"
    settings.ML_METADATA_PATH = tmp_path / "modelo.json"
    metadata = treinar_modelo(n_amostras=300, seed=7)
    assert metadata["acuracia"] > 0.6
    assert settings.ML_MODEL_PATH.exists()
    assert len(metadata["classes"]) == 3
    assert metadata["matriz_confusao"]

    class Features(dict):
        pass

    features = {
        "media_resultado": 80,
        "media_tentativas": 1.2,
        "tempo_medio_resposta": 30,
        "taxa_pedidos_ajuda": 0.1,
        "slope": 1.5,
    }
    fatores = explicar(features, None)
    assert sum(fator["peso"] for fator in fatores) == pytest.approx(1, abs=0.01)
