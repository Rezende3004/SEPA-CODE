import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { mensagemSchema, type DadosMensagem } from '../schemas';

interface ComposerMensagemProps {
  onEnviar: (texto: string) => Promise<void>;
  enviando: boolean;
  erro?: string | null;
}

export function ComposerMensagem({ onEnviar, enviando, erro }: ComposerMensagemProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosMensagem>({
    resolver: zodResolver(mensagemSchema),
    defaultValues: { conteudoTexto: '' },
  });

  async function enviar(dados: DadosMensagem) {
    try {
      await onEnviar(dados.conteudoTexto);
      reset({ conteudoTexto: '' });
    } catch {
      // O erro é apresentado pelo componente pai.
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-2 border-t border-line p-3">
      <label htmlFor="conteudo-mensagem" className="sr-only">
        Escrever mensagem
      </label>
      <Textarea
        id="conteudo-mensagem"
        rows={2}
        placeholder="Escreva uma mensagem…"
        invalido={Boolean(errors.conteudoTexto)}
        aria-describedby={errors.conteudoTexto ? 'conteudo-mensagem-erro' : undefined}
        {...register('conteudoTexto')}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
            evento.preventDefault();
            void handleSubmit(enviar)();
          }
        }}
      />
      {errors.conteudoTexto?.message ? (
        <p id="conteudo-mensagem-erro" role="alert" className="text-xs text-danger">
          {errors.conteudoTexto.message}
        </p>
      ) : null}
      {erro ? (
        <p role="alert" className="text-xs text-danger">
          {erro}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Ctrl + Enter para enviar</p>
        <Button type="submit" carregando={enviando} disabled={enviando}>
          <Send aria-hidden="true" className="size-4" />
          Enviar
        </Button>
      </div>
    </form>
  );
}
