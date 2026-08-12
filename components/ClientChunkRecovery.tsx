"use client";

import { useEffect } from "react";

/** After a deploy, stale tabs may request deleted `/_next/static` chunks and white-screen. */
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

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) reloadOnce();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
