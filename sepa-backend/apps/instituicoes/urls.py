from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.instituicoes.views import InstituicaoAdminViewSet, InstituicaoPublicaListView

router = SimpleRouter()
router.register("admin/instituicoes", InstituicaoAdminViewSet, basename="admin-instituicoes")

urlpatterns = [
    path("instituicoes/", InstituicaoPublicaListView.as_view(), name="instituicoes-publicas"),
    path("", include(router.urls)),
]
