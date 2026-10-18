from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.instituicoes.models import Instituicao
from apps.usuarios.models import Aluno, Profissional, Responsavel, Usuario
from common.permissions import is_admin_global, is_administrador, is_profissional
from common.services import registrar_auditoria

SENHA_INICIAL_ALUNO = "Sepa@2026"


def _instituicao_por_id(valor) -> Instituicao:
    if isinstance(valor, Instituicao):
        return valor
    try:
        return Instituicao.objects.get(pk=valor)
    except Instituicao.DoesNotExist as exc:
        raise ValidationError({"instituicao_id": ["Instituição não encontrada."]}) from exc


@transaction.atomic
def cadastrar_usuario(dados: dict, request=None) -> Usuario:
    instituicao = _instituicao_por_id(dados["instituicao_id"])
    if instituicao.status_assinatura != Instituicao.StatusAssinatura.ATIVA:
        raise ValidationError(
            {"instituicao_id": ["A instituição não está com a assinatura ativa."]}
        )

    email = dados["email"].strip().lower()
    if Usuario.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": ["Já existe uma conta com este e-mail."]})

    usuario = Usuario.objects.create_user(
        email=email,
        password=dados["senha"],
        nome=dados["nome"].strip(),
        tipo_usuario=dados["tipo_usuario"],
        instituicao=instituicao,
        is_active=dados["tipo_usuario"] != Usuario.TipoUsuario.PROFISSIONAL,
    )
    if usuario.tipo_usuario == Usuario.TipoUsuario.PROFISSIONAL:
        Profissional.objects.create(
            usuario=usuario,
            especialidade=dados["especialidade"],
            registro_profissional=dados["registro_profissional"].strip(),
        )
    else:
        Responsavel.objects.create(
            usuario=usuario,
            telefone=dados["telefone"].strip(),
            consentimento_em=None,
        )

    registrar_auditoria(
        usuario=usuario,
        acao="cadastro",
        objeto=usuario,
        detalhes={"tipoUsuario": usuario.tipo_usuario},
        request=request,
    )
    return usuario


@transaction.atomic
def criar_aluno(executante: Usuario, dados: dict, request=None) -> Aluno:
    if not (is_profissional(executante) or is_administrador(executante)):
        raise PermissionDenied("Apenas profissionais podem cadastrar alunos.")

    responsavel: Responsavel | None = dados.get("responsavel_id")
    if responsavel is None:
        raise ValidationError(
            {"responsavel_id": ["O responsável é obrigatório para cadastrar um aluno (RN-001)."]}
        )
    instituicao = responsavel.usuario.instituicao
    if instituicao is None:
        raise ValidationError(
            {"responsavel_id": ["Não foi possível determinar a instituição do aluno."]}
        )
    if is_profissional(executante) and instituicao.id != executante.instituicao_id:
        raise ValidationError({"responsavel_id": ["O responsável pertence a outra instituição."]})
    if (
        executante.tipo_usuario == Usuario.TipoUsuario.ADMINISTRADOR
        and not is_admin_global(executante)
        and (executante.instituicao_id is None or instituicao.id != executante.instituicao_id)
    ):
        raise PermissionDenied("Administradores institucionais só gerenciam sua instituição.")

    email = dados["email"].strip().lower()
    if Usuario.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": ["Já existe uma conta com este e-mail."]})

    usuario = Usuario.objects.create_user(
        email=email,
        password=SENHA_INICIAL_ALUNO,
        nome=dados["nome"].strip(),
        tipo_usuario=Usuario.TipoUsuario.ALUNO,
        instituicao=instituicao,
    )
    aluno = Aluno.objects.create(
        usuario=usuario,
        data_nascimento=dados["data_nascimento"],
        observacoes=dados.get("observacoes", ""),
        responsavel=responsavel,
    )
    registrar_auditoria(
        usuario=executante,
        acao="criar_aluno",
        objeto=aluno,
        detalhes={"instituicaoId": instituicao.id},
        request=request,
    )
    return aluno


@transaction.atomic
def criar_profissional_admin(dados: dict, executante: Usuario, request=None) -> Profissional:
    instituicao = _instituicao_por_id(dados["instituicao_id"])
    if not executante.is_superuser and instituicao.id != executante.instituicao_id:
        raise PermissionDenied(
            "Administradores institucionais só podem criar contas na própria instituição."
        )
    email = dados["email"].strip().lower()
    if Usuario.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": ["Já existe uma conta com este e-mail."]})
    usuario = Usuario.objects.create_user(
        email=email,
        password=dados["senha"],
        nome=dados["nome"].strip(),
        tipo_usuario=Usuario.TipoUsuario.PROFISSIONAL,
        instituicao=instituicao,
    )
    profissional = Profissional.objects.create(
        usuario=usuario,
        especialidade=dados["especialidade"],
        registro_profissional=dados["registro_profissional"].strip(),
    )
    registrar_auditoria(
        usuario=request.user if request else None,
        acao="admin_criar_profissional",
        objeto=profissional,
        detalhes={"email": email, "instituicaoId": instituicao.id},
        request=request,
    )
    return profissional


@transaction.atomic
def atualizar_profissional_admin(
    profissional: Profissional, dados: dict, executante: Usuario, request=None
) -> Profissional:
    if (
        not executante.is_superuser
        and profissional.usuario.instituicao_id != executante.instituicao_id
    ):
        raise PermissionDenied(
            "Administradores institucionais só gerenciam profissionais da própria instituição."
        )
    usuario = profissional.usuario
    if "ativo" in dados:
        usuario.is_active = dados["ativo"]
        usuario.save(update_fields=["is_active"])
    if "nome" in dados:
        usuario.nome = dados["nome"].strip()
        usuario.save(update_fields=["nome"])
    if "especialidade" in dados:
        profissional.especialidade = dados["especialidade"]
        profissional.save(update_fields=["especialidade"])

    registrar_auditoria(
        usuario=executante,
        acao="admin_atualizar_profissional",
        objeto=profissional,
        detalhes={chave: dados[chave] for chave in dados},
        request=request,
    )
    return profissional
