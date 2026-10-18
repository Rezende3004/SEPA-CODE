import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/tokens.css';
import '@/shared/styles/globals.css';
import App from '@/app/App';

async function iniciarMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

async function iniciarAplicacao(): Promise<void> {
  await iniciarMocks();
  const raiz = document.getElementById('root');
  if (!raiz) throw new Error('Elemento #root não encontrado.');
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void iniciarAplicacao();
