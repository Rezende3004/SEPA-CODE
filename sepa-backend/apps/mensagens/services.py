from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.atividades.models import Atividade
from apps.mensagens.models import Mensagem
from apps.usuarios.models import Aluno, Usuario
from common.permissions import is_profissional, is_responsavel
from common.services import registrar_auditoria


def profissional_e_responsavel_compartilham_aluno(
    profissional: Usuario, responsavel: Usuario
) -> bool:
    if not (is_profissional(profissional) and is_responsavel(responsavel)):
        return False
    if profissional.instituicao_id != responsavel.instituicao_id:
        return False
    return Aluno.objects.filter(
        responsavel_id=responsavel.id,
        planos__profissional_id=profissional.id,
    ).exists()


def pode_conversar(remetente: Usuario, destinatario: Usuario) -> bool:
    return profissional_e_responsavel_compartilham_aluno(
        remetente, destinatario
    ) or profissional_e_responsavel_compartilham_aluno(destinatario, remetente)


@transaction.atomic
def enviar_mensagem(
    remetente: Usuario, destinatario: Usuario, conteudo_texto: str, request=None
) -> Mensagem:
    texto = conteudo_texto.strip()
    if not texto:
        raise ValidationError({"conteudo_texto": ["Escreva uma mensagem."]})
    if remetente.pk == destinatario.pk:
        raise ValidationError({"destinatario_id": ["Escolha outra pessoa para conversar."]})
    if not pode_conversar(remetente, destinatario):
        raise PermissionDenied(
            "Só é possível conversar com profissionais ou responsáveis que compartilham um aluno."
        )
    mensagem = Mensagem.objects.create(
        remetente=remetente,
        destinatario=destinatario,
        conteudo_texto=texto,
    )
    registrar_auditoria(
        usuario=remetente,
        acao="enviar_mensagem",
        objeto=mensagem,
        detalhes={"destinatarioId": destinatario.id},
        request=request,
    )
    return mensagem


@transaction.atomic
def marcar_mensagem_lida(mensagem: Mensagem, usuario: Usuario, request=None) -> Mensagem:
    if mensagem.destinatario_id != usuario.id:
        raise PermissionDenied("Somente o destinatário pode marcar a mensagem como lida.")
    mensagem.lida = True
    mensagem.save(update_fields=["lida"])
    registrar_auditoria(
        usuario=usuario,
        acao="ler_mensagem",
        objeto=mensagem,
        request=request,
    )
    return mensagem


def atividade_visivel_para_aluno(aluno: Aluno, atividade: Atividade) -> bool:
    return aluno.planos.filter(atividades=atividade).exists()
