from rest_framework import serializers

from apps.mensagens.models import Mensagem


class MensagemSerializer(serializers.ModelSerializer):
    remetente_id = serializers.IntegerField(read_only=True)
    destinatario_id = serializers.IntegerField(read_only=True)
    remetente_nome = serializers.CharField(source="remetente.nome", read_only=True)
    destinatario_nome = serializers.CharField(source="destinatario.nome", read_only=True)

    class Meta:
        model = Mensagem
        fields = (
            "id",
            "conteudo_texto",
            "data_envio",
            "remetente_id",
            "destinatario_id",
            "lida",
            "remetente_nome",
            "destinatario_nome",
        )


class MensagemCreateSerializer(serializers.Serializer):
    destinatario_id = serializers.IntegerField()
    conteudo_texto = serializers.CharField(min_length=1, max_length=4000)
