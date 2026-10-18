from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    ordering = ("nome",)
    list_display = ("nome", "email", "tipo_usuario", "instituicao", "is_active")
    list_filter = ("tipo_usuario", "instituicao", "is_active")
    search_fields = ("nome", "email")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Dados pessoais", {"fields": ("nome", "tipo_usuario", "instituicao")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups")}),
        ("Datas", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "nome",
                    "tipo_usuario",
                    "instituicao",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(Profissional)
class ProfissionalAdmin(admin.ModelAdmin):
    list_display = ("usuario", "especialidade", "registro_profissional")
    list_filter = ("especialidade", "usuario__instituicao")
    search_fields = ("usuario__nome", "usuario__email", "registro_profissional")


@admin.register(Responsavel)
class ResponsavelAdmin(admin.ModelAdmin):
    list_display = ("usuario", "telefone", "consentimento_em")
    search_fields = ("usuario__nome", "usuario__email")


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ("usuario", "responsavel", "data_nascimento")
    list_filter = ("usuario__instituicao",)
    search_fields = ("usuario__nome", "usuario__email", "responsavel__usuario__nome")
    autocomplete_fields = ("responsavel",)
