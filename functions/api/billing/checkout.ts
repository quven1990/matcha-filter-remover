/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  type PackId,
  PACK_CREDITS,
  PAYMENTS_ENABLED,
  corsHeaders,
  creemApiBase,
  ensureWallet,
  isWalletId,
  json,
  productIdForPack,
  siteOrigin,
} from "../../_lib/billing";

export const onRequestOptions: PagesFunction<BillingEnv> = async (context) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
};

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request);
  try {
    if (!PAYMENTS_ENABLED) {
      return json(
        {
          ok: false,
          error: "payments_paused",
          detail: "Card checkout is temporarily paused while live billing is being enabled.",
        },
        503,
        headers,
      );
    }
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }
    const apiKey = context.env.CREEM_API_KEY?.trim();
    if (!apiKey) {
      return json({ ok: false, error: "creem_not_configured" }, 503, headers);
    }

    const body = (await context.request.json()) as {
      pack?: string;
      wallet_id?: string;
      email?: string;
      accepts_policy?: boolean | string | number;
    };

    const pack = body.pack as PackId;
    if (!pack || !(pack in PACK_CREDITS)) {
      return json({ ok: false, error: "invalid_pack" }, 400, headers);
    }

    const walletId = (body.wallet_id || "").trim();
    if (!isWalletId(walletId)) {
      return json({ ok: false, error: "invalid_wallet" }, 400, headers);
    }

    const accepts =
      body.accepts_policy === true ||
      body.accepts_policy === 1 ||
      body.accepts_policy === "1" ||
      body.accepts_policy === "true";
    if (!accepts) {
      return json({ ok: false, error: "policy_required" }, 400, headers);
    }

    const wallet = await ensureWallet(context.env.SAMPLES_DB, walletId);
    if (wallet.status === "suspended") {
      return json(
        {
          ok: false,
          error: "wallet_suspended",
          detail: "This wallet is suspended. Contact billing@ or abuse@ before purchasing again.",
        },
        403,
        headers,
      );
    }

    const productId = productIdForPack(context.env, pack)?.trim() || null;
    if (!productId) {
      return json({ ok: false, error: "product_not_configured", pack }, 503, headers);
    }

    const email =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email.trim().slice(0, 160).toLowerCase()
        : undefined;

    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();
    const credits = PACK_CREDITS[pack];
    const successUrl = `${siteOrigin(context.env, context.request)}/billing/success`;
    const apiBase = creemApiBase(context.env);

    await context.env.SAMPLES_DB.prepare(
      `INSERT INTO orders
        (id, wallet_id, pack, credits, product_id, status, creem_checkout_id, creem_order_id, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?, ?)`,
    )
      .bind(orderId, walletId, pack, credits, productId, email || null, now, now)
      .run();

    const payload: Record<string, unknown> = {
      product_id: productId,
      request_id: orderId,
      success_url: successUrl,
      metadata: {
        wallet_id: walletId,
        pack,
        credits: String(credits),
        order_id: orderId,
      },
    };
    if (email) payload.customer = { email };

    const res = await fetch(`${apiBase}/v1/checkouts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      checkout_url?: string;
      error?: string;
      message?: string | string[];
    };

    if (!res.ok || !data.checkout_url) {
      await context.env.SAMPLES_DB.prepare(
        `UPDATE orders SET status = 'checkout_failed', updated_at = ? WHERE id = ?`,
      )
        .bind(new Date().toISOString(), orderId)
        .run();
      const creemMsg = Array.isArray(data.message)
        ? data.message.join("; ")
        : data.message || data.error || `HTTP ${res.status}`;
      console.error("creem checkout failed", res.status, apiBase, productId, data);

      // Prefer 400 over 502: custom domains often strip Worker 502 response bodies.
      return json(
        {
          ok: false,
          error: "checkout_failed",
          detail: creemMsg,
          creem_status: res.status,
          api_base: apiBase,
          product_id: productId,
          hint:
            "Creem test/live must match: test key + test products → test-api; live key + live products → set CREEM_API_BASE=https://api.creem.io",
        },
        400,
        headers,
      );
    }

    await context.env.SAMPLES_DB.prepare(
      `UPDATE orders SET creem_checkout_id = ?, creem_checkout_url = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(data.id || null, data.checkout_url, new Date().toISOString(), orderId)
      .run();

    return json(
      {
        ok: true,
        checkout_url: data.checkout_url,
        order_id: orderId,
        credits,
        pack,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("checkout error", error);
    return json({ ok: false, error: "checkout_error" }, 500, headers);
  }
};
