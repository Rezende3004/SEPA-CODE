from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from apps.atividades.models import Atividade, ConteudoMultimidia, ItemAtividade, Utiliza
from apps.execucao.models import HistoricoAtividade
from apps.ia.models import AnaliseAprendizado, RecomendacaoIA, Sugere
from apps.ia.training import carregar_metadata, treinar_modelo
from apps.instituicoes.models import Instituicao
from apps.mensagens.models import Mensagem
from apps.planos.models import Contem, PlanoDeAtendimento
from apps.relatorios.models import Relatorio
from apps.relatorios.statistics import classificar_tendencia, media, slope
from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario
from common.models import Auditoria

from ._demo_data import (
    ALUNOS,
    ATIVIDADES,
    INSTITUICOES,
    MENSAGENS,
    PERFIS_DESEMPENHO,
    PLANOS,
    RECOMENDACOES,
    USUARIOS,
)

SENHA_DEMO = "Sepa@2026"

TABELAS_SEQUENCIA = [
    "usuarios_usuario",
    "instituicoes_instituicao",
    "atividades_conteudomultidia",
    "atividades_atividade",
    "atividades_itematividade",
    "planos_planodeatendimento",
    "execucao_historicoatividade",
    "relatorios_relatorio",
    "ia_analiseaprendizado",
    "ia_recomendacaoia",
    "mensagens_mensagem",
    "common_auditoria",
]


def _data_hora(dias_atras: int, hora: int, minuto: int = 0) -> datetime:
    dia = timezone.localdate() - timedelta(days=dias_atras)
    return timezone.make_aware(
        datetime.combine(dia, time(hour=hora, minute=minuto)),
        timezone.get_current_timezone(),
    )


def _limitar(valor: float, minimo: float, maximo: float) -> float:
    return min(max(valor, minimo), maximo)


class Command(BaseCommand):
    help = "Recria os dados fictícios do seed do frontend (use --force para sobrescrever)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Apaga os dados atuais antes de recriar.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if Instituicao.objects.exists() and not options["force"]:
            self.stdout.write(
                self.style.WARNING(
                    "Já existem dados. Use `python manage.py seed_demo --force` para recriar."
                )
            )
            return

        self._limpar()
        instituicoes = self._criar_instituicoes()
        usuarios = self._criar_usuarios(instituicoes)
        atividades = self._criar_atividades(instituicoes)
        planos = self._criar_planos(usuarios, atividades)
        historicos = self._criar_historico(planos, atividades)
        self._criar_analises_e_recomendacoes(usuarios, historicos, atividades)
        self._criar_mensagens()
        self._resetar_sequencias()

        if not carregar_metadata():
            self.stdout.write("Treinando o modelo inicialmente...")
            treinar_modelo()

        self.stdout.write(self.style.SUCCESS("Seed de demonstração criado."))
        self.stdout.write(f"Senha de todos os usuários: {SENHA_DEMO}")
        for usuario in Usuario.objects.order_by("id"):
            self.stdout.write(f"  {usuario.id:>2} · {usuario.tipo_usuario:<15} {usuario.email}")

    def _limpar(self) -> None:
        Mensagem.objects.all().delete()
        Sugere.objects.all().delete()
        RecomendacaoIA.objects.all().delete()
        AnaliseAprendizado.objects.all().delete()
        HistoricoAtividade.objects.all().delete()
        Contem.objects.all().delete()
        PlanoDeAtendimento.objects.all().delete()
        Relatorio.objects.all().delete()
        Aluno.objects.all().delete()
        Responsavel.objects.all().delete()
        Profissional.objects.all().delete()
        Utiliza.objects.all().delete()
        ItemAtividade.objects.all().delete()
        Atividade.objects.all().delete()
        ConteudoMultimidia.objects.all().delete()
        Auditoria.objects.all().delete()
        Usuario.objects.all().delete()
        Instituicao.objects.all().delete()

    def _criar_instituicoes(self) -> dict[int, Instituicao]:
        resultado = {}
        for dados in INSTITUICOES:
            instituicao = Instituicao.objects.create(**dados)
            resultado[instituicao.id] = instituicao
        return resultado

    def _criar_usuarios(self, instituicoes: dict[int, Instituicao]) -> dict[int, Usuario]:
        hoje = timezone.localdate()
        usuarios: dict[int, Usuario] = {}
        for dados in USUARIOS:
            instituicao = instituicoes.get(dados["instituicao"]) if dados["instituicao"] else None
            usuario = Usuario(
                id=dados["id"],
                nome=dados["nome"],
                email=dados["email"],
                tipo_usuario=dados["tipo"],
                instituicao=instituicao,
                is_active=True,
                is_staff=dados["tipo"] == "ADMINISTRADOR",
                is_superuser=dados["tipo"] == "ADMINISTRADOR",
            )
            usuario.set_password(SENHA_DEMO)
            usuario.save()
            usuarios[usuario.id] = usuario
            if dados["tipo"] == "PROFISSIONAL":
                Profissional.objects.create(
                    usuario=usuario,
                    especialidade=dados["especialidade"],
                    registro_profissional=dados["registro"],
                )
            elif dados["tipo"] == "RESPONSAVEL":
                Responsavel.objects.create(
                    usuario=usuario,
                    telefone=dados["telefone"],
                    consentimento_em=timezone.now(),
                )

        for dados in ALUNOS:
            responsavel = Responsavel.objects.get(pk=dados["responsavel"])
            usuario = Usuario(
                id=dados["id"],
                nome=dados["nome"],
                email=dados["email"],
                tipo_usuario=Usuario.TipoUsuario.ALUNO,
                instituicao=instituicoes[dados["instituicao"]],
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )
            usuario.set_password(SENHA_DEMO)
            usuario.save()
            Aluno.objects.create(
                usuario=usuario,
                data_nascimento=date(hoje.year - dados["idade"], dados["mes"], dados["dia"]),
                observacoes=dados["observacoes"],
                responsavel=responsavel,
            )
            usuarios[usuario.id] = usuario
        return usuarios

    def _criar_atividades(self, instituicoes: dict[int, Instituicao]) -> dict[int, Atividade]:
        resultado: dict[int, Atividade] = {}
        for dados in ATIVIDADES:
            atividade = Atividade.objects.create(
                id=dados["id"],
                titulo=dados["titulo"],
                descricao=dados["descricao"],
                nivel_dificuldade=dados["nivel"],
                tipo_atividade=dados["tipo"],
                instituicao=instituicoes[dados["instituicao"]],
            )
            conteudo = ConteudoMultimidia.objects.create(
                id=dados["id"],
                nome_arquivo=f"atividade-{dados['id']}.svg",
                tipo_arquivo="image/svg+xml",
                url=f"/mocks/conteudos/atividade-{dados['id']}.svg",
                instituicao=instituicoes[dados["instituicao"]],
            )
            Utiliza.objects.create(atividade=atividade, conteudo=conteudo)
            for indice, (valor, rotulo, dica) in enumerate(dados["itens"]):
                ItemAtividade.objects.create(
                    id=dados["id"] * 100 + indice,
                    atividade=atividade,
                    ordem=indice + 1,
                    tipo="EMOJI",
                    valor=valor,
                    rotulo=rotulo,
                    dica=dica,
                )
            resultado[atividade.id] = atividade
        return resultado

    def _criar_planos(
        self, usuarios: dict[int, Usuario], atividades: dict[int, Atividade]
    ) -> list[PlanoDeAtendimento]:
        hoje = timezone.localdate()
        planos = []
        for dados in PLANOS:
            plano = PlanoDeAtendimento.objects.create(
                id=dados["id"],
                nome_plano=dados["nome"],
                data_inicio=hoje - timedelta(days=dados["dias"]),
                objetivos=dados["objetivos"],
                profissional_id=dados["profissional"],
                aluno_id=dados["aluno"],
            )
            for atividade_id in dados["atividades"]:
                Contem.objects.create(plano=plano, atividade=atividades[atividade_id])
            planos.append(plano)
        return planos

    def _criar_historico(
        self, planos: list[PlanoDeAtendimento], atividades: dict[int, Atividade]
    ) -> list[HistoricoAtividade]:
        rng = random.Random(2026)
        feedback_positivo = [
            "Muito bem! Você concluiu com atenção.",
            "Excelente! Cada tentativa mostrou seu esforço.",
            "Ótimo trabalho! Continue praticando.",
        ]
        feedback_medio = [
            "Bom trabalho! Você está aprendendo.",
            "Você conseguiu! Vamos praticar mais um pouco.",
        ]
        feedback_apoio = [
            "Você tentou e isso é importante. Vamos praticar juntos.",
            "Cada passo conta. Vamos tentar mais uma vez com calma.",
        ]
        historicos: list[HistoricoAtividade] = []
        for plano in planos:
            perfil = PERFIS_DESEMPENHO[plano.aluno_id]
            for atividade_id in plano.atividades.values_list("id", flat=True):
                atividade = atividades[atividade_id]
                indice_sessao = 0
                for semana in range(8):
                    for sessao in range(2):
                        dias = (7 - semana) * 7 + (1 - sessao) * 3
                        variacao = (rng.random() - 0.5) * 2 * perfil["jitter"]
                        ajuste_nivel = (3 - atividade.nivel_dificuldade) * 2.5
                        bruto = (
                            perfil["base"]
                            + perfil["crescimento"] * indice_sessao
                            + variacao
                            + ajuste_nivel
                        )
                        resultado = round(_limitar(bruto, 30, 98))
                        tentativas = rng.randint(*perfil["tentativas"])
                        probabilidade_ajuda = max(0.05, perfil["ajuda"] - indice_sessao * 0.015)
                        pediu_ajuda = rng.random() < probabilidade_ajuda
                        if resultado >= 80:
                            feedback = rng.choice(feedback_positivo)
                        elif resultado >= 60:
                            feedback = rng.choice(feedback_medio)
                        else:
                            feedback = rng.choice(feedback_apoio)
                        historicos.append(
                            HistoricoAtividade(
                                aluno_id=plano.aluno_id,
                                atividade=atividade,
                                data_hora=_data_hora(dias, 9 + sessao * 2, rng.randint(0, 55)),
                                resultado=resultado,
                                tentativas=tentativas,
                                tempo_resposta_seg=rng.randint(*perfil["tempo"]),
                                feedback=feedback,
                                pediu_ajuda=pediu_ajuda,
                            )
                        )
                        indice_sessao += 1
        HistoricoAtividade.objects.bulk_create(historicos)
        return list(HistoricoAtividade.objects.order_by("data_hora", "id"))

    def _criar_analises_e_recomendacoes(
        self,
        usuarios: dict[int, Usuario],
        historicos: list[HistoricoAtividade],
        atividades: dict[int, Atividade],
    ) -> None:
        alunos = Aluno.objects.select_related("usuario").all()
        analises: dict[int, AnaliseAprendizado] = {}
        for indice, aluno in enumerate(alunos, start=1):
            valores = [h.resultado for h in historicos if h.aluno_id == aluno.pk]
            media_resultados = media(valores)
            coeficiente = slope(valores)
            tendencia = classificar_tendencia(coeficiente)
            descricao = {
                "EVOLUCAO": "os resultados mostram ganho consistente ao longo das sessões",
                "REGRESSAO": "os resultados caíram nas últimas sessões",
                "ESTAGNACAO": "os resultados se mantêm estáveis, sem ganho consistente",
            }[tendencia]
            analise = AnaliseAprendizado.objects.create(
                id=indice,
                aluno=aluno,
                data_analise=timezone.now() - timedelta(days=1),
                pontuacao_curva=round(media_resultados, 2),
                tendencia=tendencia,
                observacoes_ia=(
                    f"A análise das últimas oito semanas indica que {descricao}. "
                    f"Média de {media_resultados:.0f}% e tendência de "
                    f"{coeficiente:.1f} ponto(s) por sessão."
                ),
            )
            analises[aluno.pk] = analise

        profissionais_por_aluno = {
            plano.aluno_id: plano.profissional_id for plano in PlanoDeAtendimento.objects.all()
        }
        for dados in RECOMENDACOES:
            analise = analises[dados["aluno"]]
            decisao = None
            if dados["status"] != "PENDENTE":
                decisao = profissionais_por_aluno.get(dados["aluno"])
            recomendacao = RecomendacaoIA.objects.create(
                id=dados["id"],
                analise=analise,
                data_geracao=timezone.now() - timedelta(days=dados["dias"]),
                descricao_recomendacao=dados["descricao"],
                status=dados["status"],
                nivel_atual=dados["nivel_atual"],
                nivel_sugerido=dados["nivel_sugerido"],
                fatores=[
                    {"metrica": metrica, "valor": valor, "peso": peso}
                    for metrica, valor, peso in dados["fatores"]
                ],
                decidido_por_id=decisao,
                decidido_em=(
                    timezone.now() - timedelta(days=dados["dias"] - 1) if decisao else None
                ),
            )
            for atividade_id in dados["atividades"]:
                Sugere.objects.create(
                    recomendacao=recomendacao,
                    atividade=atividades[atividade_id],
                )

    def _criar_mensagens(self) -> None:
        for indice, (remetente, destinatario, texto, dias, lida) in enumerate(MENSAGENS, start=1):
            Mensagem.objects.create(
                id=indice,
                remetente_id=remetente,
                destinatario_id=destinatario,
                conteudo_texto=texto,
                data_envio=_data_hora(dias, 10 + indice, (indice * 3) % 60),
                lida=lida,
            )

    def _resetar_sequencias(self) -> None:
        if connection.vendor != "postgresql":
            return
        with connection.cursor() as cursor:
            for tabela in TABELAS_SEQUENCIA:
                cursor.execute(
                    f"SELECT setval(pg_get_serial_sequence('{tabela}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {tabela}), 1))"
                )
