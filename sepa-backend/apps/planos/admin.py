from django.contrib import admin

from apps.planos.models import Contem, PlanoDeAtendimento


class ContemInline(admin.TabularInline):
    model = Contem
    extra = 0
    autocomplete_fields = ("atividade",)


@admin.register(PlanoDeAtendimento)
class PlanoDeAtendimentoAdmin(admin.ModelAdmin):
    list_display = ("nome_plano", "aluno", "profissional", "data_inicio")
    list_filter = ("data_inicio", "profissional__usuario__instituicao")
    search_fields = ("nome_plano", "aluno__usuario__nome", "profissional__usuario__nome")
    autocomplete_fields = ("aluno", "profissional")
    inlines = [ContemInline]
