from rest_framework import serializers

from apps.atividades.models import Atividade, ItemAtividade


class ItemAtividadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemAtividade
        fields = ("id", "tipo", "valor", "rotulo", "dica")


class AtividadeSerializer(serializers.ModelSerializer):
    instituicao_id = serializers.IntegerField(read_only=True)
    conteudo_ids = serializers.SerializerMethodField()
    itens = ItemAtividadeSerializer(many=True, read_only=True)

    class Meta:
        model = Atividade
        fields = (
            "id",
            "titulo",
            "descricao",
            "nivel_dificuldade",
            "tipo_atividade",
            "instituicao_id",
            "conteudo_ids",
            "itens",
        )

    def get_conteudo_ids(self, obj: Atividade) -> list[int]:
        return [conteudo.id for conteudo in obj.conteudos.all()]


class AtividadeAtribuidaSerializer(AtividadeSerializer):
    plano_id = serializers.SerializerMethodField()
    plano_nome = serializers.SerializerMethodField()
    total_execucoes = serializers.SerializerMethodField()
    ultima_execucao = serializers.SerializerMethodField()

    class Meta(AtividadeSerializer.Meta):
        fields = AtividadeSerializer.Meta.fields + (
            "plano_id",
            "plano_nome",
            "total_execucoes",
            "ultima_execucao",
        )

    def get_plano_id(self, obj: Atividade) -> int:
        return obj.plano_id_atribuido

    def get_plano_nome(self, obj: Atividade) -> str:
        return obj.plano_nome_atribuido

    def get_total_execucoes(self, obj: Atividade) -> int:
        return getattr(obj, "total_execucoes_atribuido", 0)

    def get_ultima_execucao(self, obj: Atividade) -> str | None:
        data = getattr(obj, "ultima_execucao_atribuida", None)
        return data.isoformat() if data else None
