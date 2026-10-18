interface ProgressoAtividadeProps {
  atual: number;
  total: number;
  rotulo: string;
}

export function ProgressoAtividade({ atual, total, rotulo }: ProgressoAtividadeProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-semibold text-kid-muted">
        {rotulo} {Math.min(atual, total)} de {total}
      </p>
      <div
        className="flex justify-center gap-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(atual, total)}
        aria-label={`${rotulo} ${Math.min(atual, total)} de ${total}`}
      >
        {Array.from({ length: total }, (_, indice) => (
          <span
            key={indice}
            aria-hidden="true"
            className={
              indice < atual
                ? 'size-3 rounded-full bg-kid-primary'
                : 'size-3 rounded-full border border-kid-primary/30 bg-white'
            }
          />
        ))}
      </div>
    </div>
  );
}
