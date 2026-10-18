import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { destinoPorPerfil, rotas } from '@/app/router/paths';
import { useCadastro, useInstituicoesPublicas } from '../hooks';
import { cadastroSchema, type DadosCadastro, type PerfilCadastro } from '../schemas';

const PERFIS: { valor: PerfilCadastro; rotulo: string; descricao: string }[] = [
  {
    valor: 'RESPONSAVEL',
    rotulo: 'Responsável',
    descricao: 'Acompanha o progresso e conversa com os profissionais.',
  },
  {
    valor: 'PSICOLOGO',
    rotulo: 'Psicólogo',
    descricao: 'Cria planos, acompanha relatórios e recebe recomendações.',
  },
  {
    valor: 'FONOAUDIOLOGO',
    rotulo: 'Fonoaudiólogo',
    descricao: 'Cria planos, acompanha relatórios e recebe recomendações.',
  },
  {
    valor: 'PEDAGOGO',
    rotulo: 'Pedagogo',
    descricao: 'Cria planos, acompanha relatórios e recebe recomendações.',
  },
];

export function RegisterForm() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const cadastro = useCadastro();
  const instituicoes = useInstituicoesPublicas();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DadosCadastro>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      perfil: 'RESPONSAVEL',
      instituicaoId: 0,
      telefone: '',
      registroProfissional: '',
    },
  });

  const perfil = useWatch({ control, name: 'perfil' });
  const ehResponsavel = perfil === 'RESPONSAVEL';

  async function aoEnviar(dados: DadosCadastro) {
    setErro(null);
    try {
      const usuario = await cadastro.mutateAsync(dados);
      navigate(destinoPorPerfil(usuario.tipoUsuario), { replace: true });
    } catch (erroCadastro) {
      setErro(getApiErrorMessage(erroCadastro, 'Não foi possível concluir o cadastro.'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Escolha o perfil de acesso. O vínculo com a instituição é obrigatório.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-5">
          {erro ? <Alert tom="perigo">{erro}</Alert> : null}

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">Perfil de acesso</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERFIS.map((opcao) => (
                <label
                  key={opcao.valor}
                  className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/60"
                >
                  <input
                    type="radio"
                    value={opcao.valor}
                    className="mt-1 size-4 accent-primary"
                    {...register('perfil')}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{opcao.rotulo}</span>
                    <span className="block text-xs text-muted">{opcao.descricao}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.perfil?.message ? (
              <p role="alert" className="text-xs font-medium text-danger">
                {errors.perfil.message}
              </p>
            ) : null}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="nome" error={errors.nome?.message} required>
              <Input
                id="nome"
                autoComplete="name"
                invalido={Boolean(errors.nome)}
                {...register('nome')}
              />
            </Field>
            <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalido={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>
          </div>

          <Field
            label="Instituição"
            htmlFor="instituicaoId"
            error={errors.instituicaoId?.message}
            hint="Somente instituições com assinatura ativa."
            required
          >
            <Select
              id="instituicaoId"
              invalido={Boolean(errors.instituicaoId)}
              disabled={instituicoes.isLoading}
              {...register('instituicaoId', { valueAsNumber: true })}
            >
              <option value={0}>
                {instituicoes.isLoading ? 'Carregando instituições…' : 'Selecione uma instituição'}
              </option>
              {(instituicoes.data ?? []).map((instituicao) => (
                <option key={instituicao.id} value={instituicao.id}>
                  {instituicao.nomeFantasia}
                </option>
              ))}
            </Select>
          </Field>
          {instituicoes.isError ? (
            <Alert tom="perigo">Não foi possível carregar as instituições.</Alert>
          ) : null}

          {ehResponsavel ? (
            <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message} required>
              <Input
                id="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(31) 99999-0000"
                invalido={Boolean(errors.telefone)}
                {...register('telefone')}
              />
            </Field>
          ) : (
            <Field
              label="Registro profissional"
              htmlFor="registroProfissional"
              error={errors.registroProfissional?.message}
              hint="Ex.: CRP 06/12345, CRFa 2-9876 ou registro do MEC."
              required
            >
              <Input
                id="registroProfissional"
                invalido={Boolean(errors.registroProfissional)}
                {...register('registroProfissional')}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senha" htmlFor="senha" error={errors.senha?.message} required>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                invalido={Boolean(errors.senha)}
                {...register('senha')}
              />
            </Field>
            <Field
              label="Confirmar senha"
              htmlFor="confirmarSenha"
              error={errors.confirmarSenha?.message}
              required
            >
              <Input
                id="confirmarSenha"
                type="password"
                autoComplete="new-password"
                invalido={Boolean(errors.confirmarSenha)}
                {...register('confirmarSenha')}
              />
            </Field>
          </div>

          <Button type="submit" tamanho="grande" className="w-full" carregando={cadastro.isPending}>
            <UserPlus aria-hidden="true" className="size-5" />
            Criar conta
          </Button>

          <p className="text-center text-sm text-muted">
            Já tem conta?{' '}
            <Link to={rotas.login} className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
