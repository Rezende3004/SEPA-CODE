from django.conf import settings
from django.db import models


class Auditoria(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="usuário",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="auditorias",
    )
    acao = models.CharField("ação", max_length=80)
    objeto_tipo = models.CharField("tipo do objeto", max_length=80, blank=True)
    objeto_id = models.CharField("ID do objeto", max_length=40, blank=True)
    detalhes = models.JSONField("detalhes", default=dict, blank=True)
    ip = models.GenericIPAddressField("IP", null=True, blank=True)
    user_agent = models.CharField("user-agent", max_length=255, blank=True)
    criado_em = models.DateTimeField("criado em", auto_now_add=True)

    class Meta:
        verbose_name = "auditoria"
        verbose_name_plural = "auditorias"
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["acao", "criado_em"]),
            models.Index(fields=["usuario", "criado_em"]),
        ]

    def __str__(self) -> str:
        return f"{self.criado_em:%Y-%m-%d %H:%M} · {self.acao}"
