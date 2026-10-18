from __future__ import annotations

from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.atividades.models import Atividade
from apps.execucao.models import HistoricoAtividade
from apps.ia.models import AnaliseAprendizado, RecomendacaoIA, Sugere
from apps.instituicoes.models import Instituicao
from apps.mensagens.models import Mensagem
from apps.planos.models import Contem, PlanoDeAtendimento
from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario
from apps.usuarios.tests.utils import criar_atividade

SENHA_TESTE = "Senha@123"


def criar_usuario(
    *,
    email: str,
    nome: str,
    tipo: str,
    instituicao: Instituicao | None,
) -> Usuario:
    return Usuario.objects.create_user(
        email=email,
        password=SENHA_TESTE,
        nome=nome,
        tipo_usuario=tipo,
        instituicao=instituicao,
    )


@pytest.fixture
def instituicao_a(db) -> Instituicao:
    return Instituicao.objects.create(
        nome_fantasia="Instituto A",
        cnpj="11.111.111/0001-11",
        endereco="Rua A",
        status_assinatura=Instituicao.StatusAssinatura.ATIVA,
    )


@pytest.fixture
def instituicao_b(db) -> Instituicao:
    return Instituicao.objects.create(
        nome_fantasia="Clínica B",
        cnpj="22.222.222/0001-22",
        endereco="Rua B",
        status_assinatura=Instituicao.StatusAssinatura.ATIVA,
    )


@pytest.fixture
def admin_user(instituicao_a) -> Usuario:
    return criar_usuario(
        email="admin@teste.exemplo",
        nome="Administrador",
        tipo=Usuario.TipoUsuario.ADMINISTRADOR,
        instituicao=None,
    )


@pytest.fixture
def prof_a(instituicao_a) -> Profissional:
    usuario = criar_usuario(
        email="prof.a@teste.exemplo",
        nome="Profissional A",
        tipo=Usuario.TipoUsuario.PROFISSIONAL,
        instituicao=instituicao_a,
    )
    return Profissional.objects.create(
        usuario=usuario,
        especialidade=Profissional.Especialidade.PSICOLOGO,
        registro_profissional="CRP 00/0001",
    )


@pytest.fixture
def prof_b(instituicao_b) -> Profissional:
    usuario = criar_usuario(
        email="prof.b@teste.exemplo",
        nome="Profissional B",
        tipo=Usuario.TipoUsuario.PROFISSIONAL,
        instituicao=instituicao_b,
    )
    return Profissional.objects.create(
        usuario=usuario,
        especialidade=Profissional.Especialidade.FONOAUDIOLOGO,
        registro_profissional="CRFa 0-0001",
    )


@pytest.fixture
def resp_a(instituicao_a) -> Responsavel:
    usuario = criar_usuario(
        email="resp.a@teste.exemplo",
        nome="Responsável A",
        tipo=Usuario.TipoUsuario.RESPONSAVEL,
        instituicao=instituicao_a,
    )
    return Responsavel.objects.create(
        usuario=usuario,
        telefone="(11) 99999-0001",
        consentimento_em=timezone.now(),
    )


@pytest.fixture
def resp_sem_vinculo(instituicao_a) -> Responsavel:
    usuario = criar_usuario(
        email="resp.sem.vinculo@teste.exemplo",
        nome="Responsável sem vínculo",
        tipo=Usuario.TipoUsuario.RESPONSAVEL,
        instituicao=instituicao_a,
    )
    return Responsavel.objects.create(
        usuario=usuario,
        telefone="(11) 99999-0002",
        consentimento_em=timezone.now(),
    )


@pytest.fixture
def resp_b(instituicao_b) -> Responsavel:
    usuario = criar_usuario(
        email="resp.b@teste.exemplo",
        nome="Responsável B",
        tipo=Usuario.TipoUsuario.RESPONSAVEL,
        instituicao=instituicao_b,
    )
    return Responsavel.objects.create(
        usuario=usuario,
        telefone="(11) 99999-0003",
        consentimento_em=timezone.now(),
    )


@pytest.fixture
def aluno_a(instituicao_a, resp_a) -> Aluno:
    usuario = criar_usuario(
        email="aluno.a@teste.exemplo",
        nome="Aluno A",
        tipo=Usuario.TipoUsuario.ALUNO,
        instituicao=instituicao_a,
    )
    return Aluno.objects.create(
        usuario=usuario,
        data_nascimento=date(2017, 3, 12),
        observacoes="Observação clínica sensível",
        responsavel=resp_a,
    )


@pytest.fixture
def aluno_b(instituicao_b, resp_b) -> Aluno:
    usuario = criar_usuario(
        email="aluno.b@teste.exemplo",
        nome="Aluno B",
        tipo=Usuario.TipoUsuario.ALUNO,
        instituicao=instituicao_b,
    )
    return Aluno.objects.create(
        usuario=usuario,
        data_nascimento=date(2018, 4, 10),
        observacoes="Observação clínica B",
        responsavel=resp_b,
    )


@pytest.fixture
def atividade_a(instituicao_a) -> Atividade:
    return criar_atividade(instituicao=instituicao_a, titulo="Animais A", nivel=1)


@pytest.fixture
def atividade_a2(instituicao_a) -> Atividade:
    return criar_atividade(
        instituicao=instituicao_a,
        titulo="Rotina A",
        nivel=2,
        tipo="SEQUENCIA",
    )


@pytest.fixture
def atividade_b(instituicao_b) -> Atividade:
    return criar_atividade(instituicao=instituicao_b, titulo="Cores B", nivel=1)


@pytest.fixture
def plano_a(prof_a, aluno_a, atividade_a, atividade_a2) -> PlanoDeAtendimento:
    plano = PlanoDeAtendimento.objects.create(
        nome_plano="Plano A",
        data_inicio=date.today() - timedelta(days=30),
        objetivos="Objetivos do plano de teste A",
        profissional=prof_a,
        aluno=aluno_a,
    )
    Contem.objects.create(plano=plano, atividade=atividade_a)
    Contem.objects.create(plano=plano, atividade=atividade_a2)
    return plano


@pytest.fixture
def plano_b(prof_b, aluno_b, atividade_b) -> PlanoDeAtendimento:
    plano = PlanoDeAtendimento.objects.create(
        nome_plano="Plano B",
        data_inicio=date.today() - timedelta(days=20),
        objetivos="Objetivos do plano de teste B",
        profissional=prof_b,
        aluno=aluno_b,
    )
    Contem.objects.create(plano=plano, atividade=atividade_b)
    return plano


@pytest.fixture
def historicos_a(aluno_a, atividade_a) -> list[HistoricoAtividade]:
    valores = [50, 55, 60, 58, 62, 70]
    registros = []
    for indice, resultado in enumerate(valores):
        registros.append(
            HistoricoAtividade.objects.create(
                aluno=aluno_a,
                atividade=atividade_a,
                resultado=resultado,
                tentativas=2,
                tempo_resposta_seg=40,
                feedback=f"Sessão {indice}",
                pediu_ajuda=indice % 2 == 0,
                data_hora=timezone.now() - timedelta(days=40 - indice * 5),
            )
        )
    return registros


@pytest.fixture
def recomendacao_a(aluno_a, historicos_a, atividade_a) -> RecomendacaoIA:
    analise = AnaliseAprendizado.objects.create(
        aluno=aluno_a,
        pontuacao_curva=57.5,
        tendencia=AnaliseAprendizado.Tendencia.ESTAGNACAO,
        observacoes_ia="Análise de teste",
    )
    recomendacao = RecomendacaoIA.objects.create(
        analise=analise,
        descricao_recomendacao="Recomendação de teste",
        status=RecomendacaoIA.Status.PENDENTE,
        nivel_atual=1,
        nivel_sugerido=2,
        fatores=[
            {"metrica": "Média de resultados", "valor": 57.5, "peso": 0.6},
            {"metrica": "Tendência (slope)", "valor": 1.0, "peso": 0.4},
        ],
    )
    Sugere.objects.create(recomendacao=recomendacao, atividade=atividade_a)
    return recomendacao


@pytest.fixture
def mensagem_a(prof_a, resp_a) -> Mensagem:
    return Mensagem.objects.create(
        remetente=prof_a.usuario,
        destinatario=resp_a.usuario,
        conteudo_texto="Mensagem de teste",
    )


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def autenticar():
    def _autenticar(usuario: Usuario) -> APIClient:
        client = APIClient()
        client.force_authenticate(usuario)
        return client

    return _autenticar
