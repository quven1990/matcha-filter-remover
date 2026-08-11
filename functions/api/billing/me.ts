/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  corsHeaders,
  ensureWallet,
  getBalance,
  isWalletId,
  json,
} from "../../_lib/billing";

export const onRequestOptions: PagesFunction<BillingEnv> = async (context) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request, "GET, OPTIONS"),
  });
};

export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request, "GET, OPTIONS");
  try {
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }
    const url = new URL(context.request.url);
    const walletId = (url.searchParams.get("wallet_id") || "").trim();
    if (!isWalletId(walletId)) {
      return json({ ok: false, error: "invalid_wallet" }, 400, headers);
    }

    await ensureWallet(context.env.SAMPLES_DB, walletId);
    const balance = await getBalance(context.env.SAMPLES_DB, walletId);
    return json({ ok: true, wallet_id: walletId, balance }, 200, headers);
  } catch (error) {
    console.error("billing me error", error);
    return json({ ok: false, error: "me_error" }, 500, headers);
  }
};
