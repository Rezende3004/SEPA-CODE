from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.planos.views import PlanoViewSet

router = SimpleRouter()
router.register("planos", PlanoViewSet, basename="planos")

urlpatterns = [path("", include(router.urls))]
