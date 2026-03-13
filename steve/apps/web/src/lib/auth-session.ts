const SESSION_STORAGE_KEY = "steve_session";
const SESSION_COOKIE_KEY = "steve_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const all = document.cookie;
  if (!all) return null;

  const prefix = `${name}=`;
  const pair = all
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return pair ? decodeURIComponent(pair.slice(prefix.length)) : null;
}

export function getSessionToken(): string | null {
  if (!isBrowser()) return null;
  const fromStorage = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (fromStorage) return fromStorage;
  return readCookie(SESSION_COOKIE_KEY);
}

export function persistSessionToken(token: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSessionToken(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
