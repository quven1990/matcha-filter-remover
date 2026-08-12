"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AI_IMAGE_CREDIT_COST, PAYMENTS_ENABLED } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { creditBalanceBucket, elapsedBucket, track } from "@/lib/analytics";

export type AiProgress = {
  active: boolean;
  text: string;
  progress: number;
  hint: string;
};

type Props = {
  enabled: boolean;
  /** Current tool media kind for analytics props. */
  mediaType?: "image" | "video" | null;
  /** Export current source frame as JPEG blob for AI. */
  captureSourceJpeg: () => Promise<Blob | null>;
  /** Apply AI result as a still image into the tool. */
  onAiResult: (blob: Blob) => Promise<void>;
  /** Open the file picker to swap the current photo. */
  onPickNew?: () => void;
  /** Mirror progress onto the preview overlay. */
  onProgress?: (progress: AiProgress) => void;
  /** Called after a successful apply (e.g. scroll preview into view). */
  onSuccess?: () => void;
};

async function resizeJpegBlob(blob: Blob, maxEdge: number, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    if (scale >= 0.999) return blob;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    return out || blob;
  } catch {
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const IDLE_HINT =
  "1 credit · same browser keeps your balance. Videos: current frame only. Best-effort — won’t uncover censored detail.";

export function AiEnhanceBar({
  enabled,
  mediaType = null,
  captureSourceJpeg,
  onAiResult,
  onPickNew,
  onProgress,
  onSuccess,
}: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [walletStatus, setWalletStatus] = useState<"active" | "suspended" | null>(null);
  const [policyOk, setPolicyOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "bad" | "info">("info");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const publish = useCallback(
    (next: { active: boolean; text: string; progress: number; hint?: string }) => {
      setPhase(next.text);
      setProgress(next.progress);
      onProgressRef.current?.({
        active: next.active,
        text: next.text,
        progress: next.progress,
        hint: next.hint || "Cloud AI · usually 15–45 seconds. Keep this tab open.",
      });
    },
    [],
  );

  const refresh = useCallback(async () => {
    const walletId = getOrCreateWalletId();
    try {
      const res = await fetch(`/api/billing/me?wallet_id=${encodeURIComponent(walletId)}`);
      const data = (await res.json()) as {
        ok?: boolean;
        balance?: number;
        status?: "active" | "suspended";
      };
      if (data.ok && typeof data.balance === "number") setBalance(data.balance);
      if (data.ok && (data.status === "active" || data.status === "suspended")) {
        setWalletStatus(data.status);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => () => clearTick(), [clearTick]);

  const runEnhance = useCallback(async () => {
    setMessage(null);
    const walletId = getOrCreateWalletId();
    const media_type = mediaType || undefined;
    if (walletStatus === "suspended") {
      track("ai_enhance_blocked", { reason: "wallet_suspended", media_type });
      setMessageTone("bad");
      setMessage("This wallet is suspended. Contact abuse@ or billing@.");
      return;
    }
    if (!policyOk) {
      track("ai_enhance_blocked", { reason: "no_policy", media_type });
      setMessageTone("bad");
      setMessage("Check the box above to confirm this media is allowed, then tap Run again.");
      document.getElementById("ai-policy-agree")?.focus();
      return;
    }
    if (balance !== null && balance < AI_IMAGE_CREDIT_COST) {
      track("ai_enhance_blocked", { reason: "no_credits", media_type });
      setMessageTone("bad");
      setMessage(
        PAYMENTS_ENABLED
          ? "No credits left — tap Buy credits below, then come back to run AI Restore."
          : "No credits left — checkout is paused right now. Check Pricing for updates.",
      );
      document.getElementById("ai-buy-credits")?.focus();
      return;
    }

    setBusy(true);
    const startedAt = performance.now();
    track("ai_enhance_click", {
      balance: balance ?? -1,
      balance_bucket: creditBalanceBucket(balance),
      media_type,
    });
    publish({ active: true, text: "Preparing frame…", progress: 12 });

    try {
      const jpeg = await captureSourceJpeg();
      if (!jpeg) {
        setMessageTone("bad");
        setMessage("Could not capture this frame for AI.");
        track("ai_enhance_fail", { reason: "capture_failed", media_type });
        return;
      }

      publish({ active: true, text: "Resizing for AI…", progress: 22 });
      const resized = await resizeJpegBlob(jpeg, 1024, 0.9);

      publish({ active: true, text: "Sending to AI…", progress: 32 });
      // Soft progress while the network/model runs (no real % from fal).
      clearTick();
      let soft = 32;
      tickRef.current = setInterval(() => {
        soft = Math.min(88, soft + (soft < 55 ? 3 : soft < 75 ? 1.5 : 0.6));
        publish({
          active: true,
          text: soft < 50 ? "AI is restoring colors…" : soft < 75 ? "Still working — almost there…" : "Finishing up…",
          progress: soft,
        });
      }, 900);

      const form = new FormData();
      form.set("wallet_id", walletId);
      form.set("accepts_policy", "1");
      form.set("image", resized, "frame.jpg");
      const res = await fetch("/api/ai/enhance", { method: "POST", body: form });
      clearTick();

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
        setMessageTone("bad");
        if (data.error === "insufficient_credits") {
          setMessage("Not enough credits. Buy a pack, then retry.");
        } else if (data.error === "ai_not_configured") {
          setMessage("AI is not configured on the server yet.");
        } else if (data.error === "policy_required") {
          setMessage("Confirm the content policy before running AI Restore.");
        } else if (data.error === "wallet_suspended") {
          setWalletStatus("suspended");
          setMessage(
            data.detail ||
              "This wallet is suspended for policy or safety reasons. Credit refunded if charged.",
          );
        } else if (data.error === "content_blocked") {
          setMessage(
            "Blocked by safety checks. Do not bring NSFW, adult, or illegal media (including anything involving minors) into this tool. Credit refunded.",
          );
        } else {
          setMessage(
            data.detail || data.error || "AI enhance failed. Credits were refunded if charged.",
          );
        }
        track("ai_enhance_fail", {
          reason: data.error || res.status,
          media_type,
          elapsed_bucket: elapsedBucket(performance.now() - startedAt),
        });
        return;
      }

      publish({ active: true, text: "Applying result…", progress: 94 });
      const bin = atob(data.image_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const out = new Blob([bytes], { type: data.content_type || "image/jpeg" });
      await onAiResult(out);
      track("ai_enhance_success", {
        balance: data.balance,
        balance_bucket: creditBalanceBucket(data.balance),
        media_type,
        elapsed_bucket: elapsedBucket(performance.now() - startedAt),
      });
      setMessageTone("ok");
      setMessage("AI restore applied. Drag the compare split, then save when ready.");
      onSuccess?.();
    } catch {
      clearTick();
      setMessageTone("bad");
      setMessage("Network error during AI enhance. If a credit was taken, it should refund automatically.");
      track("ai_enhance_fail", {
        reason: "network",
        media_type,
        elapsed_bucket: elapsedBucket(performance.now() - startedAt),
      });
    } finally {
      clearTick();
      setBusy(false);
      publish({ active: false, text: "", progress: 0, hint: IDLE_HINT });
      void refresh();
    }
  }, [
    balance,
    captureSourceJpeg,
    clearTick,
    mediaType,
    onAiResult,
    onSuccess,
    policyOk,
    publish,
    refresh,
    walletStatus,
  ]);

  if (!enabled) return null;

  const noCredits = balance !== null && balance < AI_IMAGE_CREDIT_COST;
  const suspended = walletStatus === "suspended";
  // Only block while a job is running — other blockers need a click so we can show feedback.
  const runDisabled = busy;
  const needsPolicy = !policyOk && !busy && !suspended && !noCredits;

  return (
    <div className={`ai-enhance-bar ${busy ? "is-busy" : ""}`} aria-busy={busy}>
      <label
        className={`ai-enhance-agree ${message && !policyOk ? "is-attention" : ""}`}
        htmlFor="ai-policy-agree"
      >
        <input
          id="ai-policy-agree"
          type="checkbox"
          checked={policyOk}
          disabled={busy || suspended}
          onChange={(e) => {
            setPolicyOk(e.target.checked);
            if (e.target.checked) setMessage(null);
          }}
        />
        <span>
          I have rights to this media and won’t run AI on NSFW / illegal inputs (including sexual
          content involving minors). <Link href="/terms">Terms</Link>
        </span>
      </label>
      <div className="ai-enhance-bar-actions">
        <span className="ai-credit-pill">
          {balance === null ? "Credits…" : `${balance} credit${balance === 1 ? "" : "s"}`}
        </span>
        <button
          type="button"
          className={`btn-primary ${needsPolicy ? "is-needs-policy" : ""}`}
          disabled={runDisabled}
          aria-describedby={!policyOk ? "ai-policy-agree" : undefined}
          onClick={() => void runEnhance()}
        >
          {busy
            ? "Running AI…"
            : suspended
              ? "Wallet suspended"
              : noCredits
                ? PAYMENTS_ENABLED
                  ? "Get credits · from $3.99"
                  : "Need credits"
                : "Restore with AI · 1 credit"}
        </button>
        {onPickNew && (
          <button type="button" className="btn-secondary" disabled={busy} onClick={onPickNew}>
            New photo
          </button>
        )}
        <Link
          id="ai-buy-credits"
          href="/pricing"
          className={`btn-ghost ${noCredits ? "is-emphasis" : ""} ${message && noCredits ? "is-attention-link" : ""}`}
          onClick={() =>
            track("ai_pricing_click", {
              from: "ai_bar",
              balance_bucket: creditBalanceBucket(balance),
            })
          }
          aria-disabled={busy || undefined}
        >
          {PAYMENTS_ENABLED ? "Buy credits" : "Credits soon"}
        </Link>
      </div>

      {busy ? (
        <div className="ai-progress" role="status" aria-live="polite">
          <div className="ai-progress-head">
            <span className="ai-progress-spinner" aria-hidden />
            <strong>{phase || "Working…"}</strong>
          </div>
          <div className="ai-progress-track" aria-hidden>
            <div className="ai-progress-fill" style={{ width: `${Math.max(8, progress)}%` }} />
          </div>
          <p className="ai-progress-hint">Cloud AI · usually 15–45 seconds. Keep this tab open.</p>
        </div>
      ) : (
        <p className="ai-enhance-bar-note">{IDLE_HINT}</p>
      )}

      {message && (
        <p className={`ai-enhance-msg is-${messageTone}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
