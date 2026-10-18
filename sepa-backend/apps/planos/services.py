from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.atividades.models import Atividade
from apps.instituicoes.models import Instituicao
from apps.planos.models import Contem, PlanoDeAtendimento
from apps.usuarios.models import Aluno, Usuario
from common.permissions import can_manage_plano, is_profissional
from common.services import registrar_auditoria


@transaction.atomic
def criar_plano(executante: Usuario, dados: dict, request=None) -> PlanoDeAtendimento:
    if not is_profissional(executante):
        raise PermissionDenied("Apenas profissionais podem criar planos de atendimento.")

    aluno: Aluno | None = dados.get("aluno")
    if aluno is None:
        raise ValidationError({"aluno_id": ["Selecione o aluno."]})
    if aluno.usuario.instituicao_id != executante.instituicao_id:
        raise PermissionDenied("Você não tem permissão para acessar este aluno.")

    plano = PlanoDeAtendimento.objects.create(
        nome_plano=dados["nome_plano"].strip(),
        data_inicio=dados["data_inicio"],
        objetivos=dados["objetivos"].strip(),
        profissional=executante.profissional,
        aluno=aluno,
    )
    registrar_auditoria(
        usuario=executante,
        acao="criar_plano",
        objeto=plano,
        detalhes={"alunoId": aluno.pk},
        request=request,
    )
    return plano


@transaction.atomic
def atualizar_plano(
    executante: Usuario, plano: PlanoDeAtendimento, dados: dict, request=None
) -> PlanoDeAtendimento:
    if not can_manage_plano(executante, plano):
        raise PermissionDenied("Você não tem permissão para editar este plano.")
    for campo in ("nome_plano", "data_inicio", "objetivos"):
        if campo in dados:
            valor = dados[campo]
            if isinstance(valor, str):
                valor = valor.strip()
            setattr(plano, campo, valor)
    plano.save()
    registrar_auditoria(
        usuario=executante,
        acao="atualizar_plano",
        objeto=plano,
        detalhes={campo: str(dados[campo]) for campo in dados if campo in dados},
        request=request,
    )
    return plano


@transaction.atomic
def excluir_plano(executante: Usuario, plano: PlanoDeAtendimento, request=None) -> None:
    if not can_manage_plano(executante, plano):
        raise PermissionDenied("Você não tem permissão para excluir este plano.")
    detalhes = {"nomePlano": plano.nome_plano, "alunoId": plano.aluno_id}
    registrar_auditoria(
        usuario=executante,
        acao="excluir_plano",
        objeto=plano,
        detalhes=detalhes,
        request=request,
    )
    plano.delete()


@transaction.atomic
def associar_atividade(
    executante: Usuario,
    plano: PlanoDeAtendimento,
    atividade: Atividade,
    request=None,
) -> PlanoDeAtendimento:
    if not can_manage_plano(executante, plano):
        raise PermissionDenied("Você não tem permissão para editar este plano.")
    if atividade.instituicao_id != plano.aluno.usuario.instituicao_id:
        raise PermissionDenied("A atividade pertence a outra instituição (RN-003).")

    Contem.objects.get_or_create(
        plano=plano,
        atividade=atividade,
        defaults={"nivel_atribuido": atividade.nivel_dificuldade},
    )
    if hasattr(plano, "_prefetched_objects_cache"):
        plano._prefetched_objects_cache.pop("entradas", None)
    registrar_auditoria(
        usuario=executante,
        acao="associar_atividade",
        objeto=plano,
        detalhes={"atividadeId": atividade.id},
        request=request,
    )
    return plano


@transaction.atomic
def remover_atividade(
    executante: Usuario,
    plano: PlanoDeAtendimento,
    atividade: Atividade,
    request=None,
) -> None:
    if not can_manage_plano(executante, plano):
        raise PermissionDenied("Você não tem permissão para editar este plano.")
    plano.atividades.remove(atividade)
    registrar_auditoria(
        usuario=executante,
        acao="remover_atividade",
        objeto=plano,
        detalhes={"atividadeId": atividade.id},
        request=request,
    )


def instituicao_do_aluno(aluno: Aluno) -> Instituicao | None:
    return aluno.usuario.instituicao
