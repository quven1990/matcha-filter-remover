/// <reference types="@cloudflare/workers-types" />

export type BillingEnv = {
  SAMPLES_DB: D1Database;
  CREEM_API_KEY?: string;
  CREEM_WEBHOOK_SECRET?: string;
  CREEM_API_BASE?: string;
  CREEM_PRODUCT_STARTER?: string;
  CREEM_PRODUCT_PLUS?: string;
  CREEM_PRODUCT_PRO?: string;
  SITE_URL?: string;
  SESSION_SECRET?: string;
  /** Optional Cloudflare Workers AI binding */
  AI?: unknown;
  /** Optional fal.ai key for higher-quality img2img */
  FAL_KEY?: string;
};

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export function corsHeaders(request: Request, methods = "POST, OPTIONS"): HeadersInit {
  const origin = request.headers.get("Origin") || "";
  const allowed =
    origin.endsWith("matchafilter.online") ||
    origin.endsWith("matcha-filter-8ib.pages.dev") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:");
  return allowed
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": methods,
        "access-control-allow-headers": "content-type",
        vary: "Origin",
      }
    : {};
}

export function siteOrigin(env: BillingEnv, request: Request): string {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  if (url.hostname.includes("localhost") || url.hostname === "127.0.0.1") {
    return `${url.protocol}//${url.host}`;
  }
  return "https://matchafilter.online";
}

export function creemApiBase(env: BillingEnv): string {
  return (env.CREEM_API_BASE || "https://test-api.creem.io").replace(/\/$/, "");
}

export type PackId = "starter" | "plus" | "pro";

export const PACK_CREDITS: Record<PackId, number> = {
  starter: 5,
  plus: 20,
  pro: 60,
};

export function productIdForPack(env: BillingEnv, pack: PackId): string | null {
  const map: Record<PackId, string | undefined> = {
    starter: env.CREEM_PRODUCT_STARTER,
    plus: env.CREEM_PRODUCT_PLUS,
    pro: env.CREEM_PRODUCT_PRO,
  };
  const id = map[pack]?.trim();
  return id || null;
}

export function packFromProductId(env: BillingEnv, productId: string): PackId | null {
  if (productId && productId === env.CREEM_PRODUCT_STARTER) return "starter";
  if (productId && productId === env.CREEM_PRODUCT_PLUS) return "plus";
  if (productId && productId === env.CREEM_PRODUCT_PRO) return "pro";
  return null;
}

export function isWalletId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(value);
}

export async function ensureWallet(db: D1Database, walletId: string, email?: string | null) {
  const now = new Date().toISOString();
  const existing = await db.prepare(`SELECT id, balance, email FROM wallets WHERE id = ?`).bind(walletId).first<{
    id: string;
    balance: number;
    email: string | null;
  }>();
  if (existing) {
    if (email && !existing.email) {
      await db
        .prepare(`UPDATE wallets SET email = ?, updated_at = ? WHERE id = ?`)
        .bind(email, now, walletId)
        .run();
    }
    return existing;
  }
  await db
    .prepare(
      `INSERT INTO wallets (id, balance, email, creem_customer_id, created_at, updated_at)
       VALUES (?, 0, ?, NULL, ?, ?)`,
    )
    .bind(walletId, email || null, now, now)
    .run();
  return { id: walletId, balance: 0, email: email || null };
}

export async function getBalance(db: D1Database, walletId: string): Promise<number> {
  const row = await db.prepare(`SELECT balance FROM wallets WHERE id = ?`).bind(walletId).first<{ balance: number }>();
  return row?.balance ?? 0;
}

/** Idempotent credit grant. Returns new balance. */
export async function grantCredits(
  db: D1Database,
  args: {
    walletId: string;
    credits: number;
    reason: string;
    refId: string;
    email?: string | null;
    creemCustomerId?: string | null;
    meta?: string | null;
  },
): Promise<{ balance: number; granted: boolean }> {
  const now = new Date().toISOString();
  await ensureWallet(db, args.walletId, args.email);

  try {
    await db
      .prepare(
        `INSERT INTO credit_ledger (id, wallet_id, delta, reason, ref_id, meta, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), args.walletId, args.credits, args.reason, args.refId, args.meta || null, now)
      .run();
  } catch {
    const bal = await getBalance(db, args.walletId);
    return { balance: bal, granted: false };
  }

  await db
    .prepare(
      `UPDATE wallets
       SET balance = balance + ?,
           email = COALESCE(?, email),
           creem_customer_id = COALESCE(?, creem_customer_id),
           updated_at = ?
       WHERE id = ?`,
    )
    .bind(args.credits, args.email || null, args.creemCustomerId || null, now, args.walletId)
    .run();

  return { balance: await getBalance(db, args.walletId), granted: true };
}

/** Deduct credits; returns false if insufficient. Idempotent on refId. */
export async function spendCredits(
  db: D1Database,
  args: { walletId: string; cost: number; reason: string; refId: string; meta?: string | null },
): Promise<{ ok: true; balance: number } | { ok: false; error: "insufficient" | "duplicate"; balance: number }> {
  const now = new Date().toISOString();
  await ensureWallet(db, args.walletId);

  const dup = await db
    .prepare(`SELECT id FROM credit_ledger WHERE ref_id = ?`)
    .bind(args.refId)
    .first();
  if (dup) {
    return { ok: false, error: "duplicate", balance: await getBalance(db, args.walletId) };
  }

  const bal = await getBalance(db, args.walletId);
  if (bal < args.cost) {
    return { ok: false, error: "insufficient", balance: bal };
  }

  await db
    .prepare(
      `INSERT INTO credit_ledger (id, wallet_id, delta, reason, ref_id, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), args.walletId, -args.cost, args.reason, args.refId, args.meta || null, now)
    .run();

  await db
    .prepare(`UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?`)
    .bind(args.cost, now, args.walletId)
    .run();

  return { ok: true, balance: bal - args.cost };
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
