/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  type PackId,
  PACK_CREDITS,
  corsHeaders,
  creemApiBase,
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
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }
    if (!context.env.CREEM_API_KEY) {
      return json({ ok: false, error: "creem_not_configured" }, 503, headers);
    }

    const body = (await context.request.json()) as {
      pack?: string;
      wallet_id?: string;
      email?: string;
    };

    const pack = body.pack as PackId;
    if (!pack || !(pack in PACK_CREDITS)) {
      return json({ ok: false, error: "invalid_pack" }, 400, headers);
    }

    const walletId = (body.wallet_id || "").trim();
    if (!isWalletId(walletId)) {
      return json({ ok: false, error: "invalid_wallet" }, 400, headers);
    }

    const productId = productIdForPack(context.env, pack);
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

    const res = await fetch(`${creemApiBase(context.env)}/v1/checkouts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": context.env.CREEM_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      checkout_url?: string;
      error?: string;
      message?: string;
    };

    if (!res.ok || !data.checkout_url) {
      await context.env.SAMPLES_DB.prepare(
        `UPDATE orders SET status = 'checkout_failed', updated_at = ? WHERE id = ?`,
      )
        .bind(new Date().toISOString(), orderId)
        .run();
      console.error("creem checkout failed", res.status, data);
      return json(
        { ok: false, error: "checkout_failed", detail: data.error || data.message || res.status },
        502,
        headers,
      );
    }

    await context.env.SAMPLES_DB.prepare(
      `UPDATE orders SET creem_checkout_id = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(data.id || null, new Date().toISOString(), orderId)
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
