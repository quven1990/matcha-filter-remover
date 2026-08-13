"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  hint?: string;
  className?: string;
};

export function ExampleCompare({
  beforeSrc,
  afterSrc,
  beforeLabel = "Free cleanup",
  afterLabel = "AI Restore",
  hint = "Example · drag to compare · not your file",
  className = "",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (clientX: number) => {
      const el = frameRef.current;
      if (!el || !dragging.current) return;
      const rect = el.getBoundingClientRect();
      const next = ((clientX - rect.left) / rect.width) * 100;
      setSplit(Math.min(88, Math.max(12, next)));
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

  const setFromEvent = (clientX: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(88, Math.max(12, next)));
  };

  return (
    <div className={`example-compare ${className}`.trim()}>
      <p className="example-compare-kicker">{hint}</p>
      <div
        ref={frameRef}
        className="example-compare-frame"
        style={{ ["--split" as string]: `${split}%` }}
        role="img"
        aria-label={`${beforeLabel} versus ${afterLabel}. Drag to compare.`}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromEvent(e.clientX, e.currentTarget);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setFromEvent(e.clientX, e.currentTarget);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="example-compare-img example-compare-after"
          src={afterSrc}
          alt=""
          width={960}
          height={720}
          decoding="async"
          draggable={false}
        />
        <div className="example-compare-before-clip" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="example-compare-img"
            src={beforeSrc}
            alt=""
            width={960}
            height={720}
            decoding="async"
            draggable={false}
          />
        </div>
        <div className="example-compare-handle" aria-hidden>
          <span className="example-compare-knob" />
        </div>
        <span className="example-compare-tag example-compare-tag-before">{beforeLabel}</span>
        <span className="example-compare-tag example-compare-tag-after">{afterLabel}</span>
      </div>
      <p className="example-compare-note">
        Left = free WebGL ceiling. Right = what 1 AI credit can still try. Best-effort — won’t uncover
        censored detail.
      </p>
    </div>
  );
}
