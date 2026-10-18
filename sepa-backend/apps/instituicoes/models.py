from django.db import models


class Instituicao(models.Model):
    class StatusAssinatura(models.TextChoices):
        ATIVA = "ATIVA", "Ativa"
        SUSPENSA = "SUSPENSA", "Suspensa"
        TESTE = "TESTE", "Em teste"

    nome_fantasia = models.CharField("nome fantasia", max_length=150)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True)
    endereco = models.CharField("endereço", max_length=255, blank=True)
    status_assinatura = models.CharField(
        "status da assinatura",
        max_length=20,
        choices=StatusAssinatura.choices,
        default=StatusAssinatura.ATIVA,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "instituição"
        verbose_name_plural = "instituições"
        ordering = ["nome_fantasia"]
        indexes = [models.Index(fields=["status_assinatura"])]

    def __str__(self) -> str:
        return self.nome_fantasia
