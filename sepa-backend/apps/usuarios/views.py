from __future__ import annotations

from django.db.models import Count
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.instituicoes.models import Instituicao
from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario
from apps.usuarios.serializers import (
    AlunoCreateSerializer,
    AlunoResumoSerializer,
    ProfissionalAdminCreateSerializer,
    ProfissionalAdminSerializer,
    ProfissionalAdminUpdateSerializer,
    ResponsavelResumoSerializer,
    UsuarioResumoSerializer,
)
from apps.usuarios.services import (
    atualizar_profissional_admin,
    criar_aluno,
    criar_profissional_admin,
)
from common.mixins import AlunoScopedQuerysetMixin
from common.permissions import (
    IsAdministrador,
    IsProfissionalOrAdmin,
    can_manage_aluno,
    can_view_aluno,
    is_admin_global,
    is_administrador,
    is_profissional,
)


@extend_schema_view(
    retrieve=extend_schema(parameters=[OpenApiParameter("id", int, OpenApiParameter.PATH)])
)
class AlunoViewSet(
    AlunoScopedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsProfissionalOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return AlunoCreateSerializer
        return AlunoResumoSerializer

    def get_queryset(self):
        queryset = (
            Aluno.objects.select_related(
                "usuario",
                "usuario__instituicao",
                "responsavel__usuario",
            )
            .annotate(total_planos_anotado=Count("planos", distinct=True))
            .order_by("usuario__nome")
        )
        return self.scope_queryset(queryset, self.request.user)

    def get_object(self):
        aluno = (
            Aluno.objects.select_related(
                "usuario",
                "usuario__instituicao",
                "responsavel__usuario",
            )
            .filter(pk=self.kwargs["pk"])
            .first()
        )
        if aluno is None:
            raise NotFound("Aluno não encontrado.")
        if not can_view_aluno(self.request.user, aluno):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return aluno

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = AlunoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        aluno = criar_aluno(request.user, serializer.validated_data, request=request)
        return Response(
            AlunoResumoSerializer(aluno, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ResponsavelListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsProfissionalOrAdmin]
    serializer_class = ResponsavelResumoSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Responsavel.objects.select_related("usuario").order_by("usuario__nome")
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if is_administrador(user):
            if is_admin_global(user):
                return queryset
            if user.instituicao_id is None:
                return queryset.none()
            return queryset.filter(usuario__instituicao_id=user.instituicao_id)
        return queryset.filter(usuario__instituicao_id=user.instituicao_id)


class UsuarioResumoView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioResumoSerializer

    def get_object(self):
        usuario = Usuario.objects.filter(pk=self.kwargs["pk"]).first()
        if usuario is None:
            raise NotFound("Usuário não encontrado.")
        solicitante = self.request.user
        if (
            usuario.id != solicitante.id
            and not is_admin_global(solicitante)
            and (
                solicitante.instituicao_id is None
                or usuario.instituicao_id != solicitante.instituicao_id
            )
        ):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return usuario


@extend_schema_view(
    retrieve=extend_schema(parameters=[OpenApiParameter("id", int, OpenApiParameter.PATH)]),
    partial_update=extend_schema(parameters=[OpenApiParameter("id", int, OpenApiParameter.PATH)]),
    update=extend_schema(parameters=[OpenApiParameter("id", int, OpenApiParameter.PATH)]),
)
class ProfissionalAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdministrador]

    def get_queryset(self):
        queryset = Profissional.objects.select_related("usuario", "usuario__instituicao").order_by(
            "usuario__nome"
        )
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if user.is_superuser:
            return queryset
        if user.instituicao_id is None:
            return queryset.none()
        return queryset.filter(usuario__instituicao_id=user.instituicao_id)

    def get_object(self):
        profissional = (
            Profissional.objects.select_related("usuario", "usuario__instituicao")
            .filter(pk=self.kwargs["pk"])
            .first()
        )
        if profissional is None:
            raise NotFound("Profissional não encontrado.")
        if (
            not self.request.user.is_superuser
            and profissional.usuario.instituicao_id != self.request.user.instituicao_id
        ):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return profissional

    def get_serializer_class(self):
        if self.action == "create":
            return ProfissionalAdminCreateSerializer
        if self.action in {"update", "partial_update"}:
            return ProfissionalAdminUpdateSerializer
        return ProfissionalAdminSerializer

    def create(self, request, *args, **kwargs):
        serializer = ProfissionalAdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profissional = criar_profissional_admin(
            serializer.validated_data,
            executante=request.user,
            request=request,
        )
        return Response(
            ProfissionalAdminSerializer(profissional).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        profissional = self.get_object()
        serializer = ProfissionalAdminUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        atualizar_profissional_admin(
            profissional,
            serializer.validated_data,
            executante=request.user,
            request=request,
        )
        return Response(ProfissionalAdminSerializer(profissional).data)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


def instituicao_do_usuario(usuario: Usuario) -> Instituicao | None:
    return usuario.instituicao


def pode_gerenciar_aluno(usuario: Usuario, aluno: Aluno) -> bool:
    return can_manage_aluno(usuario, aluno)


def eh_profissional(usuario: Usuario) -> bool:
    return is_profissional(usuario)
