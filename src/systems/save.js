// Remembers story progress between visits (browser storage, per visitor).
// Everything is optional: if storage is unavailable the game simply starts fresh.

const KEY = 'chatriyan-portfolio-world/v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function saveProgress(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: progress just isn't remembered */
  }
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
