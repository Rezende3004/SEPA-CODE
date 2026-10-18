import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetDb } from '@/mocks/db';
import { limparCachePreferencias } from '@/features/execucao/hooks/use-sensory-preferences';
import { tokenStore } from '@/shared/lib/token-store';
import { server } from './msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  limparCachePreferencias();
  tokenStore.clear();
  sessionStorage.clear();
  localStorage.clear();
});

afterAll(() => server.close());

class ResizeObserverMocke {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMocke);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }),
});

window.scrollTo = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();
