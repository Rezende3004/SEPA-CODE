from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.instituicoes.models import Instituicao


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("O e-mail é obrigatório.")
        email = self.normalize_email(email).lower()
        usuario = self.model(email=email, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("tipo_usuario", Usuario.TipoUsuario.ADMINISTRADOR)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Superusuário precisa de is_staff e is_superuser.")
        return self._create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    class TipoUsuario(models.TextChoices):
        PROFISSIONAL = "PROFISSIONAL", "Profissional"
        ALUNO = "ALUNO", "Aluno"
        RESPONSAVEL = "RESPONSAVEL", "Responsável"
        ADMINISTRADOR = "ADMINISTRADOR", "Administrador"

    nome = models.CharField("nome", max_length=150)
    email = models.EmailField("e-mail", max_length=255, unique=True)
    tipo_usuario = models.CharField(
        "tipo de usuário",
        max_length=20,
        choices=TipoUsuario.choices,
    )
    instituicao = models.ForeignKey(
        Instituicao,
        verbose_name="instituição",
        on_delete=models.PROTECT,
        related_name="usuarios",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField("ativo", default=True)
    is_staff = models.BooleanField("equipe", default=False)
    date_joined = models.DateTimeField("cadastrado em", default=timezone.now)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    class Meta:
        verbose_name = "usuário"
        verbose_name_plural = "usuários"
        ordering = ["nome"]
        indexes = [
            models.Index(fields=["tipo_usuario"]),
            models.Index(fields=["instituicao", "tipo_usuario"]),
        ]

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def get_full_name(self) -> str:
        return self.nome

    def get_short_name(self) -> str:
        return self.nome.split(" ")[0]

    def __str__(self) -> str:
        return f"{self.nome} <{self.email}>"

    @property
    def ativo(self) -> bool:
        return self.is_active


class Profissional(models.Model):
    class Especialidade(models.TextChoices):
        PSICOLOGO = "PSICOLOGO", "Psicólogo"
        FONOAUDIOLOGO = "FONOAUDIOLOGO", "Fonoaudiólogo"
        PEDAGOGO = "PEDAGOGO", "Pedagogo"

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profissional",
    )
    especialidade = models.CharField(max_length=30, choices=Especialidade.choices)
    registro_profissional = models.CharField("registro profissional", max_length=30)

    class Meta:
        verbose_name = "profissional"
        verbose_name_plural = "profissionais"

    def __str__(self) -> str:
        return f"{self.usuario.nome} ({self.get_especialidade_display()})"


class Responsavel(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="responsavel",
    )
    telefone = models.CharField("telefone", max_length=20)
    consentimento_em = models.DateTimeField(
        "consentimento LGPD em",
        null=True,
        blank=True,
        help_text="Data em que o responsável consentiu com o tratamento dos dados.",
    )

    class Meta:
        verbose_name = "responsável"
        verbose_name_plural = "responsáveis"

    def __str__(self) -> str:
        return self.usuario.nome


class Aluno(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="aluno",
    )
    data_nascimento = models.DateField("data de nascimento")
    observacoes = models.TextField("observações", blank=True)
    responsavel = models.ForeignKey(
        Responsavel,
        verbose_name="responsável",
        on_delete=models.PROTECT,
        related_name="alunos",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "aluno"
        verbose_name_plural = "alunos"
        ordering = ["usuario__nome"]
        indexes = [
            models.Index(fields=["responsavel"]),
            models.Index(fields=["usuario"]),
        ]

    def __str__(self) -> str:
        return self.usuario.nome

    @property
    def instituicao(self) -> Instituicao | None:
        return self.usuario.instituicao

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.responsavel_id is None:
            raise ValidationError({"responsavel": "O responsável é obrigatório (RN-001)."})
        if (
            self.usuario_id
            and self.responsavel_id
            and self.usuario.instituicao_id != self.responsavel.usuario.instituicao_id
        ):
            raise ValidationError(
                {"responsavel": "O responsável deve pertencer à mesma instituição do aluno."}
            )
