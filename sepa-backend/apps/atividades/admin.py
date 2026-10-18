from django.contrib import admin

from apps.atividades.models import Atividade, ConteudoMultimidia, ItemAtividade, Utiliza


class ItemAtividadeInline(admin.TabularInline):
    model = ItemAtividade
    extra = 0


@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = ("titulo", "tipo_atividade", "nivel_dificuldade", "instituicao")
    list_filter = ("tipo_atividade", "nivel_dificuldade", "instituicao")
    search_fields = ("titulo", "descricao")
    inlines = [ItemAtividadeInline]


@admin.register(ConteudoMultimidia)
class ConteudoMultimidiaAdmin(admin.ModelAdmin):
    list_display = ("nome_arquivo", "tipo_arquivo", "instituicao")
    list_filter = ("instituicao", "tipo_arquivo")


@admin.register(Utiliza)
class UtilizaAdmin(admin.ModelAdmin):
    list_display = ("atividade", "conteudo")
