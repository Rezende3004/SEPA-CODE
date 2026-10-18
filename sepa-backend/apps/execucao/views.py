from __future__ import annotations

from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.execucao.serializers import HistoricoCreateSerializer, HistoricoSerializer
from apps.execucao.services import registrar_execucao
from apps.usuarios.models import Aluno
from common.permissions import IsAluno


class HistoricoCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsAluno]
    serializer_class = HistoricoCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        aluno = Aluno.objects.filter(usuario=request.user).first()
        if aluno is None:
            return Response({"detail": "Aluno não encontrado."}, status=404)
        historico = registrar_execucao(
            aluno,
            serializer.validated_data,
            executante=request.user,
            request=request,
        )
        return Response(
            HistoricoSerializer(historico).data,
            status=status.HTTP_201_CREATED,
        )
