/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  creemApiBase,
  hmacHex,
  json,
  siteOrigin,
  timingSafeEqual,
} from "../../_lib/billing";

type CandidateOrder = {
  id: string;
  pack: string;
  credits: number;
  email: string;
  creem_checkout_id: string;
  creem_checkout_url: string;
  created_at: string;
};

type SendResult = {
  order_id: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

const MIN_AGE_MINUTES = 20;
const MAX_AGE_MINUTES = 60;
const SUPPORT_EMAIL = "billing@matchafilter.online";

export const onRequestOptions: PagesFunction<BillingEnv> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, x-abandoned-email-secret",
    },
  });
};

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  try {
    const configuredSecret = context.env.ABANDONED_EMAIL_SECRET?.trim();
    const providedSecret = context.request.headers.get("x-abandoned-email-secret") || "";
    if (!configuredSecret || !timingSafeEqual(providedSecret, configuredSecret)) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    if (!context.env.SAMPLES_DB) return json({ ok: false, error: "billing_unavailable" }, 503);
    if (!context.env.EMAIL) return json({ ok: false, error: "email_not_configured" }, 503);

    const from = (context.env.ABANDONED_EMAIL_FROM || SUPPORT_EMAIL).trim().toLowerCase();
    if (!from.includes("@")) return json({ ok: false, error: "sender_not_configured" }, 503);

    const legalAddress = context.env.LEGAL_POSTAL_ADDRESS?.trim();
    if (!legalAddress) {
      return json({ ok: false, error: "legal_postal_address_required" }, 503);
    }

    const now = new Date();
    const maxCreatedAt = new Date(now.getTime() - MIN_AGE_MINUTES * 60_000).toISOString();
    const minCreatedAt = new Date(now.getTime() - MAX_AGE_MINUTES * 60_000).toISOString();
    const rows = await context.env.SAMPLES_DB.prepare(
      `SELECT id, pack, credits, email, creem_checkout_id, creem_checkout_url, created_at
       FROM orders
       WHERE status = 'pending'
         AND email IS NOT NULL
         AND creem_checkout_id IS NOT NULL
         AND creem_checkout_url IS NOT NULL
         AND abandoned_email_sent_at IS NULL
         AND created_at >= ?
         AND created_at <= ?
         AND NOT EXISTS (
           SELECT 1 FROM email_suppression WHERE email_suppression.email = lower(orders.email)
         )
       ORDER BY created_at ASC
       LIMIT 25`,
    )
      .bind(minCreatedAt, maxCreatedAt)
      .all<CandidateOrder>();

    const results: SendResult[] = [];
    for (const order of rows.results || []) {
      const email = order.email.trim().toLowerCase();
      if (!isLikelyEmail(email)) {
        results.push(await markSkipped(context.env.SAMPLES_DB, order.id, "invalid_email"));
        continue;
      }

      const stillOpen = await checkoutStillOpen(context.env, order.creem_checkout_id);
      if (!stillOpen) {
        results.push(await markSkipped(context.env.SAMPLES_DB, order.id, "checkout_not_open"));
        continue;
      }

      const optOutUrl = await buildOptOutUrl(context.env, context.request, order.id, email);
      const message = buildMessage({
        email,
        checkoutUrl: order.creem_checkout_url,
        optOutUrl,
        pack: order.pack,
        credits: order.credits,
        from,
        legalAddress,
      });

      try {
        await context.env.EMAIL.send(message);
        await context.env.SAMPLES_DB.prepare(
          `UPDATE orders
           SET abandoned_email_sent_at = ?, abandoned_email_error = NULL, updated_at = ?
           WHERE id = ? AND abandoned_email_sent_at IS NULL`,
        )
          .bind(now.toISOString(), now.toISOString(), order.id)
          .run();
        results.push({ order_id: order.id, status: "sent" });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        await context.env.SAMPLES_DB.prepare(
          `UPDATE orders SET abandoned_email_error = ?, updated_at = ? WHERE id = ?`,
        )
          .bind(detail.slice(0, 500), now.toISOString(), order.id)
          .run();
        results.push({ order_id: order.id, status: "failed", reason: detail });
      }
    }

    return json({
      ok: true,
      window_minutes: { min: MIN_AGE_MINUTES, max: MAX_AGE_MINUTES },
      checked: rows.results?.length || 0,
      sent: results.filter((row) => row.status === "sent").length,
      results,
    });
  } catch (error) {
    console.error("abandoned checkout email error", error);
    return json({ ok: false, error: "abandoned_email_error" }, 500);
  }
};

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

async function markSkipped(db: D1Database, orderId: string, reason: string): Promise<SendResult> {
  await db
    .prepare(`UPDATE orders SET abandoned_email_error = ?, updated_at = ? WHERE id = ?`)
    .bind(`skip:${reason}`, new Date().toISOString(), orderId)
    .run();
  return { order_id: orderId, status: "skipped", reason };
}

async function checkoutStillOpen(env: BillingEnv, checkoutId: string): Promise<boolean> {
  const apiKey = env.CREEM_API_KEY?.trim();
  if (!apiKey) return true;

  try {
    const url = new URL(`${creemApiBase(env)}/v1/checkouts`);
    url.searchParams.set("checkout_id", checkoutId);
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) return true;
    const data = (await res.json().catch(() => ({}))) as { status?: string; checkout?: { status?: string } };
    const status = String(data.status || data.checkout?.status || "").toLowerCase();
    return !status || ["open", "pending", "created"].includes(status);
  } catch {
    return true;
  }
}

async function buildOptOutUrl(env: BillingEnv, request: Request, orderId: string, email: string) {
  const secret = env.ABANDONED_EMAIL_SECRET?.trim() || "";
  const sig = await hmacHex(secret, `abandoned_optout:${orderId}:${email}`);
  const url = new URL("/api/billing/email-opt-out", siteOrigin(env, request));
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("sig", sig);
  return url.toString();
}

function buildMessage(args: {
  email: string;
  checkoutUrl: string;
  optOutUrl: string;
  pack: string;
  credits: number;
  from: string;
  legalAddress: string;
}) {
  const subject = "Continue checkout / Need help paying?";
  const preheader = "Your Matcha AI checkout is still open if you want to finish it.";
  const text = [
    preheader,
    "",
    `You started checkout for the ${args.pack} pack (${args.credits} AI restore credits), but payment was not completed.`,
    "Continue only if you still want it:",
    args.checkoutUrl,
    "",
    `Need help paying? Reply to this email or contact ${SUPPORT_EMAIL}.`,
    "",
    "If you changed your mind, ignore this email. We send one checkout reminder per checkout.",
    `Opt out of future checkout reminders: ${args.optOutUrl}`,
    "",
    args.legalAddress,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f7f3eb;color:#171717;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <p style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</p>
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">Finish your Matcha AI checkout?</h1>
      <p style="margin:0 0 16px">You started checkout for the ${escapeHtml(args.pack)} pack (${args.credits} AI restore credits), but payment was not completed.</p>
      <p style="margin:24px 0">
        <a href="${escapeAttribute(args.checkoutUrl)}" style="display:inline-block;background:#1d1d1b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">Continue checkout</a>
      </p>
      <p style="margin:0 0 16px">Need help paying? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#1d1d1b">${SUPPORT_EMAIL}</a>.</p>
      <p style="margin:0 0 24px">If you changed your mind, ignore this email. We send one checkout reminder per checkout.</p>
      <p style="font-size:12px;color:#666;margin:0 0 12px"><a href="${escapeAttribute(args.optOutUrl)}" style="color:#666">Opt out of future checkout reminders</a></p>
      <p style="font-size:12px;color:#666;margin:0">${escapeHtml(args.legalAddress)}</p>
    </div>
  </body>
</html>`;

  return {
    to: args.email,
    from: { email: args.from, name: "Matcha Filter" },
    replyTo: SUPPORT_EMAIL,
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${args.optOutUrl}>`,
    },
  };
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

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
