from __future__ import annotations

from rest_framework import mixins, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.instituicoes.models import Instituicao
from apps.instituicoes.serializers import (
    InstituicaoPublicaSerializer,
    InstituicaoSerializer,
    InstituicaoStatusSerializer,
)
from apps.instituicoes.services import atualizar_status_instituicao
from common.permissions import IsAdministrador


class InstituicaoPublicaListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = InstituicaoPublicaSerializer

    def get_queryset(self):
        return Instituicao.objects.filter(
            status_assinatura=Instituicao.StatusAssinatura.ATIVA
        ).order_by("nome_fantasia")


class InstituicaoAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdministrador]
    queryset = Instituicao.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return Instituicao.objects.none()
        if user.is_superuser:
            return Instituicao.objects.all()
        if user.instituicao_id is None:
            return Instituicao.objects.none()
        return Instituicao.objects.filter(pk=user.instituicao_id)

    def get_object(self):
        instituicao = Instituicao.objects.filter(pk=self.kwargs["pk"]).first()
        if instituicao is None:
            raise NotFound("Instituição não encontrada.")
        user = self.request.user
        if not user.is_superuser and instituicao.pk != user.instituicao_id:
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return instituicao

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return InstituicaoStatusSerializer
        return InstituicaoSerializer

    def partial_update(self, request, *args, **kwargs):
        instituicao = self.get_object()
        serializer = InstituicaoStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        atualizar_status_instituicao(
            instituicao,
            serializer.validated_data["status_assinatura"],
            executante=request.user,
            request=request,
        )
        return Response(InstituicaoSerializer(instituicao).data)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
