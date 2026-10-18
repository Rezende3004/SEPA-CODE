from __future__ import annotations

from django.db.models import Prefetch
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.atividades.models import Atividade
from apps.planos.models import Contem, PlanoDeAtendimento
from apps.planos.serializers import (
    AssociarAtividadeSerializer,
    PlanoSerializer,
    PlanoWriteSerializer,
)
from apps.planos.services import (
    associar_atividade,
    atualizar_plano,
    criar_plano,
    excluir_plano,
    remover_atividade,
)
from apps.usuarios.models import Aluno
from common.mixins import AlunoRelacionadoScopedQuerysetMixin
from common.permissions import (
    IsProfissional,
    can_manage_plano,
    can_view_aluno,
)


class PlanoViewSet(
    AlunoRelacionadoScopedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "associar", "remover"}:
            return [IsAuthenticated(), IsProfissional()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return PlanoWriteSerializer
        if self.action == "associar":
            return AssociarAtividadeSerializer
        return PlanoSerializer

    def get_queryset(self):
        queryset = (
            PlanoDeAtendimento.objects.select_related(
                "aluno__usuario",
                "aluno__usuario__instituicao",
                "profissional__usuario",
            )
            .prefetch_related(
                Prefetch(
                    "entradas",
                    queryset=Contem.objects.select_related("atividade").prefetch_related(
                        "atividade__itens", "atividade__conteudos"
                    ),
                )
            )
            .order_by("-data_inicio", "-id")
        )
        return self.scope_queryset(queryset, self.request.user)

    def get_object(self):
        plano = (
            PlanoDeAtendimento.objects.select_related(
                "aluno__usuario",
                "aluno__usuario__instituicao",
                "profissional__usuario",
            )
            .prefetch_related(
                Prefetch(
                    "entradas",
                    queryset=Contem.objects.select_related("atividade").prefetch_related(
                        "atividade__itens", "atividade__conteudos"
                    ),
                )
            )
            .filter(pk=self.kwargs["pk"])
            .first()
        )
        if plano is None:
            raise NotFound("Plano não encontrado.")
        if not can_view_aluno(self.request.user, plano.aluno):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return plano

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        aluno_id = request.query_params.get("aluno")
        if aluno_id:
            try:
                aluno = Aluno.objects.select_related("usuario").get(pk=int(aluno_id))
            except (ValueError, Aluno.DoesNotExist) as exc:
                raise NotFound("Aluno não encontrado.") from exc
            if not can_view_aluno(request.user, aluno):
                raise PermissionDenied("Você não tem permissão para acessar este recurso.")
            queryset = queryset.filter(aluno=aluno)
        return Response(PlanoSerializer(queryset, many=True).data)

    def _aluno(self, aluno_id) -> Aluno:
        try:
            aluno = Aluno.objects.select_related("usuario").get(pk=aluno_id)
        except (TypeError, ValueError, Aluno.DoesNotExist) as exc:
            raise ValidationError({"aluno_id": ["Aluno não encontrado."]}) from exc
        return aluno

    def create(self, request, *args, **kwargs):
        serializer = PlanoWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = dict(serializer.validated_data)
        aluno_id = dados.pop("aluno_id", None)
        if not aluno_id:
            raise ValidationError({"aluno_id": ["Selecione o aluno."]})
        dados["aluno"] = self._aluno(aluno_id)
        plano = criar_plano(request.user, dados, request=request)
        return Response(PlanoSerializer(plano).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        plano = self.get_object()
        serializer = PlanoWriteSerializer(data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        dados = dict(serializer.validated_data)
        dados.pop("aluno_id", None)
        plano = atualizar_plano(request.user, plano, dados, request=request)
        return Response(PlanoSerializer(plano).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        plano = self.get_object()
        excluir_plano(request.user, plano, request=request)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _atividade(self, atividade_id) -> Atividade:
        atividade = Atividade.objects.filter(pk=atividade_id).first()
        if atividade is None:
            raise ValidationError({"atividade_id": ["Atividade não encontrada."]})
        return atividade

    @action(detail=True, methods=["post"], url_path="atividades")
    def associar(self, request, pk=None):
        plano = self.get_object()
        serializer = AssociarAtividadeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        atividade = self._atividade(serializer.validated_data["atividade_id"])
        plano = associar_atividade(request.user, plano, atividade, request=request)
        return Response(PlanoSerializer(plano).data)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"atividades/(?P<atividade_id>[0-9]+)",
        url_name="remover-atividade",
    )
    def remover(self, request, pk=None, atividade_id=None):
        plano = self.get_object()
        if not can_manage_plano(request.user, plano):
            raise PermissionDenied("Você não tem permissão para editar este plano.")
        atividade = self._atividade(int(atividade_id))
        remover_atividade(request.user, plano, atividade, request=request)
        return Response(status=status.HTTP_204_NO_CONTENT)
