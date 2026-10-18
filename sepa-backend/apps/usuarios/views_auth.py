from __future__ import annotations

from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.instituicoes.models import Instituicao
from apps.usuarios.serializers import CadastroSerializer, SessaoUsuarioSerializer
from apps.usuarios.services import cadastrar_usuario
from common.services import registrar_auditoria

from .serializers import LoginSerializer, RefreshSerializer


def tokens_para(usuario) -> dict[str, str]:
    refresh = RefreshToken.for_user(usuario)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(
        tags=["Autenticação"],
        request=LoginSerializer,
        responses={200: OpenApiTypes.OBJECT, 401: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        senha = str(request.data.get("senha", ""))
        from apps.usuarios.models import Usuario

        usuario = Usuario.objects.filter(email__iexact=email).first()
        if usuario is None or not usuario.check_password(senha):
            registrar_auditoria(
                usuario=None,
                acao="login_falhou",
                detalhes={"email": email},
                request=request,
            )
            return Response({"detail": "E-mail ou senha inválidos."}, status=401)
        if not usuario.is_active:
            return Response(
                {"detail": "Esta conta está desativada. Procure o administrador."},
                status=403,
            )
        if usuario.instituicao_id:
            instituicao = Instituicao.objects.get(pk=usuario.instituicao_id)
            if instituicao.status_assinatura == Instituicao.StatusAssinatura.SUSPENSA:
                return Response(
                    {"detail": "A assinatura da instituição está suspensa."}, status=403
                )

        registrar_auditoria(
            usuario=usuario,
            acao="login",
            objeto=usuario,
            request=request,
        )
        usuario.last_login = timezone.now()
        usuario.save(update_fields=["last_login"])
        dados = tokens_para(usuario)
        dados["usuario"] = SessaoUsuarioSerializer(usuario, context={"request": request}).data
        return Response(dados)


class RefreshView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Autenticação"],
        request=RefreshSerializer,
        responses={200: OpenApiTypes.OBJECT, 401: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:  # noqa: BLE001 — TokenError, InvalidToken e ValidationError
            return Response({"detail": "Token de atualização inválido ou expirado."}, status=401)
        return Response(serializer.validated_data)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    @extend_schema(
        tags=["Autenticação"],
        request=CadastroSerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        serializer = CadastroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = cadastrar_usuario(serializer.validated_data, request=request)
        dados = tokens_para(usuario)
        dados["usuario"] = SessaoUsuarioSerializer(usuario, context={"request": request}).data
        return Response(dados, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Autenticação"], responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        return Response(
            {"usuario": SessaoUsuarioSerializer(request.user, context={"request": request}).data}
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Autenticação"],
        request=RefreshSerializer,
        responses={204: None, 401: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"refresh": ["Informe o token de atualização."]}, status=400)
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response({"detail": "Token inválido ou já revogado."}, status=401)
        registrar_auditoria(
            usuario=request.user,
            acao="logout",
            objeto=request.user,
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
