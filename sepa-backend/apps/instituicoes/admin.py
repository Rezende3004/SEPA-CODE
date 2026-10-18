from django.contrib import admin

from apps.instituicoes.models import Instituicao


@admin.register(Instituicao)
class InstituicaoAdmin(admin.ModelAdmin):
    list_display = ("nome_fantasia", "cnpj", "status_assinatura")
    list_filter = ("status_assinatura",)
    search_fields = ("nome_fantasia", "cnpj")
