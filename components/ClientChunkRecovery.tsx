"use client";

import { useEffect } from "react";

/** After a deploy, stale tabs may request deleted `/_next/static` assets and white-screen. */
function isChunkLoadError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === "string"
        ? err
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Loading CSS chunk/i.test(
    msg,
  );
}

function currentBuildKey(): string {
  try {
    const scripts = Array.from(document.querySelectorAll("script[src*='/_next/static/']"));
    const src =
      scripts.map((s) => (s as HTMLScriptElement).src).find((u) => u.includes("main-app-")) ||
      scripts.map((s) => (s as HTMLScriptElement).src).find((u) => u.includes("webpack-")) ||
      "";
    const m = src.match(/\/_next\/static\/[^/]+\/(.+)$/) || src.match(/(main-app-|webpack-)([a-f0-9]+)/);
    return m?.[0] || src.slice(-40) || "unknown";
  } catch {
    return "unknown";
  }
}

export function ClientChunkRecovery() {
  useEffect(() => {
    const buildKey = currentBuildKey();
    const storageKey = `mf_chunk_reload:${buildKey}`;

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(storageKey) === "1") return;
        sessionStorage.setItem(storageKey, "1");
      } catch {
        /* private mode */
      }
      const url = new URL(window.location.href);
      url.searchParams.set("_mf", String(Date.now()));
      window.location.replace(url.toString());
    };

    const onError = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLLinkElement && target.rel === "stylesheet") {
        if (target.href.includes("/_next/static/")) reloadOnce();
        return;
      }
      if (target instanceof HTMLScriptElement && target.src.includes("/_next/static/")) {
        reloadOnce();
        return;
      }
      if (event instanceof ErrorEvent) {
        if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) reloadOnce();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) reloadOnce();
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    const softCheck = window.setTimeout(() => {
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"][href*="/_next/static/css/"]',
      );
      for (const link of links) {
        try {
          if (!link.sheet) {
            reloadOnce();
            return;
          }
        } catch {
          // cross-origin sheet access can throw — ignore
        }
      }
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }, 2500);

    return () => {
      window.clearTimeout(softCheck);
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
