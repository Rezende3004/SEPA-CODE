from django.contrib import admin

from apps.relatorios.models import Relatorio


@admin.register(Relatorio)
class RelatorioAdmin(admin.ModelAdmin):
    list_display = ("titulo_relatorio", "aluno", "profissional", "data_geracao")
    list_filter = ("data_geracao",)
    search_fields = ("titulo_relatorio", "aluno__usuario__nome")
