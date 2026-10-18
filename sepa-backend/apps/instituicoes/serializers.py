from rest_framework import serializers

from apps.instituicoes.models import Instituicao


class InstituicaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instituicao
        fields = ("id", "nome_fantasia", "cnpj", "endereco", "status_assinatura")


class InstituicaoPublicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instituicao
        fields = ("id", "nome_fantasia")


class InstituicaoStatusSerializer(serializers.Serializer):
    status_assinatura = serializers.ChoiceField(choices=Instituicao.StatusAssinatura.choices)
