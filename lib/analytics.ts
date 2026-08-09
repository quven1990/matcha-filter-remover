export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

function cleanParams(params?: AnalyticsParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!params) return out;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

/** Fire to GA4 + Plausible. Never send filenames or media bytes. */
export function track(event: string, params?: AnalyticsParams) {
  if (typeof window === "undefined") return;
  const clean = cleanParams(params);

  try {
    window.gtag?.("event", event, clean);
  } catch {
    /* ignore */
  }

  try {
    const props: Record<string, string> = {};
    for (const [key, value] of Object.entries(clean)) {
      props[key] = String(value);
    }
    window.plausible?.(event, Object.keys(props).length ? { props } : undefined);
  } catch {
    /* ignore */
  }
}

export function sizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return "0-1mb";
  if (mb < 5) return "1-5mb";
  if (mb < 10) return "5-10mb";
  if (mb < 20) return "10-20mb";
  return "20mb+";
}

export function durationBucket(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "unknown";
  if (seconds <= 5) return "0-5s";
  if (seconds <= 15) return "5-15s";
  if (seconds <= 30) return "15-30s";
  return "30s+";
}

export function valueBucket(value: number): string {
  if (value < 20) return "0-20";
  if (value < 40) return "20-40";
  if (value < 60) return "40-60";
  if (value < 80) return "60-80";
  return "80-100";
}

export function elapsedBucket(ms: number): string {
  if (ms < 10_000) return "0-10s";
  if (ms < 30_000) return "10-30s";
  if (ms < 60_000) return "30-60s";
  return "60s+";
}
