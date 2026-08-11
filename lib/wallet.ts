const WALLET_KEY = "mf_wallet_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable anonymous wallet id in localStorage (credits granted via Creem webhook). */
export function getOrCreateWalletId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(WALLET_KEY);
    if (existing && existing.length >= 8 && existing.length <= 80) return existing;
    const id = randomId();
    window.localStorage.setItem(WALLET_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function readWalletId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WALLET_KEY);
  } catch {
    return null;
  }
}

export function writeWalletId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WALLET_KEY, id);
  } catch {
    /* ignore */
  }
}
