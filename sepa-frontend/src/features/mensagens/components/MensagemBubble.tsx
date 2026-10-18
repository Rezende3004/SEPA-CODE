import type { MensagemDetalhada } from '@/shared/types';
import { formatarDataHora } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface MensagemBubbleProps {
  mensagem: MensagemDetalhada;
  meuId: number;
}

export function MensagemBubble({ mensagem, meuId }: MensagemBubbleProps) {
  const minha = mensagem.remetenteId === meuId;
  return (
    <li className={cn('flex', minha ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          minha ? 'bg-primary text-white' : 'border border-line bg-canvas text-ink',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{mensagem.conteudoTexto}</p>
        <p className={cn('mt-1 text-[11px]', minha ? 'text-white/80' : 'text-muted')}>
          {formatarDataHora(mensagem.dataEnvio)}
          {minha ? ` · ${mensagem.lida ? 'Lida' : 'Enviada'}` : ''}
        </p>
      </div>
    </li>
  );
}
