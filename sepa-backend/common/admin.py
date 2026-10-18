from django.contrib import admin

from common.models import Auditoria


@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = ("criado_em", "usuario", "acao", "objeto_tipo", "objeto_id", "ip")
    list_filter = ("acao", "criado_em")
    search_fields = ("usuario__nome", "usuario__email", "objeto_tipo", "objeto_id")
    readonly_fields = (
        "usuario",
        "acao",
        "objeto_tipo",
        "objeto_id",
        "detalhes",
        "ip",
        "user_agent",
        "criado_em",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
