/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  corsHeaders,
  getBalance,
  isWalletId,
  json,
  sha256Hex,
  timingSafeEqual,
} from "../../_lib/billing";

/**
 * After Creem redirect, verify signature and return wallet balance.
 * Credits are granted by webhook; this endpoint is for UX confirmation.
 */
export const onRequestOptions: PagesFunction<BillingEnv> = async (context) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
};

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request);
  try {
    if (!context.env.SAMPLES_DB || !context.env.CREEM_API_KEY) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }

    const body = (await context.request.json()) as {
      query?: string;
      wallet_id?: string;
    };

    const walletId = (body.wallet_id || "").trim();
    if (!isWalletId(walletId)) {
      return json({ ok: false, error: "invalid_wallet" }, 400, headers);
    }

    const rawQuery = (body.query || "").replace(/^\?/, "");
    if (rawQuery) {
      const pairs = rawQuery.split("&").filter(Boolean);
      const signaturePair = pairs.find((p) => p.startsWith("signature="));
      const signature = signaturePair
        ? decodeURIComponent(signaturePair.slice("signature=".length))
        : "";
      const parts: string[] = [];
      for (const pair of pairs) {
        const eq = pair.indexOf("=");
        if (eq < 0) continue;
        const key = decodeURIComponent(pair.slice(0, eq));
        const value = decodeURIComponent(pair.slice(eq + 1));
        if (key === "signature") continue;
        if (!value || value === "null") continue;
        parts.push(`${key}=${value}`);
      }
      parts.push(`salt=${context.env.CREEM_API_KEY}`);
      const expected = await sha256Hex(parts.join("|"));
      if (!signature || !timingSafeEqual(signature, expected)) {
        return json({ ok: false, error: "invalid_signature" }, 401, headers);
      }
    }

    // Prefer order lookup by request_id / checkout_id from query
    const params = new URLSearchParams(rawQuery);
    const requestId = params.get("request_id");
    const checkoutId = params.get("checkout_id");
    const orderId = params.get("order_id");

    if (requestId || checkoutId || orderId) {
      const order = await context.env.SAMPLES_DB.prepare(
        `SELECT wallet_id, status, credits FROM orders
         WHERE id = ? OR creem_checkout_id = ? OR creem_order_id = ?
         LIMIT 1`,
      )
        .bind(requestId || "", checkoutId || "", orderId || "")
        .first<{ wallet_id: string; status: string; credits: number }>();

      if (order && order.wallet_id !== walletId) {
        // Prefer server wallet if client mismatched
        const balance = await getBalance(context.env.SAMPLES_DB, order.wallet_id);
        return json(
          {
            ok: true,
            wallet_id: order.wallet_id,
            balance,
            order_status: order.status,
            credited: order.status === "paid",
          },
          200,
          headers,
        );
      }
    }

    const balance = await getBalance(context.env.SAMPLES_DB, walletId);
    return json({ ok: true, wallet_id: walletId, balance }, 200, headers);
  } catch (error) {
    console.error("activate error", error);
    return json({ ok: false, error: "activate_error" }, 500, headers);
  }
};
