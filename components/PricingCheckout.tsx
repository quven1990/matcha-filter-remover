"use client";

import { useState } from "react";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

export function PricingCheckout() {
  const [busyPack, setBusyPack] = useState<CreditPackId | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const buy = async (pack: CreditPackId) => {
    setError(null);
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
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        checkout_url?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok || !data.checkout_url) {
        setError(
          data.error === "creem_not_configured" || data.error === "product_not_configured"
            ? "Payments are not configured yet. Add Creem API key + product IDs in Cloudflare secrets."
            : data.detail || data.error || "Checkout failed",
        );
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
              disabled={busyPack !== null}
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
        requires credits. AI runs only after payment — failed jobs refund the credit.
      </p>
    </div>
  );
}
