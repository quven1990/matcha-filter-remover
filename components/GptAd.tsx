"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LazyOnView } from "@/components/LazyOnView";
import { GPT_ADS, GPT_SCRIPT_SRC, type GptAdKey, type GptSize } from "@/lib/gpt-ads";

type GoogletagSlot = {
  addService: (service: unknown) => GoogletagSlot;
};

type SlotRenderEndedEvent = {
  slot: GoogletagSlot;
  isEmpty: boolean;
  size?: [number, number] | string | null;
};

type Googletag = {
  cmd: Array<() => void>;
  defineSlot: (
    path: string,
    sizes: GptSize[] | GptSize,
    divId: string,
  ) => GoogletagSlot | null;
  destroySlots: (slots?: GoogletagSlot[]) => boolean;
  display: (divId: string) => void;
  enableServices: () => void;
  pubads: () => {
    enableSingleRequest: () => void;
    collapseEmptyDivs: (collapse?: boolean) => void;
    addEventListener: (
      eventType: "slotRenderEnded",
      listener: (event: SlotRenderEndedEvent) => void,
    ) => void;
    removeEventListener: (
      eventType: "slotRenderEnded",
      listener: (event: SlotRenderEndedEvent) => void,
    ) => void;
  };
  enums?: {
    OutOfPageFormat?: Record<string, unknown>;
  };
};

declare global {
  interface Window {
    googletag?: Googletag;
  }
}

let gptScriptPromise: Promise<void> | null = null;
let gptServicesEnabled = false;
const activeSlots = new Map<string, GoogletagSlot>();

function ensureGptScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as Window & { googletag?: Googletag };
  if (!w.googletag) {
    w.googletag = { cmd: [] } as unknown as Googletag;
  }
  if (document.getElementById("gpt-script")) {
    return gptScriptPromise ?? Promise.resolve();
  }
  gptScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = "gpt-script";
    script.async = true;
    script.src = GPT_SCRIPT_SRC;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return gptScriptPromise;
}

type GptAdProps = {
  slot: GptAdKey;
  className?: string;
};

/** Content-area GPT unit only — never place inside tool preview / export dock. */
export function GptAd({ slot, className = "" }: GptAdProps) {
  const config = GPT_ADS[slot];
  const slotRef = useRef<GoogletagSlot | null>(null);
  /** null = waiting, true = filled creative, false = empty / no-fill */
  const [filled, setFilled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { divId, path, sizes } = config;

    const onRenderEnded = (event: SlotRenderEndedEvent) => {
      if (cancelled) return;
      if (event.slot !== slotRef.current) return;
      setFilled(!event.isEmpty);
    };

    void ensureGptScript().then(() => {
      if (cancelled) return;
      const googletag = window.googletag;
      if (!googletag) return;

      googletag.cmd.push(() => {
        if (cancelled) return;

        if (!gptServicesEnabled) {
          googletag.pubads().collapseEmptyDivs(true);
          googletag.pubads().enableSingleRequest();
          googletag.enableServices();
          gptServicesEnabled = true;
        }

        googletag.pubads().addEventListener("slotRenderEnded", onRenderEnded);

        const prev = activeSlots.get(divId);
        if (prev) {
          try {
            googletag.destroySlots([prev]);
          } catch {
            /* ignore */
          }
          activeSlots.delete(divId);
        }

        const defined = googletag
          .defineSlot(path, sizes as GptSize[], divId)
          ?.addService(googletag.pubads());
        if (!defined) {
          setFilled(false);
          return;
        }

        activeSlots.set(divId, defined);
        slotRef.current = defined;
        googletag.display(divId);
      });
    });

    return () => {
      cancelled = true;
      const googletag = window.googletag;
      const defined = slotRef.current;
      slotRef.current = null;
      if (!googletag) return;
      googletag.cmd.push(() => {
        try {
          googletag.pubads().removeEventListener("slotRenderEnded", onRenderEnded);
        } catch {
          /* ignore */
        }
        if (defined) {
          try {
            googletag.destroySlots([defined]);
          } catch {
            /* ignore */
          }
          if (activeSlots.get(divId) === defined) activeSlots.delete(divId);
        }
      });
    };
  }, [config]);

  // Hide empty / no-fill so we don't leave a blank "Sponsored" hole.
  if (filled === false) return null;

  const style: CSSProperties = {
    minWidth: config.minWidth,
    minHeight: filled ? config.minHeight : undefined,
    maxWidth: "100%",
  };

  return (
    <aside
      className={`ad-slot ad-slot-gpt ad-slot-banner ${filled ? "is-filled" : "is-loading"} ${className}`.trim()}
      aria-label="Sponsored"
      aria-hidden={!filled}
    >
      {filled ? <p className="ad-slot-label">Sponsored</p> : null}
      <div id={config.divId} style={style} />
    </aside>
  );
}

function LazyGptAd({
  slot,
  className,
  minHeight,
}: {
  slot: GptAdKey;
  className?: string;
  minHeight: number;
}) {
  return (
    <LazyOnView minHeight={minHeight}>
      <GptAd slot={slot} className={className} />
    </LazyOnView>
  );
}

export function HomeInfeedAd({ className }: { className?: string }) {
  return <LazyGptAd slot="home_infeed" className={className} minHeight={120} />;
}

export function HomeLeaderboardGptAd({ className }: { className?: string }) {
  return <LazyGptAd slot="home_leaderboard" className={className} minHeight={90} />;
}

export function RemoveContentAd({ className }: { className?: string }) {
  return <LazyGptAd slot="remove_content" className={className} minHeight={90} />;
}

export function ApplyContentAd({ className }: { className?: string }) {
  return <LazyGptAd slot="apply_content" className={className} minHeight={90} />;
}

export function GuideLeaderboardAd({ className }: { className?: string }) {
  return <LazyGptAd slot="guide_leaderboard" className={className} minHeight={90} />;
}
