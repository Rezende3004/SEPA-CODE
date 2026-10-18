from django.db import models

from apps.atividades.models import Atividade
from apps.usuarios.models import Aluno, Profissional


class PlanoDeAtendimento(models.Model):
    nome_plano = models.CharField("nome do plano", max_length=150)
    data_inicio = models.DateField("data de início")
    objetivos = models.TextField("objetivos")
    profissional = models.ForeignKey(
        Profissional,
        verbose_name="profissional",
        on_delete=models.CASCADE,
        related_name="planos",
    )
    aluno = models.ForeignKey(
        Aluno,
        verbose_name="aluno",
        on_delete=models.CASCADE,
        related_name="planos",
    )
    atividades = models.ManyToManyField(
        Atividade,
        through="Contem",
        related_name="planos",
        blank=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "plano de atendimento"
        verbose_name_plural = "planos de atendimento"
        ordering = ["-data_inicio", "nome_plano"]
        indexes = [
            models.Index(fields=["aluno"]),
            models.Index(fields=["profissional"]),
            models.Index(fields=["data_inicio"]),
        ]

    def __str__(self) -> str:
        return self.nome_plano


class Contem(models.Model):
    plano = models.ForeignKey(PlanoDeAtendimento, on_delete=models.CASCADE)
    atividade = models.ForeignKey(Atividade, on_delete=models.PROTECT)

    class Meta:
        verbose_name = "atividade do plano"
        verbose_name_plural = "atividades do plano"
        constraints = [
            models.UniqueConstraint(
                fields=["plano", "atividade"],
                name="contem_plano_atividade_unico",
            )
        ]
        indexes = [models.Index(fields=["plano", "atividade"])]

    def __str__(self) -> str:
        return f"{self.plano_id} → {self.atividade_id}"
