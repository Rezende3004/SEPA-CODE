import { useContext } from 'react';
import { ContextoAuth } from './auth-context';

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }
  return contexto;
}
