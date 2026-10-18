from rest_framework import serializers

from apps.atividades.serializers import AtividadeSerializer
from apps.planos.models import PlanoDeAtendimento


class PlanoSerializer(serializers.ModelSerializer):
    aluno_id = serializers.IntegerField(read_only=True)
    profissional_id = serializers.IntegerField(read_only=True)
    aluno_nome = serializers.CharField(source="aluno.usuario.nome", read_only=True)
    profissional_nome = serializers.CharField(source="profissional.usuario.nome", read_only=True)
    atividade_ids = serializers.SerializerMethodField()
    atividades = AtividadeSerializer(many=True, read_only=True)

    class Meta:
        model = PlanoDeAtendimento
        fields = (
            "id",
            "nome_plano",
            "data_inicio",
            "objetivos",
            "profissional_id",
            "aluno_id",
            "aluno_nome",
            "profissional_nome",
            "atividade_ids",
            "atividades",
        )

    def get_atividade_ids(self, obj: PlanoDeAtendimento) -> list[int]:
        return [atividade.id for atividade in obj.atividades.all()]


class PlanoWriteSerializer(serializers.Serializer):
    nome_plano = serializers.CharField(min_length=3, max_length=150)
    data_inicio = serializers.DateField()
    objetivos = serializers.CharField(min_length=10)
    aluno_id = serializers.IntegerField(required=False)


class AssociarAtividadeSerializer(serializers.Serializer):
    atividade_id = serializers.IntegerField()
