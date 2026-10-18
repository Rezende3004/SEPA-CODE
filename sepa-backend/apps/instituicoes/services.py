from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.instituicoes.models import Instituicao
from apps.usuarios.models import Usuario
from common.services import registrar_auditoria


@transaction.atomic
def atualizar_status_instituicao(
    instituicao: Instituicao,
    novo_status: str,
    executante: Usuario,
    request=None,
) -> Instituicao:
    if novo_status not in Instituicao.StatusAssinatura.values:
        raise ValidationError({"status_assinatura": ["Status de assinatura inválido."]})
    anterior = instituicao.status_assinatura
    instituicao.status_assinatura = novo_status
    instituicao.save(update_fields=["status_assinatura", "atualizado_em"])
    registrar_auditoria(
        usuario=executante,
        acao="admin_status_instituicao",
        objeto=instituicao,
        detalhes={"de": anterior, "para": novo_status},
        request=request,
    )
    return instituicao


def exigir_instituicao_ativa(usuario: Usuario) -> None:
    if usuario.instituicao and usuario.instituicao.status_assinatura == (
        Instituicao.StatusAssinatura.SUSPENSA
    ):
        raise PermissionDenied("A assinatura da instituição está suspensa.")
