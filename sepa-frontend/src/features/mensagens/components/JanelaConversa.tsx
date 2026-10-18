import { useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import type { MensagemDetalhada } from '@/shared/types';
import { Avatar } from '@/shared/components/ui/Avatar';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { ComposerMensagem } from './ComposerMensagem';
import { MensagemBubble } from './MensagemBubble';

interface JanelaConversaProps {
  contatoNome: string;
  mensagens: MensagemDetalhada[];
  meuId: number;
  carregando: boolean;
  enviando: boolean;
  erroEnvio: string | null;
  onEnviar: (texto: string) => Promise<void>;
  onVoltar?: () => void;
}

export function JanelaConversa({
  contatoNome,
  mensagens,
  meuId,
  carregando,
  enviando,
  erroEnvio,
  onEnviar,
  onVoltar,
}: JanelaConversaProps) {
  const fimRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [mensagens.length]);

  return (
    <section
      aria-label={`Conversa com ${contatoNome}`}
      className="flex min-h-[32rem] flex-col overflow-hidden rounded-xl border border-line bg-surface"
    >
      <header className="flex items-center gap-3 border-b border-line p-3">
        {onVoltar ? (
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar para a lista de conversas"
            className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas lg:hidden"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <Avatar nome={contatoNome} tamanho="pequeno" />
        <div>
          <p className="font-semibold text-ink">{contatoNome}</p>
          <p className="text-xs text-muted">Atualizado automaticamente a cada 10 segundos</p>
        </div>
      </header>

      {carregando ? (
        <div className="p-4">
          <LoadingState mensagem="Carregando mensagens…" />
        </div>
      ) : mensagens.length === 0 ? (
        <div className="p-4">
          <EmptyState
            titulo="Nenhuma mensagem ainda"
            descricao="Envie a primeira mensagem para iniciar a conversa."
            icone={<MessageSquare aria-hidden="true" className="size-6" />}
          />
        </div>
      ) : (
        <ul className="max-h-[26rem] flex-1 space-y-3 overflow-y-auto p-4">
          {mensagens.map((mensagem) => (
            <MensagemBubble key={mensagem.id} mensagem={mensagem} meuId={meuId} />
          ))}
          <li ref={fimRef} aria-hidden="true" />
        </ul>
      )}

      <div className="mt-auto">
        <ComposerMensagem onEnviar={onEnviar} enviando={enviando} erro={erroEnvio} />
      </div>
    </section>
  );
}
