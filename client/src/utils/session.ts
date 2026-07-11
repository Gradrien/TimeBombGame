/**
 * Player session persistence — sole owner of the storage key.
 *
 * Every access (read at startup, save at login, username update, logout) goes
 * through this module, so the storage choice can never diverge between screens.
 *
 * The PIN is NEVER stored: only the server-signed session token is kept, and
 * presented to the socket through the `authenticate` event.
 *
 * Development uses `sessionStorage` (one session per tab, handy for testing
 * several accounts); production uses `localStorage` (the session survives
 * closing the tab).
 */

const SESSION_KEY = 'timebomb_session';

export interface StoredSession {
  id: string;
  username: string;
  /** Signed token issued by the server at login. */
  token: string;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.username === 'string' && typeof v.token === 'string';
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return process.env.NODE_ENV === 'development' ? sessionStorage : localStorage;
}

export function loadSession(): StoredSession | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
	const raw = storage.getItem(SESSION_KEY);
	if (!raw) return null;
	const parsed: unknown = JSON.parse(raw);
	// Corrupted storage or a previous version's format: start fresh.
	return isStoredSession(parsed) ? parsed : null;
  } catch {
	return null;
  }
}

export function saveSession(session: StoredSession): void {
  getStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateSession(patch: Partial<StoredSession>): void {
  const current = loadSession();
  if (current) saveSession({...current, ...patch});
}

export function clearSession(): void {
  getStorage()?.removeItem(SESSION_KEY);
}
