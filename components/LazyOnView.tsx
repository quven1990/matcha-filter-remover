"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyOnViewProps = {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number;
};

/** Mount children only after the slot is near the viewport. */
export function LazyOnView({
  children,
  rootMargin = "320px",
  minHeight = 80,
}: LazyOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, show]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
