/// <reference types="@cloudflare/workers-types" />

import {
  type BillingEnv,
  corsHeaders,
  creemApiBase,
  json,
  productIdForPack,
} from "../../_lib/billing";

/** Diagnose Creem key ↔ product ↔ API base mismatch (no secrets leaked). */
export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  const headers = corsHeaders(context.request, "GET, OPTIONS");
  const apiKey = context.env.CREEM_API_KEY?.trim();
  if (!apiKey) {
    return json({ ok: false, error: "creem_not_configured" }, 503, headers);
  }

  const configuredBase = creemApiBase(context.env);
  const productId = productIdForPack(context.env, "starter")?.trim() || null;
  const bases = ["https://test-api.creem.io", "https://api.creem.io"] as const;

  const checks: Array<Record<string, unknown>> = [];
  for (const base of bases) {
    if (!productId) break;
    const res = await fetch(`${base}/v1/products/${encodeURIComponent(productId)}`, {
      headers: { "x-api-key": apiKey },
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      name?: string;
      mode?: string;
      status?: string;
      billing_type?: string;
      error?: string;
      message?: string | string[];
    };
    checks.push({
      base,
      http: res.status,
      ok: res.ok,
      product_name: data.name || null,
      product_mode: data.mode || null,
      product_status: data.status || null,
      billing_type: data.billing_type || null,
      error: res.ok
        ? null
        : Array.isArray(data.message)
          ? data.message.join("; ")
          : data.message || data.error || null,
    });
  }

  const listed: Array<Record<string, unknown>> = [];
  for (const base of bases) {
    const res = await fetch(`${base}/v1/products/search?page_number=1&page_size=20`, {
      headers: { "x-api-key": apiKey },
    });
    const data = (await res.json().catch(() => ({}))) as {
      items?: Array<{ id?: string; name?: string; price?: number; billing_type?: string; status?: string }>;
      error?: string;
      message?: string | string[];
    };
    listed.push({
      base,
      http: res.status,
      products: res.ok
        ? (data.items || []).map((p) => ({
            id: p.id,
            name: p.name,
            price_cents: p.price,
            billing_type: p.billing_type,
            status: p.status,
          }))
        : [],
      error: res.ok
        ? null
        : Array.isArray(data.message)
          ? data.message.join("; ")
          : data.message || data.error || null,
    });
  }

  const working = checks.find((c) => c.ok);
  const testList = listed.find((l) => l.base === "https://test-api.creem.io");
  return json(
    {
      ok: Boolean(working),
      configured_api_base: configuredBase,
      starter_product_id: productId,
      key_prefix: apiKey.slice(0, 12),
      checks,
      listed_products: listed,
      recommendation: working
        ? working.base === configuredBase
          ? "Config looks aligned."
          : `Product reachable on ${working.base}, but CREEM_API_BASE is ${configuredBase}. Set CREEM_API_BASE to ${working.base}.`
        : Array.isArray(testList?.products) && (testList.products as unknown[]).length > 0
          ? "Test API key works, but CREEM_PRODUCT_STARTER is not one of your test products. Update Cloudflare secrets with the IDs from listed_products."
          : "Test mode has no products (or wrong key). In Creem with Test Mode ON, create three one-time products and put their prod_ IDs into Cloudflare secrets.",
    },
    200,
    headers,
  );
};

export const onRequestOptions: PagesFunction<BillingEnv> = async (context) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request, "GET, OPTIONS") });
};
