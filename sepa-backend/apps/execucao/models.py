from django.db import models
from django.utils import timezone

from apps.atividades.models import Atividade
from apps.usuarios.models import Aluno


class HistoricoAtividade(models.Model):
    data_hora = models.DateTimeField("data e hora", default=timezone.now)
    resultado = models.PositiveSmallIntegerField("resultado (0–100)")
    tentativas = models.PositiveSmallIntegerField("tentativas", default=1)
    tempo_resposta_seg = models.PositiveIntegerField("tempo de resposta (s)", default=0)
    feedback = models.TextField("feedback", blank=True)
    aluno = models.ForeignKey(
        Aluno,
        verbose_name="aluno",
        on_delete=models.CASCADE,
        related_name="historico",
    )
    atividade = models.ForeignKey(
        Atividade,
        verbose_name="atividade",
        on_delete=models.PROTECT,
        related_name="historico",
    )
    pediu_ajuda = models.BooleanField("pediu ajuda", default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "histórico de atividade"
        verbose_name_plural = "históricos de atividade"
        ordering = ["-data_hora"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(resultado__gte=0) & models.Q(resultado__lte=100),
                name="historico_resultado_entre_0_e_100",
            ),
            models.CheckConstraint(
                condition=models.Q(tentativas__gte=1),
                name="historico_tentativas_positivas",
            ),
        ]
        indexes = [
            models.Index(fields=["aluno", "data_hora"]),
            models.Index(fields=["aluno", "atividade", "data_hora"]),
            models.Index(fields=["atividade"]),
        ]

    def __str__(self) -> str:
        return f"{self.aluno_id} · {self.atividade_id} · {self.resultado}%"
