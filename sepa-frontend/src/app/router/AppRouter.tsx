import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ProfissionalDashboardPage } from '@/features/alunos/pages/ProfissionalDashboardPage';
import { AlunosPage } from '@/features/alunos/pages/AlunosPage';
import { AlunoDetailPage } from '@/features/alunos/pages/AlunoDetailPage';
import { CatalogoPage } from '@/features/atividades/pages/CatalogoPage';
import { PlanoDetailPage } from '@/features/planos/pages/PlanoDetailPage';
import { AlunoLayout } from '@/app/layouts/AlunoLayout';
import { AlunoHomePage } from '@/features/execucao/pages/AlunoHomePage';
import { ExecutarAtividadePage } from '@/features/execucao/pages/ExecutarAtividadePage';
import { PreferenciasPage } from '@/features/execucao/pages/PreferenciasPage';
import { RelatoriosPage } from '@/features/relatorios/pages/RelatoriosPage';
import { RelatorioAlunoPage } from '@/features/relatorios/pages/RelatorioAlunoPage';
import { ResponsavelHomePage } from '@/features/responsavel/pages/ResponsavelHomePage';
import { FilhoDetailPage } from '@/features/responsavel/pages/FilhoDetailPage';
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
            <Route path={rotas.profissional.raiz} element={<ProfissionalDashboardPage />} />
            <Route path={rotas.profissional.alunos} element={<AlunosPage />} />
            <Route path="/profissional/alunos/:alunoId" element={<AlunoDetailPage />} />
            <Route
              path="/profissional/alunos/:alunoId/planos/:planoId"
              element={<PlanoDetailPage />}
            />
            <Route path={rotas.profissional.atividades} element={<CatalogoPage />} />
            <Route path={rotas.profissional.relatorios} element={<RelatoriosPage />} />
            <Route path="/profissional/relatorios/:alunoId" element={<RelatorioAlunoPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole perfis={['ALUNO']} />}>
          <Route element={<AlunoLayout />}>
            <Route path={rotas.aluno.raiz} element={<AlunoHomePage />} />
            <Route path="/aluno/atividades/:atividadeId" element={<ExecutarAtividadePage />} />
            <Route path={rotas.aluno.preferencias} element={<PreferenciasPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole perfis={['RESPONSAVEL']} />}>
          <Route element={<DashboardLayout />}>
            <Route path={rotas.responsavel.raiz} element={<ResponsavelHomePage />} />
            <Route path="/responsavel/filhos/:alunoId" element={<FilhoDetailPage />} />
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
