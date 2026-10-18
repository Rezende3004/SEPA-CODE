from __future__ import annotations

import factory

from apps.instituicoes.models import Instituicao


class InstituicaoFactory(factory.django.DjangoModelFactory):
    """Fábrica usada nos testes para instituições isoladas."""

    class Meta:
        model = Instituicao
        django_get_or_create = ("cnpj",)

    nome_fantasia = factory.Sequence(lambda n: f"Instituição de teste {n}")
    cnpj = factory.Sequence(lambda n: f"{n:014d}")
    endereco = "Rua de teste"
    status_assinatura = Instituicao.StatusAssinatura.ATIVA
