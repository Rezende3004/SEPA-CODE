import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { ForbiddenPage } from '@/app/pages/ForbiddenPage';
import { HomeRedirect } from '@/app/pages/HomeRedirect';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { PainelPlaceholder } from '@/app/pages/PainelPlaceholder';
import { destinoPorPerfil, rotas } from './paths';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

function PainelPorPerfil() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to={rotas.login} replace />;
  return <Navigate to={destinoPorPerfil(usuario.tipoUsuario)} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        element={
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        }
      >
        <Route path={rotas.login} element={<LoginPage />} />
        <Route path={rotas.cadastro} element={<RegisterPage />} />
      </Route>

      <Route path={rotas.proibido} element={<ForbiddenPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<RequireRole perfis={['PROFISSIONAL']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path={rotas.profissional.raiz}
              element={
                <PainelPlaceholder
                  titulo="Visão geral do profissional"
                  descricao="Alunos, planos, relatórios e recomendações da instituição."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole perfis={['ALUNO']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path={rotas.aluno.raiz}
              element={
                <PainelPlaceholder
                  titulo="Minhas atividades"
                  descricao="Atividades atribuídas ao aluno, com execução guiada e acessível."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole perfis={['RESPONSAVEL']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path={rotas.responsavel.raiz}
              element={
                <PainelPlaceholder
                  titulo="Progresso dos meus filhos"
                  descricao="Visão simplificada do acompanhamento e canal com os profissionais."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole perfis={['ADMINISTRADOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path={rotas.admin.raiz}
              element={
                <PainelPlaceholder
                  titulo="Administração da plataforma"
                  descricao="Instituições, assinaturas e contas de profissionais."
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="/painel" element={<PainelPorPerfil />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
