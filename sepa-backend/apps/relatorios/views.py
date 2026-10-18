from __future__ import annotations

from datetime import date

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.relatorios.serializers import RelatorioDesempenhoSerializer
from apps.relatorios.services import gerar_relatorio
from apps.usuarios.models import Aluno
from common.permissions import can_view_aluno


def _data(valor: str | None, campo: str) -> date | None:
    if not valor:
        return None
    try:
        return date.fromisoformat(valor)
    except ValueError as exc:
        raise ValidationError({campo: ["Use uma data no formato YYYY-MM-DD."]}) from exc


class RelatorioDesempenhoView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Relatórios"],
        responses={200: RelatorioDesempenhoSerializer, 403: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        aluno_id = request.query_params.get("aluno")
        try:
            aluno = Aluno.objects.select_related("usuario").get(pk=int(aluno_id))
        except (TypeError, ValueError, Aluno.DoesNotExist) as exc:
            raise NotFound("Aluno não encontrado.") from exc

        if not can_view_aluno(request.user, aluno):
            raise PermissionDenied("Você não tem permissão para acessar este recurso.")

        inicio = _data(request.query_params.get("inicio"), "inicio")
        fim = _data(request.query_params.get("fim"), "fim")
        relatorio = gerar_relatorio(aluno, inicio=inicio, fim=fim)
        return Response(RelatorioDesempenhoSerializer(relatorio).data)
