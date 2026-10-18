from __future__ import annotations

from apps.atividades.models import Atividade, ConteudoMultimidia, ItemAtividade, Utiliza
from apps.instituicoes.models import Instituicao


def criar_atividade(
    *,
    instituicao: Instituicao,
    titulo: str,
    nivel: int = 1,
    tipo: str = "ASSOCIACAO",
) -> Atividade:
    """Cria uma atividade completa (itens + conteúdo) para os testes."""
    atividade = Atividade.objects.create(
        titulo=titulo,
        descricao=f"Descrição de {titulo}",
        nivel_dificuldade=nivel,
        tipo_atividade=tipo,
        instituicao=instituicao,
    )
    conteudo = ConteudoMultimidia.objects.create(
        nome_arquivo=f"{titulo.lower().replace(' ', '-')}.svg",
        tipo_arquivo="image/svg+xml",
        url=f"/mocks/conteudos/{titulo}.svg",
        instituicao=instituicao,
    )
    Utiliza.objects.create(atividade=atividade, conteudo=conteudo)
    for indice, rotulo in enumerate(["Cachorro", "Gato", "Coelho", "Pássaro"], start=1):
        ItemAtividade.objects.create(
            atividade=atividade,
            ordem=indice,
            tipo="EMOJI",
            valor="🐶",
            rotulo=rotulo,
            dica=f"Dica de {rotulo}",
        )
    return atividade
