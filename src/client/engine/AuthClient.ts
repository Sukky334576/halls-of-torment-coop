const TOKEN_KEY = 'torment_auth_token';
const USERNAME_KEY = 'torment_auth_username';

interface AuthResult {
  success: boolean;
  error?: string;
}

/** Thin wrapper around the /api/register, /api/login, /api/progression endpoints —
 * see server.ts. Not logged in (no token) is a fully supported "guest" state: everything
 * else in MetaProgression.ts falls back to localStorage-only exactly as before this system
 * existed, so account creation is opt-in, never required to play. */
export const AuthClient = {
  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getUsername(): string | null {
    try {
      return localStorage.getItem(USERNAME_KEY);
    } catch {
      return null;
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    } catch {
      // Ignore — worst case the old token lingers until overwritten by a fresh login.
    }
  },

  async register(username: string, password: string): Promise<AuthResult> {
    return this.authRequest('/api/register', username, password);
  },

  async login(username: string, password: string): Promise<AuthResult> {
    return this.authRequest('/api/login', username, password);
  },

  async authRequest(path: string, username: string, password: string): Promise<AuthResult> {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        return { success: false, error: body.error || `Request failed (${res.status})` };
      }
      localStorage.setItem(TOKEN_KEY, body.token);
      localStorage.setItem(USERNAME_KEY, body.username);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server' };
    }
  },

  /** Returns the saved progression object, or null if this account has never synced one
   * (brand new account) or the request otherwise failed (treated the same as "nothing to
   * load yet" — the caller's existing local data is always the safe fallback). */
  async fetchProgression(): Promise<unknown | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/progression', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body.success ? body.data : null;
    } catch {
      return null;
    }
  },

  /** Fire-and-forget-ish: caller doesn't need to await this for gameplay to proceed, since
   * localStorage is always written first and remains the source of truth if this fails. */
  async pushProgression(data: unknown): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
