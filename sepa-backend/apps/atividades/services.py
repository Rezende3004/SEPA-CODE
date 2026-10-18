from __future__ import annotations

from django.db.models import Q

from apps.atividades.models import Atividade
from apps.usuarios.models import Usuario
from common.permissions import is_administrador


def listar_catalogo(
    usuario: Usuario,
    *,
    busca: str = "",
    tipo: str | None = None,
    nivel: int | None = None,
):
    """Catálogo sempre recortado pela instituição do usuário (RN-003)."""
    queryset = (
        Atividade.objects.select_related("instituicao")
        .prefetch_related("itens", "conteudos")
        .order_by("nivel_dificuldade", "titulo")
    )
    if not is_administrador(usuario):
        if usuario.instituicao_id is None:
            return queryset.none()
        queryset = queryset.filter(instituicao_id=usuario.instituicao_id)
    busca = busca.strip()
    if busca:
        queryset = queryset.filter(Q(titulo__icontains=busca) | Q(descricao__icontains=busca))
    if tipo:
        queryset = queryset.filter(tipo_atividade=tipo)
    if nivel is not None:
        queryset = queryset.filter(nivel_dificuldade=nivel)
    return queryset
