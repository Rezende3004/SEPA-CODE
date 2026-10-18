from rest_framework import serializers

from apps.atividades.serializers import AtividadeSerializer
from apps.planos.models import PlanoDeAtendimento


class AtividadeDoPlanoSerializer(AtividadeSerializer):
    nivel_atribuido = serializers.SerializerMethodField()
    nivel_dificuldade = serializers.SerializerMethodField()

    class Meta(AtividadeSerializer.Meta):
        fields = AtividadeSerializer.Meta.fields + ("nivel_atribuido",)

    def get_nivel_atribuido(self, obj):
        return getattr(obj, "nivel_atribuido_plano", obj.nivel_dificuldade)

    def get_nivel_dificuldade(self, obj) -> int:
        return self.get_nivel_atribuido(obj)


class PlanoSerializer(serializers.ModelSerializer):
    aluno_id = serializers.IntegerField(read_only=True)
    profissional_id = serializers.IntegerField(read_only=True)
    aluno_nome = serializers.CharField(source="aluno.usuario.nome", read_only=True)
    profissional_nome = serializers.CharField(source="profissional.usuario.nome", read_only=True)
    atividade_ids = serializers.SerializerMethodField()
    atividades = serializers.SerializerMethodField()

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
        return [entrada.atividade_id for entrada in obj.entradas.all()]

    def get_atividades(self, obj: PlanoDeAtendimento) -> list[dict]:
        atividades = []
        for entrada in obj.entradas.all():
            atividade = entrada.atividade
            atividade.nivel_atribuido_plano = entrada.nivel_atribuido
            atividades.append(atividade)
        return AtividadeDoPlanoSerializer(atividades, many=True).data


class PlanoWriteSerializer(serializers.Serializer):
    nome_plano = serializers.CharField(min_length=3, max_length=150)
    data_inicio = serializers.DateField()
    objetivos = serializers.CharField(min_length=10)
    aluno_id = serializers.IntegerField(required=False)


class AssociarAtividadeSerializer(serializers.Serializer):
    atividade_id = serializers.IntegerField()
