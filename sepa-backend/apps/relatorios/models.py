from django.db import models
from django.utils import timezone

from apps.usuarios.models import Aluno, Profissional


class Relatorio(models.Model):
    titulo_relatorio = models.CharField("título do relatório", max_length=200)
    data_geracao = models.DateTimeField("data de geração", default=timezone.now)
    periodo_inicio = models.DateField("início do período")
    periodo_fim = models.DateField("fim do período")
    conteudo_observacoes = models.TextField("observações")
    profissional = models.ForeignKey(
        Profissional,
        verbose_name="profissional",
        on_delete=models.CASCADE,
        related_name="relatorios",
    )
    aluno = models.ForeignKey(
        Aluno,
        verbose_name="aluno",
        on_delete=models.CASCADE,
        related_name="relatorios",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "relatório"
        verbose_name_plural = "relatórios"
        ordering = ["-data_geracao"]
        indexes = [models.Index(fields=["aluno", "data_geracao"])]

    def __str__(self) -> str:
        return self.titulo_relatorio
