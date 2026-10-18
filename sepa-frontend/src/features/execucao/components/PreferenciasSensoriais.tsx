import { Volume2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { tocarAcerto } from '../lib/audio';
import {
  atualizarPreferencias,
  useSensoryPreferences,
  type TamanhoFonte,
} from '../hooks/use-sensory-preferences';

const TAMANHOS: { valor: TamanhoFonte; rotulo: string; descricao: string }[] = [
  { valor: 'normal', rotulo: 'Normal', descricao: 'Tamanho padrão do texto.' },
  { valor: 'grande', rotulo: 'Grande', descricao: 'Texto um pouco maior.' },
  { valor: 'muito-grande', rotulo: 'Muito grande', descricao: 'Texto bem maior, para leitura fácil.' },
];

export function PreferenciasSensoriais({ alunoId }: { alunoId: number }) {
  const preferencias = useSensoryPreferences(alunoId);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Som</CardTitle>
          <CardDescription>
            Os sons são curtos e suaves. Você decide se quer ouvi-los.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border border-kid-primary/20 bg-kid-soft/40 px-4 py-3">
            <span className="font-semibold text-kid-muted">Quero ouvir os sons</span>
            <input
              type="checkbox"
              checked={preferencias.som}
              onChange={(evento) =>
                atualizarPreferencias(alunoId, { som: evento.target.checked })
              }
              className="size-6 accent-kid-primary"
            />
          </label>

          <div className="space-y-2">
            <label htmlFor="volume-som" className="block font-semibold text-kid-muted">
              Volume
            </label>
            <input
              id="volume-som"
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(preferencias.volume * 100)}
              disabled={!preferencias.som}
              onChange={(evento) =>
                atualizarPreferencias(alunoId, { volume: Number(evento.target.value) / 100 })
              }
              className="h-12 w-full accent-kid-primary disabled:opacity-50"
              aria-valuetext={`${Math.round(preferencias.volume * 100)} por cento`}
            />
          </div>

          <Button
            variante="secundario"
            onClick={() => tocarAcerto(preferencias.volume)}
            disabled={!preferencias.som}
          >
            <Volume2 aria-hidden="true" className="size-5" />
            Ouvir um exemplo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animações</CardTitle>
          <CardDescription>
            Quando desligadas, nada se movimenta na tela. A preferência do sistema também é
            respeitada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border border-kid-primary/20 bg-kid-soft/40 px-4 py-3">
            <span className="font-semibold text-kid-muted">Permitir animações suaves</span>
            <input
              type="checkbox"
              checked={preferencias.animacoes}
              onChange={(evento) =>
                atualizarPreferencias(alunoId, { animacoes: evento.target.checked })
              }
              className="size-6 accent-kid-primary"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tamanho do texto</CardTitle>
          <CardDescription>Escolha o tamanho mais confortável para ler.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">Tamanho do texto</legend>
            {TAMANHOS.map((opcao) => (
              <label
                key={opcao.valor}
                className="flex cursor-pointer flex-col gap-1 rounded-lg border border-kid-primary/20 p-3 has-[:checked]:border-kid-primary has-[:checked]:bg-kid-soft"
              >
                <span className="flex items-center gap-2 font-semibold text-kid-muted">
                  <input
                    type="radio"
                    name="tamanho-fonte"
                    value={opcao.valor}
                    checked={preferencias.tamanhoFonte === opcao.valor}
                    onChange={() =>
                      atualizarPreferencias(alunoId, { tamanhoFonte: opcao.valor })
                    }
                    className="size-5 accent-kid-primary"
                  />
                  {opcao.rotulo}
                </span>
                <span className="text-xs text-kid-muted">{opcao.descricao}</span>
              </label>
            ))}
          </fieldset>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-kid-muted">
        As preferências são salvas automaticamente neste dispositivo, para este aluno.
      </p>
    </div>
  );
}
