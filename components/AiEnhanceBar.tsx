"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AI_IMAGE_CREDIT_COST } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

type Props = {
  enabled: boolean;
  /** Export current source frame as JPEG blob for AI. */
  captureSourceJpeg: () => Promise<Blob | null>;
  /** Apply AI result as a still image into the tool. */
  onAiResult: (blob: Blob) => Promise<void>;
};

export function AiEnhanceBar({ enabled, captureSourceJpeg, onAiResult }: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const walletId = getOrCreateWalletId();
    try {
      const res = await fetch(`/api/billing/me?wallet_id=${encodeURIComponent(walletId)}`);
      const data = (await res.json()) as { ok?: boolean; balance?: number };
      if (data.ok && typeof data.balance === "number") setBalance(data.balance);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const runEnhance = useCallback(async () => {
    setMessage(null);
    const walletId = getOrCreateWalletId();
    if (balance !== null && balance < AI_IMAGE_CREDIT_COST) {
      track("ai_enhance_blocked", { reason: "no_credits" });
      setMessage("No credits left — buy a pack to run AI restore.");
      return;
    }
    setBusy(true);
    track("ai_enhance_click", { balance: balance ?? -1 });
    try {
      const jpeg = await captureSourceJpeg();
      if (!jpeg) {
        setMessage("Could not capture this frame for AI.");
        return;
      }
      const form = new FormData();
      form.set("wallet_id", walletId);
      form.set("image", jpeg, "frame.jpg");
      const res = await fetch("/api/ai/enhance", { method: "POST", body: form });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        balance?: number;
        image_base64?: string;
        content_type?: string;
        detail?: string;
      };
      if (typeof data.balance === "number") setBalance(data.balance);
      if (!res.ok || !data.ok || !data.image_base64) {
        if (data.error === "insufficient_credits") {
          setMessage("Not enough credits. Buy a pack, then retry.");
        } else if (data.error === "ai_not_configured") {
          setMessage("AI is not configured on the server yet. Credits still work once AI is enabled.");
        } else {
          setMessage(data.detail || data.error || "AI enhance failed. Credits were refunded if charged.");
        }
        track("ai_enhance_fail", { reason: data.error || res.status });
        return;
      }
      const bin = atob(data.image_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const out = new Blob([bytes], { type: data.content_type || "image/jpeg" });
      await onAiResult(out);
      track("ai_enhance_success", { balance: data.balance });
      setMessage("AI restore applied. Compare and save when ready.");
    } catch {
      setMessage("Network error during AI enhance.");
      track("ai_enhance_fail", { reason: "network" });
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [balance, captureSourceJpeg, onAiResult, refresh]);

  if (!enabled) return null;

  return (
    <div className="ai-enhance-bar">
      <div className="ai-enhance-bar-copy">
        <strong>AI Restore</strong>
        <span>
          For hard gold/olive melts the free tool cannot undo. {AI_IMAGE_CREDIT_COST} credit /
          image. Pay first — no free AI burns.
        </span>
      </div>
      <div className="ai-enhance-bar-actions">
        <span className="ai-credit-pill">
          {balance === null ? "Credits…" : `${balance} credit${balance === 1 ? "" : "s"}`}
        </span>
        <button type="button" className="btn-primary btn-compact" disabled={busy} onClick={() => void runEnhance()}>
          {busy ? "Running AI…" : "Run AI Restore"}
        </button>
        <Link href="/pricing" className="btn-ghost btn-compact" onClick={() => track("ai_pricing_click")}>
          Buy credits
        </Link>
      </div>
      {message && <p className="ai-enhance-msg">{message}</p>}
    </div>
  );
}
