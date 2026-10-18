from __future__ import annotations

from django.db.models import Count, Max
from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.atividades.models import Atividade
from apps.atividades.serializers import AtividadeAtribuidaSerializer, AtividadeSerializer
from apps.atividades.services import listar_catalogo
from apps.execucao.models import HistoricoAtividade
from apps.usuarios.models import Aluno
from common.mixins import InstituicaoScopedQuerysetMixin
from common.permissions import IsAluno


class AtividadeListView(InstituicaoScopedQuerysetMixin, ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AtividadeSerializer

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return Atividade.objects.none()
        nivel = None
        if self.request.query_params.get("nivel"):
            try:
                nivel = int(self.request.query_params["nivel"])
            except ValueError:
                nivel = None
        return listar_catalogo(
            user,
            busca=self.request.query_params.get("busca", ""),
            tipo=self.request.query_params.get("tipo") or None,
            nivel=nivel,
        )


class AlunoAtividadesView(APIView):
    permission_classes = [IsAluno]

    @extend_schema(
        tags=["Atividades"],
        responses={200: AtividadeAtribuidaSerializer(many=True)},
    )
    def get(self, request):
        aluno = Aluno.objects.select_related("usuario").filter(usuario=request.user).first()
        if aluno is None:
            return Response({"detail": "Aluno não encontrado."}, status=404)

        planos = (
            aluno.planos.select_related("profissional__usuario")
            .prefetch_related("atividades__itens", "atividades__conteudos")
            .order_by("data_inicio", "id")
        )
        execucoes = {
            linha["atividade_id"]: linha
            for linha in HistoricoAtividade.objects.filter(aluno=aluno)
            .values("atividade_id")
            .annotate(total=Count("id"), ultima=Max("data_hora"))
        }

        vistas: set[int] = set()
        atribuidas: list[Atividade] = []
        for plano in planos:
            for atividade in plano.atividades.all():
                if atividade.id in vistas:
                    continue
                vistas.add(atividade.id)
                atividade.plano_id_atribuido = plano.id  # type: ignore[attr-defined]
                atividade.plano_nome_atribuido = plano.nome_plano  # type: ignore[attr-defined]
                resumo = execucoes.get(atividade.id)
                atividade.total_execucoes_atribuido = resumo["total"] if resumo else 0  # type: ignore[attr-defined]
                atividade.ultima_execucao_atribuida = resumo["ultima"] if resumo else None  # type: ignore[attr-defined]
                atribuidas.append(atividade)

        return Response(
            AtividadeAtribuidaSerializer(
                atribuidas,
                many=True,
                context={"request": request},
            ).data
        )
