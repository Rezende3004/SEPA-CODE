from django.urls import path

from apps.atividades.views import AlunoAtividadesView, AtividadeListView

urlpatterns = [
    path("atividades/", AtividadeListView.as_view(), name="atividades"),
    path("aluno/atividades/", AlunoAtividadesView.as_view(), name="aluno-atividades"),
]
