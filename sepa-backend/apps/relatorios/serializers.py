from rest_framework import serializers


class PontoCurvaSerializer(serializers.Serializer):
    data = serializers.DateTimeField()
    resultado = serializers.IntegerField()
    media_movel = serializers.FloatField()
    ewma = serializers.FloatField()


class ResumoDesempenhoSerializer(serializers.Serializer):
    media_resultado = serializers.FloatField()
    total_tentativas = serializers.IntegerField()
    total_execucoes = serializers.IntegerField()
    pedidos_ajuda = serializers.IntegerField()
    slope = serializers.FloatField()
    tendencia = serializers.CharField()


class DesempenhoPorAtividadeSerializer(serializers.Serializer):
    atividade_id = serializers.IntegerField()
    titulo = serializers.CharField()
    nivel_dificuldade = serializers.IntegerField()
    media_resultado = serializers.FloatField()
    total_execucoes = serializers.IntegerField()
    tendencia = serializers.CharField()
    pontos = PontoCurvaSerializer(many=True)


class RelatorioDesempenhoSerializer(serializers.Serializer):
    aluno_id = serializers.IntegerField()
    aluno_nome = serializers.CharField()
    periodo_inicio = serializers.DateTimeField()
    periodo_fim = serializers.DateTimeField()
    resumo = ResumoDesempenhoSerializer()
    por_atividade = DesempenhoPorAtividadeSerializer(many=True)
    alerta_estagnacao = serializers.BooleanField()
    observacoes = serializers.CharField()
