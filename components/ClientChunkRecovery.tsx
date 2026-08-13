"use client";

import { useEffect } from "react";

/** After a deploy, stale tabs may request deleted `/_next/static` assets and look unstyled / white-screen. */
function isChunkLoadError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === "string"
        ? err
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    msg,
  );
}

export function ClientChunkRecovery() {
  useEffect(() => {
    const reloadOnce = () => {
      try {
        const key = "mf_chunk_reload";
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const onError = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLLinkElement && target.rel === "stylesheet") {
        reloadOnce();
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

    // Resource errors (CSS/JS 404 after deploy) do not bubble — capture them.
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    // Soft check: if Next CSS links never produced a sheet after load, recover.
    const softCheck = window.setTimeout(() => {
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"][href*="/_next/static/css/"]',
      );
      for (const link of links) {
        if (!link.sheet) {
          reloadOnce();
          return;
        }
      }
      // Clear one-shot flag after a healthy load so a later deploy can recover again.
      try {
        sessionStorage.removeItem("mf_chunk_reload");
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
