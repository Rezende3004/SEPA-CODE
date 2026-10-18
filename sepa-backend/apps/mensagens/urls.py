from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.mensagens.views import MarcarLidaView, MensagemViewSet

router = SimpleRouter()
router.register("mensagens", MensagemViewSet, basename="mensagens")

urlpatterns = [
    path("mensagens/<int:pk>/lida/", MarcarLidaView.as_view(), name="mensagem-lida"),
    path("", include(router.urls)),
]
