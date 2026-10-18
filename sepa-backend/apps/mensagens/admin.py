from django.contrib import admin

from apps.mensagens.models import Mensagem


@admin.register(Mensagem)
class MensagemAdmin(admin.ModelAdmin):
    list_display = ("remetente", "destinatario", "lida", "data_envio")
    list_filter = ("lida", "data_envio")
    search_fields = ("remetente__nome", "destinatario__nome", "conteudo_texto")
    readonly_fields = ("criado_em",)
