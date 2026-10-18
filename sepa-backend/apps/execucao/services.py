from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.atividades.models import Atividade
from apps.execucao.models import HistoricoAtividade
from apps.planos.models import Contem
from apps.usuarios.models import Aluno, Usuario
from common.services import registrar_auditoria


@transaction.atomic
def registrar_execucao(
    aluno: Aluno, dados: dict, executante: Usuario, request=None
) -> HistoricoAtividade:
    if aluno.usuario_id != executante.id:
        raise PermissionDenied("Um aluno só pode registrar o próprio histórico.")

    try:
        atividade = Atividade.objects.get(pk=dados["atividade_id"])
    except Atividade.DoesNotExist as exc:
        raise ValidationError({"atividade_id": ["Atividade não encontrada."]}) from exc

    if atividade.instituicao_id != aluno.usuario.instituicao_id:
        raise PermissionDenied("A atividade pertence a outra instituição (RN-003).")

    pertence_ao_plano = Contem.objects.filter(
        plano__aluno=aluno,
        atividade=atividade,
    ).exists()
    if not pertence_ao_plano:
        raise ValidationError({"atividade_id": ["A atividade não está atribuída a este aluno."]})

    historico = HistoricoAtividade.objects.create(
        aluno=aluno,
        atividade=atividade,
        resultado=dados["resultado"],
        tentativas=dados["tentativas"],
        tempo_resposta_seg=dados["tempo_resposta_seg"],
        feedback=dados["feedback"].strip(),
        pediu_ajuda=dados["pediu_ajuda"],
    )
    registrar_auditoria(
        usuario=executante,
        acao="registrar_historico",
        objeto=historico,
        detalhes={"atividadeId": atividade.id, "resultado": dados["resultado"]},
        request=request,
    )
    return historico
