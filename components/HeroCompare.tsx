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
  const [split, setSplit] = useState(52);
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
          alt="Same frame after green cast is reduced (best-effort)"
          width={960}
          height={1200}
          decoding="async"
        />
        <div className="hero-compare-before-clip" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-compare-img"
            src={beforeSrc}
            alt=""
            width={960}
            height={1200}
            decoding="async"
          />
        </div>
        <div className="hero-compare-handle" aria-hidden>
          <span className="hero-compare-knob" />
        </div>
        <span className="hero-compare-tag hero-compare-tag-before">With cast</span>
        <span className="hero-compare-tag hero-compare-tag-after">Cast reduced</span>
      </div>
      <p className="hero-compare-hint">
        <span className="hero-compare-hint-long">
          Drag to compare · best-effort, not a perfect restore ·{" "}
        </span>
        <span className="hero-compare-hint-short">Drag to compare · </span>
        <Link href={href}>Try it on your photo</Link>
      </p>
    </div>
  );
}
