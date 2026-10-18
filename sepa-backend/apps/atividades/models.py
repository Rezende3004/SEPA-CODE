from django.db import models

from apps.instituicoes.models import Instituicao


class ConteudoMultimidia(models.Model):
    nome_arquivo = models.CharField("nome do arquivo", max_length=255)
    tipo_arquivo = models.CharField("tipo do arquivo", max_length=50)
    url = models.CharField("URL", max_length=500)
    instituicao = models.ForeignKey(
        Instituicao,
        verbose_name="instituição",
        on_delete=models.PROTECT,
        related_name="conteudos",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "conteúdo multimídia"
        verbose_name_plural = "conteúdos multimídia"
        ordering = ["nome_arquivo"]
        indexes = [models.Index(fields=["instituicao"])]

    def __str__(self) -> str:
        return self.nome_arquivo


class Atividade(models.Model):
    class TipoAtividade(models.TextChoices):
        ASSOCIACAO = "ASSOCIACAO", "Associação imagem-palavra"
        SEQUENCIA = "SEQUENCIA", "Sequência de rotina"

    titulo = models.CharField("título", max_length=200)
    descricao = models.TextField("descrição", blank=True)
    nivel_dificuldade = models.PositiveSmallIntegerField("nível de dificuldade", default=1)
    tipo_atividade = models.CharField(
        "tipo de atividade",
        max_length=20,
        choices=TipoAtividade.choices,
    )
    instituicao = models.ForeignKey(
        Instituicao,
        verbose_name="instituição",
        on_delete=models.PROTECT,
        related_name="atividades",
    )
    conteudos = models.ManyToManyField(
        ConteudoMultimidia,
        through="Utiliza",
        related_name="atividades",
        blank=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "atividade"
        verbose_name_plural = "atividades"
        ordering = ["nivel_dificuldade", "titulo"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(nivel_dificuldade__gte=1) & models.Q(nivel_dificuldade__lte=5),
                name="atividade_nivel_entre_1_e_5",
            )
        ]
        indexes = [
            models.Index(fields=["instituicao", "tipo_atividade"]),
            models.Index(fields=["instituicao", "nivel_dificuldade"]),
        ]

    def __str__(self) -> str:
        return self.titulo


class ItemAtividade(models.Model):
    class TipoItem(models.TextChoices):
        EMOJI = "EMOJI", "Emoji"
        TEXTO = "TEXTO", "Texto"

    atividade = models.ForeignKey(
        Atividade,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    ordem = models.PositiveSmallIntegerField(default=1)
    tipo = models.CharField(max_length=10, choices=TipoItem.choices, default=TipoItem.EMOJI)
    valor = models.CharField("valor", max_length=100)
    rotulo = models.CharField("rótulo", max_length=100)
    dica = models.CharField("dica", max_length=255, blank=True)

    class Meta:
        verbose_name = "item de atividade"
        verbose_name_plural = "itens de atividade"
        ordering = ["ordem", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["atividade", "ordem"],
                name="item_atividade_ordem_unica",
            )
        ]
        indexes = [models.Index(fields=["atividade"])]

    def __str__(self) -> str:
        return f"{self.atividade_id}:{self.rotulo}"


class Utiliza(models.Model):
    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE)
    conteudo = models.ForeignKey(ConteudoMultimidia, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "utilização de conteúdo"
        verbose_name_plural = "utilizações de conteúdo"
        constraints = [
            models.UniqueConstraint(
                fields=["atividade", "conteudo"],
                name="utiliza_atividade_conteudo_unico",
            )
        ]

    def __str__(self) -> str:
        return f"{self.atividade_id} → {self.conteudo_id}"
