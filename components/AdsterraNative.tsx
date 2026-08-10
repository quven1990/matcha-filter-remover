"use client";

import { useEffect, useRef, useState } from "react";

/** Adsterra Native Banner — keep out of tool preview / export dock. */
const SCRIPT_SRC =
  "https://pl30785002.effectivecpmnetwork.com/51143ea58c1b4f2d420b03ca8803cadb/invoke.js";
const CONTAINER_ID = "container-51143ea58c1b4f2d420b03ca8803cadb";

type AdsterraNativeProps = {
  className?: string;
};

function hasAdCreative(root: HTMLElement | null) {
  if (!root) return false;
  return !!root.querySelector("iframe, img, ins, [id^='aswift'], a[href]");
}

export function AdsterraNative({ className = "" }: AdsterraNativeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ADSTERRA_NATIVE === "0") return;

    const prev = document.querySelector<HTMLScriptElement>(
      `script[data-adsterra-native="1"]`,
    );
    prev?.remove();

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.dataset.cfasync = "false";
    script.dataset.adsterraNative = "1";
    document.body.appendChild(script);

    const root = rootRef.current;
    const check = () => {
      const container = document.getElementById(CONTAINER_ID);
      if (hasAdCreative(container) || hasAdCreative(root)) {
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

    const hideTimer = window.setTimeout(() => {
      if (!check()) setVisible(false);
    }, 7000);

    return () => {
      observer.disconnect();
      clearTimeout(hideTimer);
      script.remove();
    };
  }, []);

  if (process.env.NEXT_PUBLIC_ADSTERRA_NATIVE === "0") return null;
  if (!visible) return null;

  return (
    <aside
      ref={rootRef}
      className={`ad-slot ${filled ? "is-filled" : "is-loading"} ${className}`.trim()}
      aria-label="Sponsored"
      aria-hidden={!filled}
    >
      {filled ? <p className="ad-slot-label">Sponsored</p> : null}
      <div id={CONTAINER_ID} />
    </aside>
  );
}
