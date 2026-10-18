import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/lib/api-client';
import { useCriarAluno, useResponsaveis } from '../hooks';
import { alunoSchema, type DadosAluno } from '../schemas';

interface AlunoFormModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const valoresIniciais: DadosAluno = {
  nome: '',
  email: '',
  dataNascimento: '',
  observacoes: '',
  responsavelId: 0,
};

export function AlunoFormModal({ aberto, onFechar }: AlunoFormModalProps) {
  const responsaveis = useResponsaveis();
  const criar = useCriarAluno();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DadosAluno>({
    resolver: zodResolver(alunoSchema),
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (aberto) {
      reset(valoresIniciais);
    }
  }, [aberto, reset]);

  function fechar() {
    setErro(null);
    onFechar();
  }

  async function aoEnviar(dados: DadosAluno) {
    setErro(null);
    try {
      await criar.mutateAsync({
        ...dados,
        observacoes: dados.observacoes ?? '',
      });
      fechar();
    } catch (erroCriacao) {
      const errosCampo = getApiFieldErrors(erroCriacao);
      let mapeado = false;
      for (const campo of ['nome', 'email', 'dataNascimento', 'responsavelId'] as const) {
        if (errosCampo[campo]) {
          setError(campo, { message: errosCampo[campo] });
          mapeado = true;
        }
      }
      if (!mapeado) {
        setErro(getApiErrorMessage(erroCriacao, 'Não foi possível cadastrar o aluno.'));
      }
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo="Novo aluno"
      descricao="O vínculo com um responsável é obrigatório (RN-001)."
      largura="largo"
      rodape={
        <>
          <Button variante="fantasma" onClick={fechar} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-aluno" carregando={criar.isPending}>
            Cadastrar aluno
          </Button>
        </>
      }
    >
      <form id="form-aluno" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        {erro ? <Alert tom="perigo">{erro}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" htmlFor="aluno-nome" error={errors.nome?.message} required>
            <Input
              id="aluno-nome"
              autoComplete="off"
              invalido={Boolean(errors.nome)}
              aria-describedby={errors.nome ? 'aluno-nome-erro' : undefined}
              {...register('nome')}
            />
          </Field>
          <Field label="E-mail" htmlFor="aluno-email" error={errors.email?.message} required>
            <Input
              id="aluno-email"
              type="email"
              autoComplete="off"
              invalido={Boolean(errors.email)}
              aria-describedby={errors.email ? 'aluno-email-erro' : undefined}
              {...register('email')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Data de nascimento"
            htmlFor="aluno-nascimento"
            error={errors.dataNascimento?.message}
            required
          >
            <Input
              id="aluno-nascimento"
              type="date"
              invalido={Boolean(errors.dataNascimento)}
              aria-describedby={errors.dataNascimento ? 'aluno-nascimento-erro' : undefined}
              {...register('dataNascimento')}
            />
          </Field>

          <Field
            label="Responsável"
            htmlFor="aluno-responsavel"
            error={errors.responsavelId?.message}
            hint="Apenas responsáveis da sua instituição."
            required
          >
            <Select
              id="aluno-responsavel"
              invalido={Boolean(errors.responsavelId)}
              disabled={responsaveis.isLoading}
              aria-describedby={errors.responsavelId ? 'aluno-responsavel-erro' : undefined}
              {...register('responsavelId', { valueAsNumber: true })}
            >
              <option value={0}>
                {responsaveis.isLoading ? 'Carregando responsáveis…' : 'Selecione o responsável'}
              </option>
              {(responsaveis.data ?? []).map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nome} — {responsavel.email}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Observações"
          htmlFor="aluno-observacoes"
          error={errors.observacoes?.message}
          hint="Preferências, sensibilidades e informações relevantes para o atendimento."
        >
          <Textarea
            id="aluno-observacoes"
            rows={3}
            invalido={Boolean(errors.observacoes)}
            {...register('observacoes')}
          />
        </Field>

        {responsaveis.isError ? (
          <Alert tom="atencao">
            Não foi possível carregar os responsáveis. Verifique a conexão e tente novamente.
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}
