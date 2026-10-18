from __future__ import annotations

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from apps.instituicoes.models import Instituicao
from apps.relatorios.services import resumo_aluno
from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario


def _perfil(obj, atributo: str):
    try:
        return getattr(obj, atributo)
    except ObjectDoesNotExist:
        return None


class SessaoUsuarioSerializer(serializers.ModelSerializer):
    instituicao_id = serializers.IntegerField(read_only=True, allow_null=True)
    instituicao_nome = serializers.SerializerMethodField()
    ativo = serializers.BooleanField(source="is_active", read_only=True)
    especialidade = serializers.SerializerMethodField()
    registro_profissional = serializers.SerializerMethodField()
    telefone = serializers.SerializerMethodField()
    data_nascimento = serializers.SerializerMethodField()
    responsavel_id = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            "id",
            "nome",
            "email",
            "tipo_usuario",
            "instituicao_id",
            "instituicao_nome",
            "ativo",
            "especialidade",
            "registro_profissional",
            "telefone",
            "data_nascimento",
            "responsavel_id",
        )

    def get_instituicao_nome(self, obj: Usuario) -> str | None:
        return obj.instituicao.nome_fantasia if obj.instituicao_id else None

    def get_especialidade(self, obj: Usuario) -> str | None:
        perfil = _perfil(obj, "profissional")
        return perfil.especialidade if perfil else None

    def get_registro_profissional(self, obj: Usuario) -> str | None:
        perfil = _perfil(obj, "profissional")
        return perfil.registro_profissional if perfil else None

    def get_telefone(self, obj: Usuario) -> str | None:
        perfil = _perfil(obj, "responsavel")
        return perfil.telefone if perfil else None

    def get_data_nascimento(self, obj: Usuario) -> str | None:
        perfil = _perfil(obj, "aluno")
        return perfil.data_nascimento.isoformat() if perfil else None

    def get_responsavel_id(self, obj: Usuario) -> int | None:
        perfil = _perfil(obj, "aluno")
        return perfil.responsavel_id if perfil else None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class CadastroSerializer(serializers.Serializer):
    nome = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    senha = serializers.CharField(min_length=8, max_length=128, write_only=True)
    tipo_usuario = serializers.ChoiceField(
        choices=[Usuario.TipoUsuario.PROFISSIONAL, Usuario.TipoUsuario.RESPONSAVEL]
    )
    instituicao_id = serializers.IntegerField()
    especialidade = serializers.CharField(required=False, allow_blank=True)
    registro_profissional = serializers.CharField(required=False, allow_blank=True)
    telefone = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if Usuario.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return email

    def validate_instituicao_id(self, value: int) -> int:
        try:
            instituicao = Instituicao.objects.get(pk=value)
        except Instituicao.DoesNotExist as exc:
            raise serializers.ValidationError("Instituição não encontrada.") from exc
        if instituicao.status_assinatura != Instituicao.StatusAssinatura.ATIVA:
            raise serializers.ValidationError("A instituição não está com a assinatura ativa.")
        return value

    def validate(self, attrs: dict) -> dict:
        tipo = attrs["tipo_usuario"]
        if tipo == Usuario.TipoUsuario.PROFISSIONAL:
            if not attrs.get("especialidade"):
                raise serializers.ValidationError({"especialidade": ["Selecione a especialidade."]})
            if attrs["especialidade"] not in Profissional.Especialidade.values:
                raise serializers.ValidationError({"especialidade": ["Especialidade inválida."]})
            if not attrs.get("registro_profissional"):
                raise serializers.ValidationError(
                    {"registro_profissional": ["Informe o registro profissional."]}
                )
        else:
            if not attrs.get("telefone"):
                raise serializers.ValidationError({"telefone": ["Informe o telefone de contato."]})
        return attrs


class ResponsavelResumoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="usuario_id", read_only=True)
    nome = serializers.CharField(source="usuario.nome", read_only=True)
    email = serializers.EmailField(source="usuario.email", read_only=True)
    instituicao_id = serializers.IntegerField(
        source="usuario.instituicao_id", read_only=True, allow_null=True
    )

    class Meta:
        model = Responsavel
        fields = ("id", "nome", "email", "telefone", "instituicao_id")


class AlunoResumoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="usuario_id", read_only=True)
    nome = serializers.CharField(source="usuario.nome", read_only=True)
    email = serializers.EmailField(source="usuario.email", read_only=True)
    tipo_usuario = serializers.CharField(source="usuario.tipo_usuario", read_only=True)
    instituicao_id = serializers.IntegerField(
        source="usuario.instituicao_id", read_only=True, allow_null=True
    )
    ativo = serializers.BooleanField(source="usuario.is_active", read_only=True)
    responsavel_nome = serializers.CharField(source="responsavel.usuario.nome", read_only=True)
    responsavel_email = serializers.EmailField(source="responsavel.usuario.email", read_only=True)
    instituicao_nome = serializers.CharField(
        source="usuario.instituicao.nome_fantasia", read_only=True
    )
    media_recente = serializers.SerializerMethodField()
    tendencia = serializers.SerializerMethodField()
    total_planos = serializers.SerializerMethodField()
    observacoes = serializers.SerializerMethodField()

    class Meta:
        model = Aluno
        fields = (
            "id",
            "nome",
            "email",
            "tipo_usuario",
            "instituicao_id",
            "instituicao_nome",
            "ativo",
            "data_nascimento",
            "observacoes",
            "responsavel_id",
            "responsavel_nome",
            "responsavel_email",
            "media_recente",
            "tendencia",
            "total_planos",
        )

    def _resumo(self, obj: Aluno) -> tuple[float, str]:
        cache = getattr(obj, "_resumo_cache", None)
        if cache is None:
            cache = resumo_aluno(obj)
            obj._resumo_cache = cache  # type: ignore[attr-defined]
        return cache

    def get_media_recente(self, obj: Aluno) -> float:
        return self._resumo(obj)[0]

    def get_tendencia(self, obj: Aluno) -> str:
        return self._resumo(obj)[1]

    def get_total_planos(self, obj: Aluno) -> int:
        return getattr(obj, "total_planos_anotado", obj.planos.count())

    def get_observacoes(self, obj: Aluno) -> str | None:
        request = self.context.get("request")
        usuario = getattr(request, "user", None)
        if (
            usuario
            and getattr(usuario, "is_authenticated", False)
            and usuario.tipo_usuario
            in {
                Usuario.TipoUsuario.RESPONSAVEL,
                Usuario.TipoUsuario.ALUNO,
            }
        ):
            return None
        return obj.observacoes


class AlunoCreateSerializer(serializers.Serializer):
    nome = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    data_nascimento = serializers.DateField()
    observacoes = serializers.CharField(required=False, allow_blank=True)
    responsavel_id = serializers.IntegerField(
        error_messages={"required": "Selecione o responsável (RN-001)."}
    )

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if Usuario.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return email

    def validate_responsavel_id(self, value: int) -> Responsavel:
        try:
            return Responsavel.objects.select_related("usuario").get(pk=value)
        except Responsavel.DoesNotExist as exc:
            raise serializers.ValidationError(
                "O responsável é obrigatório para cadastrar um aluno (RN-001)."
            ) from exc


class ProfissionalAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="usuario_id", read_only=True)
    nome = serializers.CharField(source="usuario.nome", read_only=True)
    email = serializers.EmailField(source="usuario.email", read_only=True)
    tipo_usuario = serializers.CharField(source="usuario.tipo_usuario", read_only=True)
    instituicao_id = serializers.IntegerField(
        source="usuario.instituicao_id", read_only=True, allow_null=True
    )
    instituicao_nome = serializers.CharField(
        source="usuario.instituicao.nome_fantasia", read_only=True
    )
    ativo = serializers.BooleanField(source="usuario.is_active", read_only=True)

    class Meta:
        model = Profissional
        fields = (
            "id",
            "nome",
            "email",
            "tipo_usuario",
            "instituicao_id",
            "instituicao_nome",
            "ativo",
            "especialidade",
            "registro_profissional",
        )


class ProfissionalAdminCreateSerializer(serializers.Serializer):
    nome = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    senha = serializers.CharField(min_length=8, max_length=128, write_only=True)
    especialidade = serializers.ChoiceField(choices=Profissional.Especialidade.choices)
    registro_profissional = serializers.CharField(min_length=3, max_length=30)
    instituicao_id = serializers.IntegerField()

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if Usuario.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return email

    def validate_instituicao_id(self, value: int) -> int:
        try:
            Instituicao.objects.get(pk=value)
        except Instituicao.DoesNotExist as exc:
            raise serializers.ValidationError("Instituição não encontrada.") from exc
        return value


class ProfissionalAdminUpdateSerializer(serializers.Serializer):
    ativo = serializers.BooleanField(required=False)
    nome = serializers.CharField(required=False, min_length=3, max_length=150)
    especialidade = serializers.ChoiceField(
        choices=Profissional.Especialidade.choices, required=False
    )


class UsuarioResumoSerializer(serializers.ModelSerializer):
    instituicao_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = ("id", "nome", "tipo_usuario", "instituicao_id")
