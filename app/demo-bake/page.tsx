"use client";

/**
 * Dev-only bake page for homepage compare assets.
 * Open /demo-bake, wait for status "ready", then pull window.__demoBake.
 *
 * Before = real Apply (olive + liquid + grain) — the look people save/search.
 * After  = clean source — what they hope to see. Remover is best-effort and
 * cannot restore this from a baked clip; homepage copy must stay honest.
 */

import { useEffect, useRef, useState } from "react";
import { MatchaGL } from "@/lib/webgl-matcha";

const SOURCE =
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=960&h=1200&fit=crop&q=85";

declare global {
  interface Window {
    __demoBake?: {
      status: string;
      withFilter?: string;
      filterRemoved?: string;
      params?: Record<string, number | string>;
    };
  }
}

function canvasToWebpDataUrl(canvas: HTMLCanvasElement, quality = 0.9) {
  return canvas.toDataURL("image/webp", quality);
}

export default function DemoBakePage() {
  const applyRef = useRef<HTMLCanvasElement>(null);
  const cleanRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("starting");

  useEffect(() => {
    let cancelled = false;
    window.__demoBake = { status: "starting" };

    const run = async () => {
      try {
        setStatus("loading-source");
        window.__demoBake = { status: "loading-source" };

        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("source image failed"));
          img.src = SOURCE;
        });
        if (cancelled) return;

        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // Viral still: olive paint + readable face + soft swirl (not melt caricature)
        const strength = 88;
        const liquid = 52;
        const grain = 34;
        const time = 0.72;

        const applyCanvas = applyRef.current!;
        const glApply = new MatchaGL(applyCanvas);
        glApply.upload(img, w, h);
        glApply.renderApply({ strength, liquid, grain, time });
        glApply.dispose();

        const withFilter = canvasToWebpDataUrl(applyCanvas, 0.92);
        if (cancelled) return;

        const cleanCanvas = cleanRef.current!;
        cleanCanvas.width = w;
        cleanCanvas.height = h;
        const cctx = cleanCanvas.getContext("2d");
        if (!cctx) throw new Error("clean 2d failed");
        cctx.drawImage(img, 0, 0);
        const filterRemoved = canvasToWebpDataUrl(cleanCanvas, 0.92);
        if (cancelled) return;

        const payload = {
          status: "ready",
          withFilter,
          filterRemoved,
          params: { strength, liquid, grain, time, after: "clean-source" },
        };
        window.__demoBake = payload;
        setStatus("ready");
      } catch (err) {
        const message = err instanceof Error ? err.message : "bake failed";
        setStatus(message);
        window.__demoBake = { status: message };
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1100 }}>
      <h1>Demo bake</h1>
      <p>
        Status: <strong id="bake-status">{status}</strong>
      </p>
      <p>
        Before = Apply (liquid matcha). After = clean source (not Remove output —
        homepage labels must stay honest).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h2>With filter (Apply)</h2>
          <canvas ref={applyRef} style={{ width: "100%", background: "#111" }} />
        </div>
        <div>
          <h2>Clean source</h2>
          <canvas ref={cleanRef} style={{ width: "100%", background: "#111" }} />
        </div>
      </div>
    </main>
  );
}
