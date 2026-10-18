// RF-007 — lista de conversas e envio com polling.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { ConversaResumo } from '@/shared/types';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/features/auth/use-auth';
import { getApiErrorMessage } from '@/shared/lib/api-client';
import { cn } from '@/shared/lib/cn';
import { JanelaConversa } from '../components/JanelaConversa';
import { ListaConversas } from '../components/ListaConversas';
import { useEnviarMensagem, useMarcarMensagemLida, useMensagens, useUsuarioResumo } from '../hooks';

interface MensagensPageProps {
  basePath: string;
}

export function MensagensPage({ basePath }: MensagensPageProps) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { usuarioId } = useParams();
  const contatoId = usuarioId && Number.isFinite(Number(usuarioId)) ? Number(usuarioId) : undefined;

  const todas = useMensagens();
  const conversa = useMensagens(contatoId);
  const enviar = useEnviarMensagem();
  const { mutate: marcarLida } = useMarcarMensagemLida();
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const processadas = useRef<Set<number>>(new Set());

  const meuId = usuario?.id ?? 0;

  const conversas = useMemo<ConversaResumo[]>(() => {
    const mapa = new Map<number, ConversaResumo>();
    for (const mensagem of todas.data ?? []) {
      const outroId =
        mensagem.remetenteId === meuId ? mensagem.destinatarioId : mensagem.remetenteId;
      const nome =
        mensagem.remetenteId === outroId ? mensagem.remetenteNome : mensagem.destinatarioNome;
      const atual = mapa.get(outroId);
      const naoLida = mensagem.destinatarioId === meuId && !mensagem.lida ? 1 : 0;
      if (atual) {
        atual.naoLidas += naoLida;
      } else {
        mapa.set(outroId, {
          usuarioId: outroId,
          nome,
          ultimaMensagem: mensagem.conteudoTexto,
          dataEnvio: mensagem.dataEnvio,
          naoLidas: naoLida,
        });
      }
    }
    return Array.from(mapa.values());
  }, [todas.data, meuId]);

  const mensagemDoContato = conversa.data?.find(
    (mensagem) => mensagem.remetenteId === contatoId || mensagem.destinatarioId === contatoId,
  );
  const nomeConhecido = mensagemDoContato
    ? mensagemDoContato.remetenteId === contatoId
      ? mensagemDoContato.remetenteNome
      : mensagemDoContato.destinatarioNome
    : undefined;
  const resumoContato = useUsuarioResumo(nomeConhecido ? undefined : contatoId);
  const contatoNome = nomeConhecido ?? resumoContato.data?.nome ?? 'Conversa';

  useEffect(() => {
    const naoLidas = (conversa.data ?? []).filter(
      (mensagem) =>
        mensagem.destinatarioId === meuId &&
        !mensagem.lida &&
        !processadas.current.has(mensagem.id),
    );
    naoLidas.forEach((mensagem) => {
      processadas.current.add(mensagem.id);
      marcarLida(mensagem.id);
    });
  }, [conversa.data, marcarLida, meuId]);

  async function aoEnviar(texto: string) {
    if (!contatoId) return;
    setErroEnvio(null);
    try {
      await enviar.mutateAsync({ destinatarioId: contatoId, conteudoTexto: texto });
    } catch (erro) {
      setErroEnvio(getApiErrorMessage(erro, 'Não foi possível enviar a mensagem.'));
      throw erro;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sobretitulo="Mensagens"
        titulo="Mensagens"
        descricao="Canal de comunicação entre profissionais e responsáveis, atualizado automaticamente."
      />

      {todas.isError ? (
        <ErrorState
          mensagem={getApiErrorMessage(todas.error)}
          onTentarNovamente={() => void todas.refetch()}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className={cn(contatoId ? 'hidden lg:block' : 'block')}>
          {todas.isLoading ? <LoadingState /> : null}
          {todas.isSuccess && conversas.length === 0 ? (
            <EmptyState
              titulo="Nenhuma conversa"
              descricao="Inicie uma conversa a partir da tela de um aluno ou do acompanhamento de um filho."
              icone={<MessageSquare aria-hidden="true" className="size-6" />}
            />
          ) : null}
          {conversas.length > 0 ? (
            <ListaConversas conversas={conversas} ativoId={contatoId} basePath={basePath} />
          ) : null}
        </div>

        <div className={cn(contatoId ? 'block' : 'hidden lg:block')}>
          {contatoId ? (
            <JanelaConversa
              contatoNome={contatoNome}
              mensagens={conversa.data ?? []}
              meuId={meuId}
              carregando={conversa.isLoading}
              enviando={enviar.isPending}
              erroEnvio={erroEnvio}
              onEnviar={aoEnviar}
              onVoltar={() => navigate(basePath)}
            />
          ) : (
            <div className="flex min-h-[32rem] items-center justify-center rounded-xl border border-dashed border-line bg-surface p-6 text-center">
              <div>
                <p className="font-semibold text-ink">Selecione uma conversa</p>
                <p className="mt-1 text-sm text-muted">
                  Escolha um contato na lista para ver o histórico e responder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
