import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Tom = 'info' | 'sucesso' | 'atencao' | 'perigo';

interface AlertProps {
  tom?: Tom;
  titulo?: string;
  children: ReactNode;
  className?: string;
}

const estilos: Record<Tom, { caixa: string; icone: typeof Info }> = {
  info: { caixa: 'border-primary/30 bg-primary-soft text-primary-dark', icone: Info },
  sucesso: { caixa: 'border-success/30 bg-success-soft text-success', icone: CheckCircle2 },
  atencao: { caixa: 'border-warning/30 bg-warning-soft text-warning', icone: AlertTriangle },
  perigo: { caixa: 'border-danger/30 bg-danger-soft text-danger', icone: XCircle },
};

export function Alert({ tom = 'info', titulo, children, className }: AlertProps) {
  const { caixa, icone: Icone } = estilos[tom];
  return (
    <div
      role={tom === 'perigo' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', caixa, className)}
    >
      <Icone aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        {titulo ? <p className="font-semibold">{titulo}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
