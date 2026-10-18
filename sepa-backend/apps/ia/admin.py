from django.contrib import admin

from apps.ia.models import AnaliseAprendizado, RecomendacaoIA, Sugere


class SugereInline(admin.TabularInline):
    model = Sugere
    extra = 0
    autocomplete_fields = ("atividade",)


@admin.register(AnaliseAprendizado)
class AnaliseAprendizadoAdmin(admin.ModelAdmin):
    list_display = ("aluno", "tendencia", "pontuacao_curva", "data_analise")
    list_filter = ("tendencia",)
    search_fields = ("aluno__usuario__nome",)


@admin.register(RecomendacaoIA)
class RecomendacaoIAAdmin(admin.ModelAdmin):
    list_display = ("analise", "status", "nivel_atual", "nivel_sugerido", "data_geracao")
    list_filter = ("status", "nivel_sugerido")
    search_fields = ("analise__aluno__usuario__nome", "descricao_recomendacao")
    readonly_fields = ("fatores", "decidido_por", "decidido_em")
    inlines = [SugereInline]
