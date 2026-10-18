import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/tokens.css';
import '@/shared/styles/globals.css';
import App from '@/app/App';

async function iniciarMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS === 'false') {
    await removerServiceWorkerDeMocks();
    return;
  }
  const { worker } = await import('@/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

async function removerServiceWorkerDeMocks(): Promise<void> {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  const registros = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registros
      .filter((registro) => {
        const url =
          registro.active?.scriptURL ??
          registro.waiting?.scriptURL ??
          registro.installing?.scriptURL;
        return url?.endsWith('/mockServiceWorker.js') ?? false;
      })
      .map((registro) => registro.unregister()),
  );
}

async function iniciarAplicacao(): Promise<void> {
  try {
    await iniciarMocks();
  } catch (erro) {
    console.warn('Não foi possível iniciar a API simulada. Seguindo sem MSW.', erro);
  }
  const raiz = document.getElementById('root');
  if (!raiz) throw new Error('Elemento #root não encontrado.');
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void iniciarAplicacao();
