from rest_framework import serializers

from apps.execucao.models import HistoricoAtividade


class HistoricoSerializer(serializers.ModelSerializer):
    aluno_id = serializers.IntegerField(read_only=True)
    atividade_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = HistoricoAtividade
        fields = (
            "id",
            "data_hora",
            "resultado",
            "tentativas",
            "tempo_resposta_seg",
            "feedback",
            "aluno_id",
            "atividade_id",
            "pediu_ajuda",
        )


class HistoricoCreateSerializer(serializers.Serializer):
    atividade_id = serializers.IntegerField()
    resultado = serializers.IntegerField(min_value=0, max_value=100)
    tentativas = serializers.IntegerField(min_value=1)
    tempo_resposta_seg = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(min_length=1, max_length=4000)
    pediu_ajuda = serializers.BooleanField()
