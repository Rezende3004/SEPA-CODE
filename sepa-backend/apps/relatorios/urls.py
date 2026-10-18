from django.urls import path

from apps.relatorios.views import RelatorioDesempenhoView

urlpatterns = [
    path(
        "relatorios/desempenho/",
        RelatorioDesempenhoView.as_view(),
        name="relatorio-desempenho",
    ),
]
