import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function inscrever(ouvinte: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', ouvinte);
  return () => consulta.removeEventListener('change', ouvinte);
}

function obterSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(CONSULTA).matches;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(inscrever, obterSnapshot, () => false);
}
