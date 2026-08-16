"use client";

import dynamic from "next/dynamic";
import { LazyOnView } from "@/components/LazyOnView";

const AdsterraNative = dynamic(
  () => import("@/components/AdsterraNative").then((m) => ({ default: m.AdsterraNative })),
  { ssr: false },
);

const AdsterraLeaderboard = dynamic(
  () => import("@/components/AdsterraBanner").then((m) => ({ default: m.AdsterraLeaderboard })),
  { ssr: false },
);

export function HomeNativeAd() {
  return (
    <LazyOnView minHeight={140}>
      <AdsterraNative />
    </LazyOnView>
  );
}

export function HomeLeaderboardAd() {
  return (
    <LazyOnView minHeight={90}>
      <AdsterraLeaderboard />
    </LazyOnView>
  );
}
