"use client";

import { useEffect, useState } from "react";
import { CREDIT_PACKS, PAYMENTS_ENABLED, type CreditPackId } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

function buyLabel(pack: (typeof CREDIT_PACKS)[number], busy: boolean) {
  if (busy) return "Redirecting…";
  if (pack.id === "trial" || pack.id === "starter") return `Try · ${pack.priceLabel}`;
  return `Buy ${pack.name} · ${pack.priceLabel}`;
}

export function PricingCheckout() {
  const [busyPack, setBusyPack] = useState<CreditPackId | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track("pricing_view");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#packs") return;
    const el = document.getElementById("packs");
    if (!el) return;
    // Next client nav often skips native hash scroll — do it after paint.
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  const buy = async (pack: CreditPackId) => {
    setError(null);
    if (!PAYMENTS_ENABLED) {
      setError("Card checkout is temporarily paused. Free Remove/Apply still works.");
      track("billing_checkout_blocked", { pack, reason: "payments_paused" });
      return;
    }
    setBusyPack(pack);
    // Tapping Buy is the consent (18+ / Terms / no prohibited media).
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
        if (data.error === "payments_paused") {
          setError(data.detail || "Card checkout is temporarily paused.");
        } else if (data.error === "creem_not_configured" || data.error === "product_not_configured") {
          setError(
            "Payments are not configured yet. Add Creem API key + product IDs in Cloudflare secrets.",
          );
        } else if (data.error === "wallet_suspended") {
          setError(
            data.detail ||
              "This wallet is suspended for policy or safety reasons. Contact billing@ or abuse@.",
          );
        } else if (data.error === "policy_required") {
          setError("Please retry checkout. If this keeps happening, refresh the page.");
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

  const packs = (
    <div id="packs" className="pricing-grid">
      {CREDIT_PACKS.map((pack) => (
        <article key={pack.id} className={`pricing-card ${pack.popular ? "is-popular" : ""}`}>
          {pack.popular && <p className="pricing-badge">Most used</p>}
          <h2>{pack.name}</h2>
          <p className="pricing-price">{pack.priceLabel}</p>
          <p className="pricing-credits">{pack.credits} AI credits</p>
          <p className="pricing-blurb">{pack.blurb}</p>
          {PAYMENTS_ENABLED ? (
            <button
              type="button"
              className="btn-primary"
              disabled={busyPack !== null}
              onClick={() => void buy(pack.id)}
            >
              {buyLabel(pack, busyPack === pack.id)}
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled>
              Coming soon
            </button>
          )}
        </article>
      ))}
    </div>
  );

  if (!PAYMENTS_ENABLED) {
    return (
      <div className="pricing-checkout">
        <div className="pricing-paused" role="status">
          <p className="pricing-paused-title">Card checkout temporarily paused</p>
          <p>
            We are finishing live payment onboarding with our merchant of record (Creem). Free
            on-device Remove/Apply stays available. AI credit packs will reopen here as soon as live
            billing is enabled — no site outage for the free tools.
          </p>
          <p>
            Questions:{" "}
            <a href="mailto:billing@matchafilter.online">billing@matchafilter.online</a>
          </p>
        </div>
        {packs}
        <p className="pricing-note">
          Free Remove/Apply never requires credits. Paid AI Restore will return when checkout is
          re-enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="pricing-checkout">
      {packs}
      <p className="pricing-agree-note">
        By tapping Buy you confirm you are 18+, won’t submit prohibited media, and accept{" "}
        <a href="/terms">Terms</a> and <a href="/refund">Refunds</a>. Credits are digital —
        successful runs aren’t cash-refundable.
      </p>
      {error && (
        <p className="pricing-error" role="alert">
          {error}
        </p>
      )}
      <div className="pricing-checkout-meta">
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
      </div>
      <p className="pricing-note">
        Checkout via Creem. Free Remove/Apply never needs credits. Failed or safety-blocked AI jobs
        return the credit to your wallet — not a card refund.
      </p>
    </div>
  );
}
