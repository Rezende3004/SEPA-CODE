from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.atividades.models import Atividade
from apps.usuarios.models import Aluno


class AnaliseAprendizado(models.Model):
    class Tendencia(models.TextChoices):
        EVOLUCAO = "EVOLUCAO", "Evolução"
        ESTAGNACAO = "ESTAGNACAO", "Estagnação"
        REGRESSAO = "REGRESSAO", "Regressão"

    data_analise = models.DateTimeField("data da análise", default=timezone.now)
    pontuacao_curva = models.FloatField("pontuação da curva", default=0)
    tendencia = models.CharField(max_length=20, choices=Tendencia.choices)
    observacoes_ia = models.TextField("observações da IA", blank=True)
    aluno = models.ForeignKey(
        Aluno,
        verbose_name="aluno",
        on_delete=models.CASCADE,
        related_name="analises",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "análise de aprendizado"
        verbose_name_plural = "análises de aprendizado"
        ordering = ["-data_analise"]
        indexes = [models.Index(fields=["aluno", "data_analise"])]

    def __str__(self) -> str:
        return f"Análise {self.aluno_id} · {self.tendencia}"


class RecomendacaoIA(models.Model):
    class Status(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        ACEITA = "ACEITA", "Aceita"
        REJEITADA = "REJEITADA", "Rejeitada"

    data_geracao = models.DateTimeField("data de geração", default=timezone.now)
    descricao_recomendacao = models.TextField("descrição da recomendação")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDENTE)
    analise = models.ForeignKey(
        AnaliseAprendizado,
        verbose_name="análise",
        on_delete=models.CASCADE,
        related_name="recomendacoes",
    )
    nivel_sugerido = models.PositiveSmallIntegerField("nível sugerido")
    nivel_atual = models.PositiveSmallIntegerField("nível atual")
    fatores = models.JSONField("fatores de explicabilidade", default=list, blank=True)
    atividades = models.ManyToManyField(
        Atividade,
        through="Sugere",
        related_name="recomendacoes",
        blank=True,
    )
    decidido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="decidido por",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="decisoes_ia",
    )
    decidido_em = models.DateTimeField("decidido em", null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "recomendação da IA"
        verbose_name_plural = "recomendações da IA"
        ordering = ["-data_geracao"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(nivel_sugerido__gte=1) & models.Q(nivel_sugerido__lte=5),
                name="recomendacao_nivel_sugerido_1_a_5",
            ),
            models.CheckConstraint(
                condition=models.Q(nivel_atual__gte=1) & models.Q(nivel_atual__lte=5),
                name="recomendacao_nivel_atual_1_a_5",
            ),
        ]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["analise", "status"]),
        ]

    def __str__(self) -> str:
        return f"Recomendação {self.analise.aluno_id} · {self.status}"

    @property
    def aluno_id(self) -> int:
        return self.analise.aluno_id


class Sugere(models.Model):
    recomendacao = models.ForeignKey(RecomendacaoIA, on_delete=models.CASCADE)
    atividade = models.ForeignKey(Atividade, on_delete=models.PROTECT)

    class Meta:
        verbose_name = "atividade sugerida"
        verbose_name_plural = "atividades sugeridas"
        constraints = [
            models.UniqueConstraint(
                fields=["recomendacao", "atividade"],
                name="sugere_recomendacao_atividade_unica",
            )
        ]

    def __str__(self) -> str:
        return f"{self.recomendacao_id} → {self.atividade_id}"
