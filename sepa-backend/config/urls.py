from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from config.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", include("apps.usuarios.urls")),
    path("api/", include("apps.instituicoes.urls")),
    path("api/", include("apps.atividades.urls")),
    path("api/", include("apps.planos.urls")),
    path("api/", include("apps.execucao.urls")),
    path("api/", include("apps.relatorios.urls")),
    path("api/", include("apps.ia.urls")),
    path("api/", include("apps.mensagens.urls")),
]
