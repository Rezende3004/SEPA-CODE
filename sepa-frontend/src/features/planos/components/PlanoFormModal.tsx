import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PlanoDetalhado } from '@/shared/types';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Textarea } from '@/shared/components/ui/Textarea';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { useAtualizarPlano, useCriarPlano } from '../hooks';
import { planoSchema, type DadosPlano } from '../schemas';

interface PlanoFormModalProps {
  aberto: boolean;
  alunoId: number;
  plano?: PlanoDetalhado;
  onFechar: () => void;
}

function valoresIniciais(plano?: PlanoDetalhado): DadosPlano {
  return {
    nomePlano: plano?.nomePlano ?? '',
    dataInicio: plano?.dataInicio.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    objetivos: plano?.objetivos ?? '',
  };
}

export function PlanoFormModal({ aberto, alunoId, plano, onFechar }: PlanoFormModalProps) {
  const criar = useCriarPlano(alunoId);
  const atualizar = useAtualizarPlano(plano?.id ?? 0);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosPlano>({
    resolver: zodResolver(planoSchema),
    defaultValues: valoresIniciais(plano),
  });

  useEffect(() => {
    if (aberto) {
      reset(valoresIniciais(plano));
    }
  }, [aberto, plano, reset]);

  const salvando = criar.isPending || atualizar.isPending;

  function fechar() {
    setErro(null);
    onFechar();
  }

  async function aoEnviar(dados: DadosPlano) {
    setErro(null);
    try {
      if (plano) {
        await atualizar.mutateAsync(dados);
      } else {
        await criar.mutateAsync(dados);
      }
      fechar();
    } catch (erroPlano) {
      setErro(getApiErrorMessage(erroPlano, 'Não foi possível salvar o plano.'));
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo={plano ? 'Editar plano de atendimento' : 'Novo plano de atendimento'}
      descricao="O plano organiza objetivos e atividades atribuídas ao aluno."
      rodape={
        <>
          <Button variante="fantasma" onClick={fechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-plano" carregando={salvando}>
            {plano ? 'Salvar alterações' : 'Criar plano'}
          </Button>
        </>
      }
    >
      <form id="form-plano" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        {erro ? <Alert tom="perigo">{erro}</Alert> : null}

        <Field
          label="Nome do plano"
          htmlFor="plano-nome"
          error={errors.nomePlano?.message}
          required
        >
          <Input
            id="plano-nome"
            invalido={Boolean(errors.nomePlano)}
            aria-describedby={errors.nomePlano ? 'plano-nome-erro' : undefined}
            {...register('nomePlano')}
          />
        </Field>

        <Field
          label="Data de início"
          htmlFor="plano-inicio"
          error={errors.dataInicio?.message}
          required
        >
          <Input
            id="plano-inicio"
            type="date"
            invalido={Boolean(errors.dataInicio)}
            aria-describedby={errors.dataInicio ? 'plano-inicio-erro' : undefined}
            {...register('dataInicio')}
          />
        </Field>

        <Field
          label="Objetivos"
          htmlFor="plano-objetivos"
          error={errors.objetivos?.message}
          hint="Descreva os objetivos pedagógicos e terapêuticos do plano."
          required
        >
          <Textarea
            id="plano-objetivos"
            rows={5}
            invalido={Boolean(errors.objetivos)}
            aria-describedby={errors.objetivos ? 'plano-objetivos-erro' : undefined}
            {...register('objetivos')}
          />
        </Field>
      </form>
    </Modal>
  );
}
