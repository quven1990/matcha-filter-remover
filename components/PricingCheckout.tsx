"use client";

import { useState } from "react";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

export function PricingCheckout() {
  const [busyPack, setBusyPack] = useState<CreditPackId | null>(null);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async (pack: CreditPackId) => {
    setError(null);
    if (!agreed) {
      setError("Confirm you are 18+ and will not upload prohibited content before checkout.");
      track("billing_checkout_blocked", { pack, reason: "no_agree" });
      return;
    }
    setBusyPack(pack);
    track("billing_checkout_click", { pack });
    try {
      const walletId = getOrCreateWalletId();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pack,
          wallet_id: walletId,
          email: email.trim() || undefined,
          accepts_policy: true,
        }),
      });
      const raw = await res.text();
      let data: {
        ok?: boolean;
        checkout_url?: string;
        error?: string;
        detail?: string;
        hint?: string;
        api_base?: string;
        product_id?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(
          res.status >= 500
            ? `Checkout server error (${res.status}). Retry in a moment.`
            : `Checkout failed (${res.status}).`,
        );
        track("billing_checkout_fail", { pack, reason: `http_${res.status}` });
        return;
      }
      if (!res.ok || !data.ok || !data.checkout_url) {
        if (data.error === "creem_not_configured" || data.error === "product_not_configured") {
          setError(
            "Payments are not configured yet. Add Creem API key + product IDs in Cloudflare secrets.",
          );
        } else if (data.error === "wallet_suspended") {
          setError(
            data.detail ||
              "This wallet is suspended for policy or safety reasons. Contact billing@ or abuse@.",
          );
        } else if (data.error === "policy_required") {
          setError("Confirm the 18+ / prohibited-content policy before checkout.");
        } else {
          const parts = [data.detail || data.error || "Checkout failed"];
          if (data.hint) parts.push(data.hint);
          if (data.api_base) parts.push(`API: ${data.api_base}`);
          if (data.product_id) parts.push(`Product: ${data.product_id}`);
          setError(parts.join(" — "));
        }
        track("billing_checkout_fail", { pack, reason: data.error });
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setError("Network error starting checkout.");
      track("billing_checkout_fail", { pack, reason: "network" });
    } finally {
      setBusyPack(null);
    }
  };

  return (
    <div className="pricing-checkout">
      <label className="pricing-email">
        <span>Email for receipt (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>
      <label className="pricing-agree">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          I am 18+, I will not upload sexual content involving minors or other illegal / prohibited
          media, and I understand AI credits are digital goods (successful runs are not cash-refundable).
          See <a href="/terms">Terms</a> and <a href="/refund">Refunds</a>.
        </span>
      </label>
      <div className="pricing-grid">
        {CREDIT_PACKS.map((pack) => (
          <article key={pack.id} className={`pricing-card ${pack.popular ? "is-popular" : ""}`}>
            {pack.popular && <p className="pricing-badge">Most used</p>}
            <h2>{pack.name}</h2>
            <p className="pricing-price">{pack.priceLabel}</p>
            <p className="pricing-credits">{pack.credits} AI credits</p>
            <p className="pricing-blurb">{pack.blurb}</p>
            <button
              type="button"
              className="btn-primary"
              disabled={busyPack !== null || !agreed}
              onClick={() => void buy(pack.id)}
            >
              {busyPack === pack.id ? "Redirecting…" : `Buy ${pack.name}`}
            </button>
          </article>
        ))}
      </div>
      {error && (
        <p className="pricing-error" role="alert">
          {error}
        </p>
      )}
      <p className="pricing-note">
        Checkout is powered by Creem (merchant of record). Free on-device Remove/Apply never
        requires credits. Failed or safety-blocked AI jobs return the credit to your wallet — not a
        card refund.
      </p>
    </div>
  );
}
