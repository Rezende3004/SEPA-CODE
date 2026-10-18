from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission

from apps.usuarios.models import Aluno, Usuario


def is_administrador(user: Any) -> bool:
    return bool(
        user and user.is_authenticated and user.tipo_usuario == Usuario.TipoUsuario.ADMINISTRADOR
    )


def is_admin_global(user: Any) -> bool:
    """Administrador de plataforma: precisa ser superusuário (documentado)."""
    return bool(user and user.is_authenticated and user.is_superuser)


def is_profissional(user: Any) -> bool:
    return bool(
        user and user.is_authenticated and user.tipo_usuario == Usuario.TipoUsuario.PROFISSIONAL
    )


def is_responsavel(user: Any) -> bool:
    return bool(
        user and user.is_authenticated and user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL
    )


def is_aluno(user: Any) -> bool:
    return bool(user and user.is_authenticated and user.tipo_usuario == Usuario.TipoUsuario.ALUNO)


def can_view_aluno(user: Any, aluno: Aluno) -> bool:
    if not user or not user.is_authenticated:
        return False
    if is_administrador(user):
        if is_admin_global(user):
            return True
        return bool(
            user.instituicao_id is not None and aluno.usuario.instituicao_id == user.instituicao_id
        )
    if is_aluno(user):
        return aluno.usuario_id == user.id
    if is_responsavel(user):
        return aluno.responsavel_id == user.id
    if is_profissional(user):
        return aluno.usuario.instituicao_id == user.instituicao_id
    return False


def can_manage_aluno(user: Any, aluno: Aluno) -> bool:
    if is_administrador(user):
        if is_admin_global(user):
            return True
        return bool(
            user.instituicao_id is not None and aluno.usuario.instituicao_id == user.instituicao_id
        )
    return bool(is_profissional(user) and aluno.usuario.instituicao_id == user.instituicao_id)


def can_manage_plano(user: Any, plano) -> bool:
    return can_manage_aluno(user, plano.aluno)


def can_decide_recomendacao(user: Any, recomendacao) -> bool:
    aluno = recomendacao.analise.aluno
    return bool(is_profissional(user) and aluno.usuario.instituicao_id == user.instituicao_id)


class IsAdministrador(BasePermission):
    message = "Apenas administradores podem acessar este recurso."

    def has_permission(self, request, view) -> bool:
        return is_administrador(request.user)


class IsProfissional(BasePermission):
    message = "Apenas profissionais podem executar esta ação."

    def has_permission(self, request, view) -> bool:
        return is_profissional(request.user)


class IsProfissionalOrAdmin(BasePermission):
    message = "Apenas profissionais ou administradores podem acessar este recurso."

    def has_permission(self, request, view) -> bool:
        return is_profissional(request.user) or is_administrador(request.user)


class IsResponsavel(BasePermission):
    message = "Apenas responsáveis podem acessar este recurso."

    def has_permission(self, request, view) -> bool:
        return is_responsavel(request.user)


class IsAluno(BasePermission):
    message = "Apenas alunos podem acessar este recurso."

    def has_permission(self, request, view) -> bool:
        return is_aluno(request.user)


class IsProfissionalOuResponsavel(BasePermission):
    message = "Apenas profissionais e responsáveis podem acessar este recurso."

    def has_permission(self, request, view) -> bool:
        return is_profissional(request.user) or is_responsavel(request.user)
