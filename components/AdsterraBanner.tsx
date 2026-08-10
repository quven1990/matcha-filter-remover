"use client";

import { useEffect, useId, useRef, useState } from "react";

type BannerSize = "300x250" | "320x50" | "728x90";

const BANNER_CONFIG: Record<
  BannerSize,
  { key: string; width: number; height: number }
> = {
  "300x250": {
    key: "7209adadd2398433a14fd65060a9b5c2",
    width: 300,
    height: 250,
  },
  "320x50": {
    key: "69e5251ae88fc354f2470e8e0429ac32",
    width: 320,
    height: 50,
  },
  "728x90": {
    key: "a5c9197814f2563a096a470c15ffd854",
    width: 728,
    height: 90,
  },
};

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      height: number;
      width: number;
      params: Record<string, unknown>;
    };
  }
}

type AdsterraBannerProps = {
  size?: BannerSize;
  className?: string;
};

function adsDisabled(size: BannerSize) {
  if (process.env.NEXT_PUBLIC_ADSTERRA_BANNER === "0") return true;
  if (size === "320x50" && process.env.NEXT_PUBLIC_ADSTERRA_BANNER_320 === "0") return true;
  if (size === "728x90" && process.env.NEXT_PUBLIC_ADSTERRA_BANNER_728 === "0") return true;
  return false;
}

/** Adsterra iframe banners — content areas only, never tool dock/preview. */
export function AdsterraBanner({ size = "300x250", className = "" }: AdsterraBannerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const config = BANNER_CONFIG[size];
  const envOff = adsDisabled(size);

  useEffect(() => {
    if (envOff) return;
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();

    window.atOptions = {
      key: config.key,
      format: "iframe",
      height: config.height,
      width: config.width,
      params: {},
    };

    const script = document.createElement("script");
    script.src = `https://www.highperformanceformat.com/${config.key}/invoke.js`;
    script.async = true;
    script.dataset.cfasync = "false";
    script.dataset.adsterraBanner = size;
    script.dataset.adsterraInstance = reactId;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, [config.height, config.key, config.width, envOff, reactId, size]);

  if (envOff) return null;

  return (
    <aside
      className={`ad-slot ad-slot-banner ad-slot-banner-${size} ${className}`.trim()}
      aria-label="Sponsored"
    >
      <p className="ad-slot-label">Sponsored</p>
      <div
        ref={hostRef}
        className="ad-slot-banner-host"
        style={{ width: config.width, minHeight: config.height, maxWidth: "100%" }}
      />
    </aside>
  );
}

/**
 * One leaderboard slot: 728×90 on desktop, 320×50 on mobile.
 * Avoids loading two atOptions iframe units on the same page.
 */
export function AdsterraLeaderboard({ className = "" }: { className?: string }) {
  const [size, setSize] = useState<BannerSize | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setSize(mq.matches ? "728x90" : "320x50");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!size) {
    return (
      <aside className={`ad-slot ad-slot-banner ${className}`.trim()} aria-hidden>
        <p className="ad-slot-label">Sponsored</p>
        <div className="ad-slot-banner-host" style={{ width: 320, minHeight: 50 }} />
      </aside>
    );
  }

  return <AdsterraBanner key={size} size={size} className={className} />;
}
