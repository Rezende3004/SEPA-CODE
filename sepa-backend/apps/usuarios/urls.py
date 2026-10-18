from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.usuarios.views import (
    AlunoViewSet,
    ProfissionalAdminViewSet,
    ResponsavelListView,
    UsuarioResumoView,
)
from apps.usuarios.views_auth import LoginView, LogoutView, MeView, RefreshView, RegisterView

router = SimpleRouter()
router.register("alunos", AlunoViewSet, basename="alunos")
router.register("admin/profissionais", ProfissionalAdminViewSet, basename="admin-profissionais")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="me"),
    path("responsaveis/", ResponsavelListView.as_view(), name="responsaveis"),
    path("usuarios/<int:pk>/", UsuarioResumoView.as_view(), name="usuario-resumo"),
    path("", include(router.urls)),
]
