from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.mensagens.models import Mensagem
from apps.mensagens.serializers import MensagemCreateSerializer, MensagemSerializer
from apps.mensagens.services import enviar_mensagem, marcar_mensagem_lida
from apps.usuarios.models import Usuario
from common.mixins import MensagemScopedQuerysetMixin
from common.permissions import IsProfissionalOuResponsavel


class MensagemViewSet(
    MensagemScopedQuerysetMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsProfissionalOuResponsavel]
    serializer_class = MensagemSerializer

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return Mensagem.objects.none()
        queryset = Mensagem.objects.select_related("remetente", "destinatario").filter(
            remetente=user
        ) | Mensagem.objects.select_related("remetente", "destinatario").filter(destinatario=user)
        com = self.request.query_params.get("com")
        if com:
            try:
                com_id = int(com)
            except ValueError:
                com_id = None
            if com_id:
                queryset = queryset.filter(remetente_id=com_id) | queryset.filter(
                    destinatario_id=com_id
                )
                return queryset.order_by("data_envio", "id")
        return queryset.order_by("-data_envio", "-id")

    def create(self, request, *args, **kwargs):
        serializer = MensagemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        destinatario = Usuario.objects.filter(
            pk=serializer.validated_data["destinatario_id"]
        ).first()
        if destinatario is None:
            return Response({"destinatario_id": ["Destinatário não encontrado."]}, status=400)
        mensagem = enviar_mensagem(
            request.user,
            destinatario,
            serializer.validated_data["conteudo_texto"],
            request=request,
        )
        return Response(
            MensagemSerializer(mensagem).data,
            status=201,
        )


class MarcarLidaView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Mensagens"],
        request=None,
        responses={200: MensagemSerializer},
    )
    def post(self, request, pk: int):
        mensagem = Mensagem.objects.filter(pk=pk).first()
        if mensagem is None:
            return Response({"detail": "Mensagem não encontrada."}, status=404)
        mensagem = marcar_mensagem_lida(mensagem, request.user, request=request)
        return Response(MensagemSerializer(mensagem).data)
