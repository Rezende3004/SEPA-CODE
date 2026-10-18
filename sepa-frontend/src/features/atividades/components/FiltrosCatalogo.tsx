import { Search } from 'lucide-react';
import type { TipoAtividade } from '@/shared/types';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Field } from '@/shared/components/ui/Field';

interface FiltrosCatalogoProps {
  busca: string;
  aoBuscar: (valor: string) => void;
  tipo: TipoAtividade | '';
  aoMudarTipo: (valor: TipoAtividade | '') => void;
  nivel: number;
  aoMudarNivel: (valor: number) => void;
}

export function FiltrosCatalogo({
  busca,
  aoBuscar,
  tipo,
  aoMudarTipo,
  nivel,
  aoMudarNivel,
}: FiltrosCatalogoProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_10rem]">
      <Field label="Buscar atividade" htmlFor="busca-atividade">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <Input
            id="busca-atividade"
            value={busca}
            onChange={(evento) => aoBuscar(evento.target.value)}
            placeholder="Título ou descrição"
            className="pl-9"
          />
        </div>
      </Field>

      <Field label="Tipo" htmlFor="filtro-tipo">
        <Select
          id="filtro-tipo"
          value={tipo}
          onChange={(evento) => aoMudarTipo(evento.target.value as TipoAtividade | '')}
        >
          <option value="">Todos os tipos</option>
          <option value="ASSOCIACAO">Associação imagem-palavra</option>
          <option value="SEQUENCIA">Sequência de rotina</option>
        </Select>
      </Field>

      <Field label="Nível" htmlFor="filtro-nivel">
        <Select
          id="filtro-nivel"
          value={nivel}
          onChange={(evento) => aoMudarNivel(Number(evento.target.value))}
        >
          <option value={0}>Todos</option>
          {[1, 2, 3, 4, 5].map((valor) => (
            <option key={valor} value={valor}>
              Nível {valor}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
