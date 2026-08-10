"use client";

import { useEffect } from "react";

/** Adsterra Native Banner — keep out of tool preview / export dock. */
const SCRIPT_SRC =
  "https://pl30785002.effectivecpmnetwork.com/51143ea58c1b4f2d420b03ca8803cadb/invoke.js";
const CONTAINER_ID = "container-51143ea58c1b4f2d420b03ca8803cadb";

type AdsterraNativeProps = {
  className?: string;
};

export function AdsterraNative({ className = "" }: AdsterraNativeProps) {
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

    return () => {
      script.remove();
    };
  }, []);

  if (process.env.NEXT_PUBLIC_ADSTERRA_NATIVE === "0") return null;

  return (
    <aside className={`ad-slot ${className}`.trim()} aria-label="Sponsored">
      <p className="ad-slot-label">Sponsored</p>
      <div id={CONTAINER_ID} />
    </aside>
  );
}
