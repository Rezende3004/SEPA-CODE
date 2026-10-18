import { useMemo } from 'react';
import { tocarAcerto, tocarConclusao, tocarErro } from '../lib/audio';
import { useSensoryPreferences } from './use-sensory-preferences';

export function useSom(alunoId: number) {
  const preferencias = useSensoryPreferences(alunoId);

  return useMemo(() => {
    const volume = preferencias.volume;
    const habilitado = preferencias.som;
    return {
      acerto: () => {
        if (habilitado) tocarAcerto(volume);
      },
      erro: () => {
        if (habilitado) tocarErro(volume);
      },
      conclusao: () => {
        if (habilitado) tocarConclusao(volume);
      },
    };
  }, [preferencias.som, preferencias.volume]);
}
