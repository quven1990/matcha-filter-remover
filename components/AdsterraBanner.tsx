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

function hasAdCreative(root: HTMLElement | null) {
  if (!root) return false;
  if (root.querySelector("iframe, img, ins, [id^='aswift']")) return true;
  // Some units inject siblings after the host.
  const parent = root.parentElement;
  if (!parent) return false;
  return !!parent.querySelector("iframe, img");
}

/** Adsterra iframe banners — content areas only, never tool dock/preview. */
export function AdsterraBanner({ size = "300x250", className = "" }: AdsterraBannerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const reactId = useId().replace(/:/g, "");
  const config = BANNER_CONFIG[size];
  const envOff = adsDisabled(size);
  const [visible, setVisible] = useState(true);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (envOff) return;
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    setFilled(false);
    setVisible(true);

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

    const root = rootRef.current;
    const check = () => {
      if (hasAdCreative(root) || hasAdCreative(host)) {
        setFilled(true);
        setVisible(true);
        return true;
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      check();
    });
    if (root) observer.observe(root, { childList: true, subtree: true });

    const timers = [1500, 3500, 6000].map((ms) =>
      window.setTimeout(() => {
        if (!check()) {
          // Keep checking until final timeout below.
        }
      }, ms),
    );
    const hideTimer = window.setTimeout(() => {
      if (!check()) setVisible(false);
    }, 7000);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      clearTimeout(hideTimer);
      host.replaceChildren();
    };
  }, [config.height, config.key, config.width, envOff, reactId, size]);

  if (envOff || !visible) return null;

  return (
    <aside
      ref={rootRef}
      className={`ad-slot ad-slot-banner ad-slot-banner-${size} ${filled ? "is-filled" : "is-loading"} ${className}`.trim()}
      aria-label="Sponsored"
      aria-hidden={!filled}
    >
      {filled ? <p className="ad-slot-label">Sponsored</p> : null}
      <div
        ref={hostRef}
        className="ad-slot-banner-host"
        style={{ width: config.width, minHeight: filled ? config.height : 0, maxWidth: "100%" }}
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
    // Safari < 14 only has addListener/removeListener on MediaQueryList.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  if (!size) return null;

  return <AdsterraBanner key={size} size={size} className={className} />;
}
