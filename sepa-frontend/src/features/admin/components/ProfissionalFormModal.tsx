import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { ESPECIALIDADES } from '@/shared/types';
import { useCriarProfissionalAdmin, useInstituicoesAdmin } from '../hooks';
import { profissionalAdminSchema, type DadosProfissionalAdmin } from '../api';

interface ProfissionalFormModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const valoresIniciais: DadosProfissionalAdmin = {
  nome: '',
  email: '',
  senha: '',
  especialidade: 'PSICOLOGO',
  registroProfissional: '',
  instituicaoId: 0,
};

const rotuloEspecialidade = {
  PSICOLOGO: 'Psicólogo',
  FONOAUDIOLOGO: 'Fonoaudiólogo',
  PEDAGOGO: 'Pedagogo',
} as const;

export function ProfissionalFormModal({ aberto, onFechar }: ProfissionalFormModalProps) {
  const instituicoes = useInstituicoesAdmin();
  const criar = useCriarProfissionalAdmin();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosProfissionalAdmin>({
    resolver: zodResolver(profissionalAdminSchema),
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (aberto) reset(valoresIniciais);
  }, [aberto, reset]);

  function fechar() {
    setErro(null);
    onFechar();
  }

  async function aoEnviar(dados: DadosProfissionalAdmin) {
    setErro(null);
    try {
      await criar.mutateAsync(dados);
      fechar();
    } catch (erroCriacao) {
      setErro(getApiErrorMessage(erroCriacao, 'Não foi possível criar a conta do profissional.'));
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo="Nova conta de profissional"
      descricao="A conta é criada ativa e vinculada à instituição escolhida."
      largura="largo"
      rodape={
        <>
          <Button variante="fantasma" onClick={fechar} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-profissional" carregando={criar.isPending}>
            Criar conta
          </Button>
        </>
      }
    >
      <form id="form-profissional" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        {erro ? <Alert tom="perigo">{erro}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" htmlFor="prof-nome" error={errors.nome?.message} required>
            <Input id="prof-nome" invalido={Boolean(errors.nome)} {...register('nome')} />
          </Field>
          <Field label="E-mail" htmlFor="prof-email" error={errors.email?.message} required>
            <Input
              id="prof-email"
              type="email"
              invalido={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Especialidade"
            htmlFor="prof-especialidade"
            error={errors.especialidade?.message}
            required
          >
            <Select
              id="prof-especialidade"
              invalido={Boolean(errors.especialidade)}
              {...register('especialidade')}
            >
              {ESPECIALIDADES.map((especialidade) => (
                <option key={especialidade} value={especialidade}>
                  {rotuloEspecialidade[especialidade]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Registro profissional"
            htmlFor="prof-registro"
            error={errors.registroProfissional?.message}
            required
          >
            <Input
              id="prof-registro"
              invalido={Boolean(errors.registroProfissional)}
              {...register('registroProfissional')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Instituição"
            htmlFor="prof-instituicao"
            error={errors.instituicaoId?.message}
            required
          >
            <Select
              id="prof-instituicao"
              invalido={Boolean(errors.instituicaoId)}
              disabled={instituicoes.isLoading}
              {...register('instituicaoId', { valueAsNumber: true })}
            >
              <option value={0}>
                {instituicoes.isLoading ? 'Carregando instituições…' : 'Selecione a instituição'}
              </option>
              {(instituicoes.data ?? []).map((instituicao) => (
                <option key={instituicao.id} value={instituicao.id}>
                  {instituicao.nomeFantasia}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Senha inicial"
            htmlFor="prof-senha"
            error={errors.senha?.message}
            hint="Mínimo de 8 caracteres. Compartilhe com o profissional por um canal seguro."
            required
          >
            <Input
              id="prof-senha"
              type="password"
              autoComplete="new-password"
              invalido={Boolean(errors.senha)}
              {...register('senha')}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
