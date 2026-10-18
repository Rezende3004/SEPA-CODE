import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { destinoPorPerfil, rotas } from '@/app/router/paths';
import { useLogin } from '../hooks';
import { loginSchema, type DadosLogin } from '../schemas';

const CONTAS_DEMO = [
  { rotulo: 'Psicóloga (instituição A)', email: 'ana.psicologa@sepa.exemplo' },
  { rotulo: 'Pedagoga (instituição A)', email: 'carla.pedagoga@sepa.exemplo' },
  { rotulo: 'Responsável (2 filhos)', email: 'mariana.responsavel@sepa.exemplo' },
  { rotulo: 'Aluno (Lucas)', email: 'lucas.aluno@sepa.exemplo' },
  { rotulo: 'Administrador', email: 'admin@sepa.exemplo' },
];

const SENHA_DEMO = 'Sepa@2026';

export function LoginForm() {
  const navigate = useNavigate();
  const local = useLocation();
  const [erro, setErro] = useState<string | null>(null);
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DadosLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const origem = (local.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function aoEnviar(dados: DadosLogin) {
    setErro(null);
    try {
      const usuario = await login.mutateAsync(dados);
      navigate(origem ?? destinoPorPerfil(usuario.tipoUsuario), { replace: true });
    } catch (erroLogin) {
      setErro(getApiErrorMessage(erroLogin, 'E-mail ou senha inválidos.'));
    }
  }

  function preencherConta(email: string) {
    setValue('email', email, { shouldValidate: true });
    setValue('senha', SENHA_DEMO, { shouldValidate: true });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Entrar na sua conta</CardTitle>
          <CardDescription>
            Acesse de acordo com o seu perfil: profissional, responsável, aluno ou administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
            {erro ? <Alert tom="perigo">{erro}</Alert> : null}

            <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@instituicao.exemplo"
                invalido={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Field label="Senha" htmlFor="senha" error={errors.senha?.message} required>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                invalido={Boolean(errors.senha)}
                {...register('senha')}
              />
            </Field>

            <Button type="submit" tamanho="grande" className="w-full" carregando={login.isPending}>
              <LogIn aria-hidden="true" className="size-5" />
              Entrar
            </Button>

            <p className="text-center text-sm text-muted">
              Ainda não tem conta?{' '}
              <Link to={rotas.cadastro} className="font-semibold text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Contas de demonstração</CardTitle>
          <CardDescription>
            Dados fictícios do seed. Clique para preencher o formulário (senha {SENHA_DEMO}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CONTAS_DEMO.map((conta) => (
            <button
              key={conta.email}
              type="button"
              onClick={() => preencherConta(conta.email)}
              className="w-full rounded-lg border border-line p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/50"
            >
              <span className="block text-sm font-semibold text-ink">{conta.rotulo}</span>
              <span className="block truncate text-xs text-muted">{conta.email}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
