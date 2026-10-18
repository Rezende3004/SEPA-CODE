const REFRESH_KEY = 'sepa.refresh';

let accessToken: string | null = null;

/**
 * O access token vive apenas em memória (mitiga XSS); o refresh fica em
 * sessionStorage para permitir recarregar a página sem novo login.
 */
export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  setAccess(token: string): void {
    accessToken = token;
  },
  getRefresh(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefresh(token: string): void {
    try {
      sessionStorage.setItem(REFRESH_KEY, token);
    } catch {
      // sessionStorage indisponível (modo privado restrito): sessão só em memória.
    }
  },
  clear(): void {
    accessToken = null;
    try {
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      // ignorado
    }
  },
};
