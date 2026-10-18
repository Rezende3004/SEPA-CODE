from __future__ import annotations

from typing import Any

from django.db.models import Q, QuerySet

from common.permissions import (
    is_admin_global,
    is_administrador,
    is_aluno,
    is_profissional,
    is_responsavel,
)


class ScopedQuerysetMixin:
    """Centraliza o recorte de dados por perfil e instituição (RN-002/RN-003)."""

    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        raise NotImplementedError

    def get_queryset(self) -> QuerySet:
        queryset = super().get_queryset()  # type: ignore[misc]
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return queryset.none()
        return self.scope_queryset(queryset, user)


class AlunoScopedQuerysetMixin(ScopedQuerysetMixin):
    """Para o model Aluno: admin tudo, profissional pela instituição, responsável filhos, aluno self."""

    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        if is_administrador(user):
            if is_admin_global(user):
                return queryset
            if user.instituicao_id is None:
                return queryset.none()
            return queryset.filter(usuario__instituicao_id=user.instituicao_id)
        if is_profissional(user):
            return queryset.filter(usuario__instituicao_id=user.instituicao_id)
        if is_responsavel(user):
            return queryset.filter(responsavel_id=user.id)
        if is_aluno(user):
            return queryset.filter(usuario_id=user.id)
        return queryset.none()


class AlunoRelacionadoScopedQuerysetMixin(ScopedQuerysetMixin):
    """Para modelos que têm FK `aluno` (planos, histórico, relatórios, análises)."""

    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        if is_administrador(user):
            if is_admin_global(user):
                return queryset
            if user.instituicao_id is None:
                return queryset.none()
            return queryset.filter(aluno__usuario__instituicao_id=user.instituicao_id)
        if is_profissional(user):
            return queryset.filter(aluno__usuario__instituicao_id=user.instituicao_id)
        if is_responsavel(user):
            return queryset.filter(aluno__responsavel_id=user.id)
        if is_aluno(user):
            return queryset.filter(aluno__usuario_id=user.id)
        return queryset.none()


class InstituicaoScopedQuerysetMixin(ScopedQuerysetMixin):
    """Para atividades e conteúdos, sempre filtrados pela instituição (RN-003)."""

    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        if is_administrador(user):
            if is_admin_global(user):
                return queryset
            if user.instituicao_id is None:
                return queryset.none()
            return queryset.filter(instituicao_id=user.instituicao_id)
        if user.instituicao_id is None:
            return queryset.none()
        return queryset.filter(instituicao_id=user.instituicao_id)


class MensagemScopedQuerysetMixin(ScopedQuerysetMixin):
    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        return queryset.filter(Q(remetente=user) | Q(destinatario=user))


class PlanoScopeMixin(AlunoRelacionadoScopedQuerysetMixin):
    """Planos são recortados pelo aluno (o plano não guarda instituição própria)."""


class UsuarioScopeMixin(ScopedQuerysetMixin):
    def scope_queryset(self, queryset: QuerySet, user: Any) -> QuerySet:
        if is_administrador(user):
            if is_admin_global(user):
                return queryset
            if user.instituicao_id is None:
                return queryset.filter(id=user.id)
            return queryset.filter(Q(id=user.id) | Q(instituicao_id=user.instituicao_id))
        if user.instituicao_id is None:
            return queryset.filter(id=user.id)
        return queryset.filter(Q(id=user.id) | Q(instituicao_id=user.instituicao_id))
