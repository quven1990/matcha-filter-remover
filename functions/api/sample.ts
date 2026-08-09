/// <reference types="@cloudflare/workers-types" />

type SampleEnv = {
  SAMPLES_DB: D1Database;
};

/** Keep under D1 2MB row limit with headroom. */
const MAX_BYTES = 900 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") || "";
  const allowed =
    origin.endsWith("matchafilter.online") ||
    origin.endsWith("matcha-filter-8ib.pages.dev") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:");
  return allowed
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        vary: "Origin",
      }
    : {};
}

function safeMeta(value: FormDataEntryValue | null, max = 40): string {
  if (typeof value !== "string") return "unknown";
  return value.trim().slice(0, max).replace(/[^\w.\-:/+]/g, "") || "unknown";
}

function safeInt(value: FormDataEntryValue | null, fallback = 0): number {
  if (typeof value !== "string") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 && n < 100_000 ? n : fallback;
}

export const onRequestOptions: PagesFunction<SampleEnv> = async (context) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
};

export const onRequestPost: PagesFunction<SampleEnv> = async (context) => {
  const headers = corsHeaders(context.request);
  try {
    if (!context.env.SAMPLES_DB) {
      return json({ ok: false, error: "sample_storage_unavailable" }, 503, headers);
    }

    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ ok: false, error: "expected_multipart" }, 400, headers);
    }

    const form = await context.request.formData();
    const consent = form.get("consent");
    if (consent !== "yes") {
      return json({ ok: false, error: "consent_required" }, 400, headers);
    }

    const sample = form.get("sample");
    const blob =
      sample && typeof sample === "object" && "arrayBuffer" in sample && "size" in sample && "type" in sample
        ? (sample as Blob)
        : null;
    if (!blob) {
      return json({ ok: false, error: "sample_missing" }, 400, headers);
    }

    const type = (blob.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_TYPES.has(type)) {
      return json({ ok: false, error: "unsupported_type" }, 415, headers);
    }
    if (blob.size <= 0 || blob.size > MAX_BYTES) {
      return json({ ok: false, error: "size_limit" }, 413, headers);
    }

    const mode = safeMeta(form.get("mode"), 16);
    const mediaType = safeMeta(form.get("media_type"), 16);
    const width = safeInt(form.get("width"));
    const height = safeInt(form.get("height"));
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const bytes = new Uint8Array(await blob.arrayBuffer());

    await context.env.SAMPLES_DB.prepare(
      `INSERT INTO samples
        (id, mode, media_type, width, height, content_type, byte_size, bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, mode, mediaType, width, height, type, bytes.byteLength, bytes, createdAt)
      .run();

    return json({ ok: true, id }, 200, headers);
  } catch (error) {
    console.error("sample upload failed", error);
    return json({ ok: false, error: "upload_failed" }, 500, headers);
  }
};
