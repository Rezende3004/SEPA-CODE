from __future__ import annotations

from django.db.models import Prefetch
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.atividades.models import Atividade
from apps.ia.models import RecomendacaoIA
from apps.ia.serializers import AnaliseAprendizadoSerializer, RecomendacaoSerializer
from apps.ia.services import aceitar_recomendacao, analisar_aluno, rejeitar_recomendacao
from apps.usuarios.models import Aluno
from common.permissions import (
    IsProfissional,
    IsProfissionalOrAdmin,
    can_view_aluno,
)


class RecomendacaoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsProfissionalOrAdmin]
    serializer_class = RecomendacaoSerializer

    def get_queryset(self):
        queryset = (
            RecomendacaoIA.objects.select_related(
                "analise__aluno__usuario",
                "analise__aluno__usuario__instituicao",
                "decidido_por",
            )
            .prefetch_related(
                Prefetch(
                    "atividades",
                    queryset=Atividade.objects.prefetch_related("itens", "conteudos"),
                )
            )
            .order_by("-data_geracao")
        )
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if not user.is_superuser:
            queryset = queryset.filter(analise__aluno__usuario__instituicao_id=user.instituicao_id)

        aluno_id = self.request.query_params.get("aluno")
        if aluno_id:
            try:
                queryset = queryset.filter(analise__aluno_id=int(aluno_id))
            except ValueError:
                queryset = queryset.none()
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_object(self):
        recomendacao = (
            RecomendacaoIA.objects.select_related(
                "analise__aluno__usuario",
                "analise__aluno__usuario__instituicao",
            )
            .prefetch_related(
                Prefetch(
                    "atividades",
                    queryset=Atividade.objects.prefetch_related("itens", "conteudos"),
                )
            )
            .filter(pk=self.kwargs["pk"])
            .first()
        )
        if recomendacao is None:
            raise NotFound("Recomendação não encontrada.")
        if not can_view_aluno(self.request.user, recomendacao.analise.aluno):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")
        return recomendacao

    def get_permissions(self):
        if self.action in {"aceitar", "rejeitar"}:
            return [IsAuthenticated(), IsProfissional()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def aceitar(self, request, pk=None):
        recomendacao = self.get_object()
        recomendacao = aceitar_recomendacao(recomendacao, request.user, request=request)
        return Response(RecomendacaoSerializer(recomendacao).data)

    @action(detail=True, methods=["post"])
    def rejeitar(self, request, pk=None):
        recomendacao = self.get_object()
        recomendacao = rejeitar_recomendacao(recomendacao, request.user, request=request)
        return Response(RecomendacaoSerializer(recomendacao).data)


class AnalisarView(APIView):
    permission_classes = [IsAuthenticated, IsProfissional]

    @extend_schema(tags=["IA"], request=None, responses={201: OpenApiTypes.OBJECT})
    def post(self, request):
        aluno_id = request.query_params.get("aluno")
        try:
            aluno = Aluno.objects.select_related("usuario").get(pk=int(aluno_id))
        except (TypeError, ValueError, Aluno.DoesNotExist) as exc:
            raise NotFound("Aluno não encontrado.") from exc
        if aluno.usuario.instituicao_id != request.user.instituicao_id:
            raise PermissionDenied("Você não tem permissão para acessar este aluno.")

        analise, recomendacao = analisar_aluno(aluno, request.user, request=request)
        return Response(
            {
                "analise": AnaliseAprendizadoSerializer(analise).data,
                "recomendacao": RecomendacaoSerializer(recomendacao).data,
            },
            status=status.HTTP_201_CREATED,
        )
