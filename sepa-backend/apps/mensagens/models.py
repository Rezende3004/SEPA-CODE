from django.conf import settings
from django.db import models
from django.utils import timezone


class Mensagem(models.Model):
    conteudo_texto = models.TextField("conteúdo", max_length=4000)
    data_envio = models.DateTimeField("data de envio", default=timezone.now)
    remetente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="remetente",
        on_delete=models.CASCADE,
        related_name="mensagens_enviadas",
    )
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="destinatário",
        on_delete=models.CASCADE,
        related_name="mensagens_recebidas",
    )
    lida = models.BooleanField("lida", default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "mensagem"
        verbose_name_plural = "mensagens"
        ordering = ["-data_envio"]
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(remetente=models.F("destinatario")),
                name="mensagem_remetente_diferente_destinatario",
            )
        ]
        indexes = [
            models.Index(fields=["remetente", "destinatario", "data_envio"]),
            models.Index(fields=["destinatario", "lida"]),
        ]

    def __str__(self) -> str:
        return f"{self.remetente_id} → {self.destinatario_id}"
