"use client";

import type { AnalyticsParams } from "@/lib/analytics";

const ENTRY_KEY = "mf_entry_context";
const PRICING_FROM_KEY = "mf_pricing_from";

type EntryContext = {
  entry_path?: string;
  entry_referrer?: string;
  first_seen_at?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

export type CheckoutContext = EntryContext & {
  page_path?: string;
  referrer?: string;
  pricing_from?: string;
  source?: string;
  language?: string;
  timezone?: string;
  device_hint?: string;
  viewport_bucket?: string;
  screen_bucket?: string;
};

function safeUrlPath(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.pathname}${url.search ? url.search.slice(0, 160) : ""}`;
  } catch {
    return value.slice(0, 180);
  }
}

function safeReferrer(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`.slice(0, 180);
  } catch {
    return value.slice(0, 180);
  }
}

function viewportBucket(width: number) {
  if (!Number.isFinite(width) || width <= 0) return "unknown";
  if (width < 480) return "mobile_narrow";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function screenBucket(width: number) {
  if (!Number.isFinite(width) || width <= 0) return "unknown";
  if (width < 390) return "under_390";
  if (width < 430) return "390_429";
  if (width < 768) return "430_767";
  if (width < 1200) return "768_1199";
  return "1200_plus";
}

function sourceFromReferrer(referrer?: string, utmSource?: string) {
  if (utmSource) return utmSource.slice(0, 80);
  if (!referrer) return "direct";
  const host = referrer.split("/")[0].toLowerCase();
  if (host.includes("google")) return "google";
  if (host.includes("bing")) return "bing";
  if (host.includes("duckduckgo")) return "duckduckgo";
  if (host.includes("yahoo")) return "yahoo";
  if (host.includes("yandex")) return "yandex";
  if (host.includes("chatgpt")) return "chatgpt";
  if (host.includes("perplexity")) return "perplexity";
  return host.slice(0, 80);
}

function readEntryContext(): EntryContext {
  try {
    const stored = window.localStorage.getItem(ENTRY_KEY);
    if (stored) return JSON.parse(stored) as EntryContext;

    const params = new URLSearchParams(window.location.search);
    const entry: EntryContext = {
      entry_path: safeUrlPath(window.location.href),
      entry_referrer: safeReferrer(document.referrer),
      first_seen_at: new Date().toISOString(),
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_term: params.get("utm_term") || undefined,
      utm_content: params.get("utm_content") || undefined,
    };
    window.localStorage.setItem(ENTRY_KEY, JSON.stringify(entry));
    return entry;
  } catch {
    return {
      entry_path: safeUrlPath(window.location.href),
      entry_referrer: safeReferrer(document.referrer),
    };
  }
}

export function rememberPricingIntent(from: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRICING_FROM_KEY, from.slice(0, 80));
  } catch {
    /* ignore */
  }
}

export function getCheckoutContext(): CheckoutContext {
  if (typeof window === "undefined") return {};
  const entry = readEntryContext();
  let pricingFrom: string | undefined;
  try {
    pricingFrom =
      new URLSearchParams(window.location.search).get("from") ||
      window.sessionStorage.getItem(PRICING_FROM_KEY) ||
      undefined;
  } catch {
    pricingFrom = undefined;
  }

  const referrer = safeReferrer(document.referrer);
  const source = sourceFromReferrer(referrer || entry.entry_referrer, entry.utm_source);

  return {
    ...entry,
    page_path: safeUrlPath(window.location.href),
    referrer,
    pricing_from: pricingFrom,
    source,
    language: navigator.language?.slice(0, 32),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 80),
    device_hint: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
    viewport_bucket: viewportBucket(window.innerWidth),
    screen_bucket: screenBucket(window.screen?.width || window.innerWidth),
  };
}

export function checkoutContextAnalyticsParams(context: CheckoutContext): AnalyticsParams {
  return {
    source: context.source,
    entry_page: context.entry_path,
    pricing_from: context.pricing_from,
    device_hint: context.device_hint,
    viewport_bucket: context.viewport_bucket,
    language: context.language,
  };
}
