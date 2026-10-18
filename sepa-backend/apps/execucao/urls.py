from django.urls import path

from apps.execucao.views import HistoricoCreateView

urlpatterns = [
    path("historico/", HistoricoCreateView.as_view(), name="historico"),
]
