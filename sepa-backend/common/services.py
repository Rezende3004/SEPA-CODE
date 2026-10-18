from __future__ import annotations

from typing import Any

from django.db import models

from common.models import Auditoria


def get_client_ip(request: Any) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def registrar_auditoria(
    *,
    usuario,
    acao: str,
    objeto: models.Model | None = None,
    detalhes: dict | None = None,
    request: Any = None,
) -> Auditoria:
    return Auditoria.objects.create(
        usuario=usuario if getattr(usuario, "is_authenticated", False) else None,
        acao=acao,
        objeto_tipo=objeto.__class__.__name__ if objeto is not None else "",
        objeto_id=str(getattr(objeto, "pk", "")) if objeto is not None else "",
        detalhes=detalhes or {},
        ip=get_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:255] if request else ""),
    )
