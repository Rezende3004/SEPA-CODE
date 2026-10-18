import { Field } from '@/shared/components/ui/Field';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { diasAtras, paraInputDate } from '@/shared/lib/format';

interface FiltroPeriodoProps {
  inicio: string;
  fim: string;
  onMudar: (inicio: string, fim: string) => void;
}

const ATALHOS = [
  { rotulo: 'Últimos 30 dias', dias: 30 },
  { rotulo: 'Últimos 60 dias', dias: 60 },
  { rotulo: 'Últimos 90 dias', dias: 90 },
];

export function FiltroPeriodo({ inicio, fim, onMudar }: FiltroPeriodoProps) {
  function aplicarAtalho(dias: number) {
    onMudar(paraInputDate(diasAtras(dias)), paraInputDate(new Date()));
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-2">
        {ATALHOS.map((atalho) => {
          const esperadoInicio = paraInputDate(diasAtras(atalho.dias));
          const ativo = inicio === esperadoInicio && fim === paraInputDate(new Date());
          return (
            <Button
              key={atalho.dias}
              variante={ativo ? 'primario' : 'secundario'}
              tamanho="pequeno"
              onClick={() => aplicarAtalho(atalho.dias)}
              aria-pressed={ativo}
            >
              {atalho.rotulo}
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Início do período" htmlFor="periodo-inicio">
          <Input
            id="periodo-inicio"
            type="date"
            value={inicio}
            max={fim}
            onChange={(evento) => onMudar(evento.target.value, fim)}
          />
        </Field>
        <Field label="Fim do período" htmlFor="periodo-fim">
          <Input
            id="periodo-fim"
            type="date"
            value={fim}
            min={inicio}
            onChange={(evento) => onMudar(inicio, evento.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
