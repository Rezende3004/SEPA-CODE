import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar = 'Confirmar',
  carregando = false,
  onConfirmar,
  onFechar,
}: ConfirmDialogProps) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button variante="perigo" onClick={onConfirmar} carregando={carregando}>
            {rotuloConfirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{descricao}</p>
    </Modal>
  );
}
