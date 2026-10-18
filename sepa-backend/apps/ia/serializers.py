from rest_framework import serializers

from apps.atividades.serializers import AtividadeSerializer
from apps.ia.models import AnaliseAprendizado, RecomendacaoIA


class FatorSerializer(serializers.Serializer):
    metrica = serializers.CharField()
    valor = serializers.FloatField()
    peso = serializers.FloatField()


class AnaliseAprendizadoSerializer(serializers.ModelSerializer):
    aluno_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = AnaliseAprendizado
        fields = (
            "id",
            "data_analise",
            "pontuacao_curva",
            "tendencia",
            "observacoes_ia",
            "aluno_id",
        )


class RecomendacaoSerializer(serializers.ModelSerializer):
    aluno_id = serializers.IntegerField(source="analise.aluno_id", read_only=True)
    aluno_nome = serializers.CharField(source="analise.aluno.usuario.nome", read_only=True)
    analise_id = serializers.IntegerField(read_only=True)
    atividade_ids = serializers.SerializerMethodField()
    atividades = AtividadeSerializer(many=True, read_only=True)
    fatores = FatorSerializer(many=True, read_only=True)

    class Meta:
        model = RecomendacaoIA
        fields = (
            "id",
            "data_geracao",
            "descricao_recomendacao",
            "status",
            "analise_id",
            "atividade_ids",
            "nivel_sugerido",
            "nivel_atual",
            "fatores",
            "aluno_id",
            "aluno_nome",
            "atividades",
        )

    def get_atividade_ids(self, obj: RecomendacaoIA) -> list[int]:
        return [atividade.id for atividade in obj.atividades.all()]
