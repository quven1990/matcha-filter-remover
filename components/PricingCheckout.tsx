"use client";

import { useEffect, useState } from "react";
import { CREDIT_PACKS, PAYMENTS_ENABLED, type CreditPackId } from "@/lib/billing-packs";
import { getOrCreateWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

function buyLabel(pack: (typeof CREDIT_PACKS)[number], busy: boolean) {
  if (busy) return "Redirecting…";
  if (pack.id === "starter") return `Try · ${pack.priceLabel}`;
  return `Buy ${pack.name} · ${pack.priceLabel}`;
}

export function PricingCheckout() {
  const [busyPack, setBusyPack] = useState<CreditPackId | null>(null);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAgree, setNeedsAgree] = useState(false);

  useEffect(() => {
    track("pricing_view");
  }, []);

  const focusAgree = () => {
    setNeedsAgree(true);
    const el = document.getElementById("pricing-policy-agree");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  };

  const buy = async (pack: CreditPackId) => {
    setError(null);
    if (!PAYMENTS_ENABLED) {
      setError("Card checkout is temporarily paused. Free Remove/Apply still works.");
      track("billing_checkout_blocked", { pack, reason: "payments_paused" });
      return;
    }
    if (!agreed) {
      setError("Check the box below, then tap Buy again.");
      track("billing_checkout_blocked", { pack, reason: "no_agree" });
      focusAgree();
      return;
    }
    setNeedsAgree(false);
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
          setError("Confirm the policy checkbox before checkout.");
          focusAgree();
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
    <div className="pricing-grid">
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
              className={`btn-primary ${!agreed && busyPack === null ? "is-needs-policy" : ""}`}
              disabled={busyPack !== null}
              aria-describedby={!agreed ? "pricing-policy-agree" : undefined}
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

  const agreeAttention = needsAgree || Boolean(error && !agreed);

  return (
    <div className="pricing-checkout">
      {packs}
      {error && agreed && (
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
        <label
          className={`pricing-agree ${agreeAttention ? "is-attention" : ""}`}
          htmlFor="pricing-policy-agree"
        >
          <input
            id="pricing-policy-agree"
            type="checkbox"
            checked={agreed}
            disabled={busyPack !== null}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) {
                setNeedsAgree(false);
                setError(null);
              }
            }}
          />
          <span>
            I am 18+. I won’t process prohibited media. Credits are digital — successful runs aren’t
            cash-refundable. <a href="/terms">Terms</a> · <a href="/refund">Refunds</a>.
          </span>
        </label>
        {error && !agreed && (
          <p className="pricing-error pricing-error-inline" role="alert">
            {error}
          </p>
        )}
      </div>
      <p className="pricing-note">
        Checkout via Creem. Free Remove/Apply never needs credits. Failed or safety-blocked AI jobs
        return the credit to your wallet — not a card refund.
      </p>
    </div>
  );
}
