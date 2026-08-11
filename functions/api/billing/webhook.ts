/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  PACK_CREDITS,
  type PackId,
  corsHeaders,
  grantCredits,
  hmacHex,
  isWalletId,
  json,
  packFromProductId,
  timingSafeEqual,
} from "../../_lib/billing";

type CreemEvent = {
  id?: string;
  eventType?: string;
  object?: {
    id?: string;
    request_id?: string;
    order?: {
      id?: string;
      customer?: string | { id?: string; email?: string };
      product?: string | { id?: string };
      status?: string;
    };
    product?: { id?: string; name?: string };
    customer?: { id?: string; email?: string };
    metadata?: Record<string, string>;
  };
};

export const onRequestOptions: PagesFunction<BillingEnv> = async () => {
  return new Response(null, { status: 204 });
};

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request);
  try {
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }
    const secret = context.env.CREEM_WEBHOOK_SECRET;
    if (!secret) {
      return json({ ok: false, error: "webhook_not_configured" }, 503, headers);
    }

    const raw = await context.request.text();
    const signature = context.request.headers.get("creem-signature") || "";
    const expected = await hmacHex(secret, raw);
    if (!signature || !timingSafeEqual(signature, expected)) {
      return json({ ok: false, error: "invalid_signature" }, 401, headers);
    }

    const event = JSON.parse(raw) as CreemEvent;
    const eventType = event.eventType || "";
    if (eventType !== "checkout.completed") {
      return json({ ok: true, ignored: eventType }, 200, headers);
    }

    const obj = event.object || {};
    const metadata = obj.metadata || {};
    const requestId = (obj.request_id || metadata.order_id || "").trim();
    const productId =
      (typeof obj.product === "object" ? obj.product?.id : undefined) ||
      (typeof obj.order?.product === "object" ? obj.order.product.id : obj.order?.product) ||
      metadata.pack ||
      "";

    let walletId = (metadata.wallet_id || "").trim();
    let pack = (metadata.pack || "") as PackId;
    let credits = Number(metadata.credits || 0);

    if (requestId) {
      const order = await context.env.SAMPLES_DB.prepare(
        `SELECT id, wallet_id, pack, credits, status FROM orders WHERE id = ?`,
      )
        .bind(requestId)
        .first<{ id: string; wallet_id: string; pack: PackId; credits: number; status: string }>();
      if (order) {
        walletId = order.wallet_id;
        pack = order.pack;
        credits = order.credits;
      }
    }

    if (!pack || !(pack in PACK_CREDITS)) {
      pack = packFromProductId(context.env, String(productId)) || pack;
    }
    if (!credits && pack && pack in PACK_CREDITS) {
      credits = PACK_CREDITS[pack];
    }

    if (!isWalletId(walletId) || !credits || credits <= 0) {
      console.error("webhook missing wallet/credits", { walletId, credits, requestId });
      return json({ ok: false, error: "missing_wallet_or_credits" }, 400, headers);
    }

    const customer =
      obj.customer ||
      (typeof obj.order?.customer === "object" ? obj.order.customer : undefined);
    const email = customer?.email || null;
    const creemCustomerId =
      customer?.id || (typeof obj.order?.customer === "string" ? obj.order.customer : null);
    const creemOrderId =
      obj.order?.id || obj.id || event.id || `evt_${Date.now()}`;
    const refId = `creem_order:${creemOrderId}`;

    const result = await grantCredits(context.env.SAMPLES_DB, {
      walletId,
      credits,
      reason: `pack_${pack || "unknown"}`,
      refId,
      email,
      creemCustomerId,
      meta: JSON.stringify({ eventType, requestId, productId }),
    });

    const now = new Date().toISOString();
    if (requestId) {
      await context.env.SAMPLES_DB.prepare(
        `UPDATE orders
         SET status = 'paid',
             creem_order_id = ?,
             email = COALESCE(?, email),
             updated_at = ?
         WHERE id = ?`,
      )
        .bind(creemOrderId, email, now, requestId)
        .run();
    }

    return json(
      {
        ok: true,
        granted: result.granted,
        balance: result.balance,
        wallet_id: walletId,
        credits,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("webhook error", error);
    return json({ ok: false, error: "webhook_error" }, 500, headers);
  }
};
