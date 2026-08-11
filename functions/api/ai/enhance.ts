/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  corsHeaders,
  ensureWallet,
  getBalance,
  grantCredits,
  isWalletId,
  json,
  recordSafetyBlock,
  spendCredits,
} from "../../_lib/billing";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1024;
const CREDIT_COST = 1;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

// Paid path: Kontext Pro (~$0.04/image) — much stronger identity-preserving edits than kontext/dev.
const FAL_MODEL = "fal-ai/flux-pro/kontext";

export const onRequestOptions: PagesFunction<BillingEnv> = async (context) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
};

async function decodeImageMeta(
  bytes: Uint8Array,
): Promise<{ width: number; height: number } | null> {
  if (bytes.length < 24) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        return { width, height };
      }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      i += 2 + len;
    }
  }
  return { width: 0, height: 0 };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const RESTORE_PROMPT =
  "This photo has a viral TikTok matcha filter: olive-green and gold metallic color grade, " +
  "posterized duotone, embossed/liquid-metal edges, and extra grain. " +
  "Edit ONLY the color grade and texture artifacts. " +
  "Restore natural skin tones, realistic hair color, and normal background colors. " +
  "Keep the exact same person, face identity, pose, camera framing, clothing, and composition. " +
  "Do not restyle into art, marble, wood grain, anime, or a new photo. " +
  "Do not add objects. Photorealistic unfiltered smartphone photo. " +
  "Refuse any request involving sexual content with minors or child sexual abuse material.";

async function runFalEnhance(apiKey: string, imageBytes: Uint8Array, contentType: string) {
  const dataUrl = `data:${contentType};base64,${bytesToBase64(imageBytes)}`;
  const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
    method: "POST",
    headers: {
      authorization: `Key ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      image_url: dataUrl,
      prompt: RESTORE_PROMPT,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: "jpeg",
      // Lower = stricter provider safety filtering.
      safety_tolerance: "1",
      enhance_prompt: false,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    images?: Array<{ url?: string }>;
    detail?: string | Array<{ msg?: string }>;
    error?: string;
    has_nsfw_concepts?: boolean[];
  };
  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
          : data.error || `fal_${res.status}`;
    const lower = detail.toLowerCase();
    if (lower.includes("nsfw") || lower.includes("safety") || lower.includes("moderat")) {
      throw new Error("content_blocked");
    }
    throw new Error(detail);
  }
  if (data.has_nsfw_concepts?.some(Boolean)) {
    throw new Error("content_blocked");
  }
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("fal_no_image");
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error("fal_fetch_failed");
  const outType = imgRes.headers.get("content-type") || "image/jpeg";
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  // Black / near-empty frames sometimes returned when safety blanks the output.
  if (buf.byteLength < 1200) {
    throw new Error("content_blocked");
  }
  return { bytes: buf, contentType: outType };
}

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request);
  let reservedRef: string | null = null;
  let walletId = "";

  try {
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "billing_unavailable" }, 503, headers);
    }
    if (!context.env.FAL_KEY) {
      return json(
        {
          ok: false,
          error: "ai_not_configured",
          detail: "Set FAL_KEY in Cloudflare Pages secrets to enable AI Restore.",
        },
        503,
        headers,
      );
    }

    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ ok: false, error: "expected_multipart" }, 400, headers);
    }

    const form = await context.request.formData();
    walletId = String(form.get("wallet_id") || "").trim();
    if (!isWalletId(walletId)) {
      return json({ ok: false, error: "invalid_wallet" }, 400, headers);
    }

    const acceptsPolicy = String(form.get("accepts_policy") || "").trim();
    if (acceptsPolicy !== "1" && acceptsPolicy.toLowerCase() !== "true") {
      return json({ ok: false, error: "policy_required" }, 400, headers);
    }

    const wallet = await ensureWallet(context.env.SAMPLES_DB, walletId);
    if (wallet.status === "suspended") {
      return json(
        {
          ok: false,
          error: "wallet_suspended",
          detail:
            "This wallet is suspended for policy or safety reasons. Contact abuse@ or billing@.",
          balance: wallet.balance,
        },
        403,
        headers,
      );
    }

    const file = form.get("image");
    const blob =
      file && typeof file === "object" && "arrayBuffer" in file && "size" in file && "type" in file
        ? (file as Blob)
        : null;
    if (!blob) return json({ ok: false, error: "image_missing" }, 400, headers);

    const type = (blob.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED.has(type)) return json({ ok: false, error: "unsupported_type" }, 415, headers);
    if (blob.size <= 0 || blob.size > MAX_BYTES) {
      return json({ ok: false, error: "size_limit" }, 413, headers);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const meta = await decodeImageMeta(bytes);
    if (meta && meta.width > 0 && meta.height > 0) {
      if (Math.max(meta.width, meta.height) > MAX_EDGE * 2.5) {
        // Allow larger uploads; provider will resize. Soft warn only.
      }
    }

    const balance = await getBalance(context.env.SAMPLES_DB, walletId);
    if (balance < CREDIT_COST) {
      return json({ ok: false, error: "insufficient_credits", balance, cost: CREDIT_COST }, 402, headers);
    }

    const jobId = crypto.randomUUID();
    reservedRef = `ai_spend:${jobId}`;
    const spent = await spendCredits(context.env.SAMPLES_DB, {
      walletId,
      cost: CREDIT_COST,
      reason: "ai_enhance_image",
      refId: reservedRef,
      meta: JSON.stringify({ contentType: type, bytes: bytes.byteLength }),
    });
    if (!spent.ok) {
      return json(
        {
          ok: false,
          error: spent.error === "insufficient" ? "insufficient_credits" : "duplicate",
          balance: spent.balance,
        },
        spent.error === "insufficient" ? 402 : 409,
        headers,
      );
    }

    let result: { bytes: Uint8Array; contentType: string };
    try {
      result = await runFalEnhance(context.env.FAL_KEY, bytes, type);
    } catch (err) {
      const blocked = String(err).includes("content_blocked");
      await grantCredits(context.env.SAMPLES_DB, {
        walletId,
        credits: CREDIT_COST,
        reason: "ai_enhance_refund",
        refId: `ai_refund:${jobId}`,
        meta: String(err),
      });
      if (blocked) {
        const after = await recordSafetyBlock(
          context.env.SAMPLES_DB,
          walletId,
          JSON.stringify({ jobId, reason: "content_blocked" }),
        );
        console.error("ai enhance content_blocked", walletId, after.safety_block_count, after.status);
        return json(
          {
            ok: false,
            error: after.status === "suspended" ? "wallet_suspended" : "content_blocked",
            detail:
              after.status === "suspended"
                ? "Repeated safety blocks — wallet suspended. Credit refunded for this job."
                : "content_blocked",
            balance: await getBalance(context.env.SAMPLES_DB, walletId),
            safety_block_count: after.safety_block_count,
          },
          after.status === "suspended" ? 403 : 422,
          headers,
        );
      }
      console.error("ai enhance failed", err);
      return json(
        {
          ok: false,
          error: "ai_failed",
          detail: String(err),
          balance: await getBalance(context.env.SAMPLES_DB, walletId),
        },
        502,
        headers,
      );
    }

    const b64 = bytesToBase64(result.bytes);
    return json(
      {
        ok: true,
        balance: spent.balance,
        cost: CREDIT_COST,
        content_type: result.contentType,
        image_base64: b64,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("ai enhance error", error);
    if (reservedRef && walletId && context.env.SAMPLES_DB) {
      try {
        await grantCredits(context.env.SAMPLES_DB, {
          walletId,
          credits: CREDIT_COST,
          reason: "ai_enhance_refund",
          refId: `ai_refund_err:${reservedRef}`,
          meta: String(error),
        });
      } catch {
        /* ignore */
      }
    }
    return json({ ok: false, error: "enhance_error" }, 500, headers);
  }
};
