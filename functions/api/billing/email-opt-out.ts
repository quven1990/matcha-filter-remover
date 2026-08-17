/// <reference types="@cloudflare/workers-types" />

import { type BillingEnv, hmacHex, json, siteOrigin, timingSafeEqual } from "../../_lib/billing";

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });
}

export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  if (!context.env.SAMPLES_DB) return json({ ok: false, error: "billing_unavailable" }, 503);
  const secret = context.env.ABANDONED_EMAIL_SECRET?.trim();
  if (!secret) return json({ ok: false, error: "abandoned_email_not_configured" }, 503);

  const url = new URL(context.request.url);
  const orderId = url.searchParams.get("order_id") || "";
  const sig = url.searchParams.get("sig") || "";
  if (!orderId || !sig) return htmlResponse("<h1>Invalid link</h1>", 400);

  const row = await context.env.SAMPLES_DB.prepare(`SELECT email FROM orders WHERE id = ? LIMIT 1`)
    .bind(orderId)
    .first<{ email: string | null }>();
  const email = row?.email?.trim().toLowerCase();
  if (!email) return htmlResponse("<h1>Invalid link</h1>", 400);

  const expected = await hmacHex(secret, `abandoned_optout:${orderId}:${email}`);
  if (!timingSafeEqual(sig, expected)) return htmlResponse("<h1>Invalid link</h1>", 400);

  await context.env.SAMPLES_DB.prepare(
    `INSERT OR REPLACE INTO email_suppression (email, reason, created_at)
     VALUES (?, 'checkout_reminder_opt_out', ?)`,
  )
    .bind(email, new Date().toISOString())
    .run();

  return htmlResponse(`<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>No more checkout reminders</title>
<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;max-width:680px;margin:48px auto;padding:0 20px;color:#151515">
  <h1>No more checkout reminders</h1>
  <p>We will not send future checkout reminder emails to ${escapeHtml(email)}.</p>
  <p><a href="${siteOrigin(context.env, context.request)}">Return to Matcha Filter</a></p>
</body>`);
};
