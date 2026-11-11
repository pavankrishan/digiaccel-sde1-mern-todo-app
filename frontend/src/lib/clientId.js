const KEY = 'todo.clientId';
let cached;

function generate() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Anonymous id that scopes this browser's tasks on the API (the app has no login).
 * Falls back to an in-memory id if storage is unavailable (e.g. private mode).
 */
export function getClientId() {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(KEY);
    if (!cached) {
      cached = generate();
      localStorage.setItem(KEY, cached);
    }
  } catch {
    cached = cached || generate();
  }
  return cached;
}

export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};
