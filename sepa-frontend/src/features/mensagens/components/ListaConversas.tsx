import { Link } from 'react-router-dom';
import type { ConversaResumo } from '@/shared/types';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { formatarDataHora } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface ListaConversasProps {
  conversas: ConversaResumo[];
  ativoId?: number;
  basePath: string;
}

export function ListaConversas({ conversas, ativoId, basePath }: ListaConversasProps) {
  return (
    <nav aria-label="Conversas" className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {conversas.map((conversa) => (
        <Link
          key={conversa.usuarioId}
          to={`${basePath}/${conversa.usuarioId}`}
          aria-current={ativoId === conversa.usuarioId ? 'page' : undefined}
          className={cn(
            'flex min-h-16 items-center gap-3 p-3 transition-colors hover:bg-canvas/60',
            ativoId === conversa.usuarioId && 'bg-primary-soft/60',
          )}
        >
          <Avatar nome={conversa.nome} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">{conversa.nome}</span>
              <span className="shrink-0 text-[11px] text-muted">
                {formatarDataHora(conversa.dataEnvio)}
              </span>
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted">{conversa.ultimaMensagem}</span>
              {conversa.naoLidas > 0 ? (
                <Badge variante="primario" aria-label={`${conversa.naoLidas} mensagens não lidas`}>
                  {conversa.naoLidas}
                </Badge>
              ) : null}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
