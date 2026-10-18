from django.contrib import admin

from apps.execucao.models import HistoricoAtividade


@admin.register(HistoricoAtividade)
class HistoricoAtividadeAdmin(admin.ModelAdmin):
    list_display = ("aluno", "atividade", "resultado", "tentativas", "data_hora")
    list_filter = ("pediu_ajuda", "atividade__instituicao")
    search_fields = ("aluno__usuario__nome", "atividade__titulo")
    date_hierarchy = "data_hora"
    readonly_fields = ("criado_em",)
