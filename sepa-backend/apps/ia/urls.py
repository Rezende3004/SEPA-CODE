from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.ia.views import AnalisarView, RecomendacaoViewSet

router = SimpleRouter()
router.register("recomendacoes", RecomendacaoViewSet, basename="recomendacoes")

urlpatterns = [
    path("ia/analisar/", AnalisarView.as_view(), name="ia-analisar"),
    path("", include(router.urls)),
]
