from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "O recurso já foi alterado ou decidido."
    default_code = "conflict"


class BusinessRuleViolation(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Regra de negócio violada."
    default_code = "regra_de_negocio"


def api_exception_handler(exc: Exception, context: dict[str, Any]):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if response.status_code in {401, 403, 404}:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        if response.status_code == 401:
            response.data = {
                "detail": str(detail)
                if detail
                else "As credenciais de autenticação não foram fornecidas ou expiraram."
            }
        elif response.status_code == 403:
            response.data = {
                "detail": str(detail)
                if detail
                else "Você não tem permissão para acessar este recurso."
            }
        elif response.status_code == 404:
            response.data = {"detail": str(detail) if detail else "Recurso não encontrado."}

    return response
