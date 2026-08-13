"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  href?: string;
};

export function HeroCompare({
  beforeSrc,
  afterSrc,
  href = "/remove",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(48);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (clientX: number) => {
      const el = frameRef.current;
      if (!el || !dragging.current) return;
      const rect = el.getBoundingClientRect();
      const next = ((clientX - rect.left) / rect.width) * 100;
      setSplit(Math.min(86, Math.max(14, next)));
    };

    const onPointerMove = (e: PointerEvent) => onMove(e.clientX);
    const onPointerUp = () => {
      dragging.current = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div className="hero-compare">
      <div
        ref={frameRef}
        className="hero-compare-frame"
        style={{ ["--split" as string]: `${split}%` }}
        role="img"
        aria-label="Viral matcha look versus clean source. Drag to compare."
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          dragging.current = true;
          const rect = e.currentTarget.getBoundingClientRect();
          const next = ((e.clientX - rect.left) / rect.width) * 100;
          setSplit(Math.min(86, Math.max(14, next)));
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-compare-img hero-compare-after"
          src={afterSrc}
          alt="Example after · clean source without the viral matcha look"
          width={960}
          height={1200}
          decoding="async"
        />
        <div className="hero-compare-before-clip" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-compare-img"
            src={beforeSrc}
            alt="Example before · viral matcha green filter look"
            width={960}
            height={1200}
            decoding="async"
          />
        </div>
        <div className="hero-compare-handle" aria-hidden>
          <span className="hero-compare-knob" />
        </div>
        <span className="hero-compare-tag hero-compare-tag-before">Viral matcha look</span>
        <span className="hero-compare-tag hero-compare-tag-after">Clean source</span>
      </div>
      <p className="hero-compare-hint">
        <span className="hero-compare-hint-long">
          Applied look vs clean source · remover reduces cast, not a perfect restore ·{" "}
        </span>
        <span className="hero-compare-hint-short">Best-effort remover · </span>
        <Link href={href}>Remove matcha filter</Link>
      </p>
    </div>
  );
}
