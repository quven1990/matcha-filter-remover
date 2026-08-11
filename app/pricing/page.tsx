import type { Metadata } from "next";
import Link from "next/link";
import { PricingCheckout } from "@/components/PricingCheckout";
import { CREDIT_PACKS, AI_IMAGE_CREDIT_COST } from "@/lib/billing-packs";

export const metadata: Metadata = {
  title: "AI Credits — Matcha Filter",
  description:
    "Buy AI restore credits for hard matcha filters. Free on-device Remove stays free. Pay-as-you-go via Creem.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <article className="prose pricing-page">
      <p className="eyebrow">Credits</p>
      <h1>AI Restore credits</h1>
      <p>
        Free Remove/Apply stay on-device and unlimited for normal use. AI Restore is optional for
        hard gold/olive melts — <strong>{AI_IMAGE_CREDIT_COST} credit per image</strong>, charged
        only when the job succeeds (failures refund).
      </p>
      <PricingCheckout />
      <h2>What you get</h2>
      <ul>
        {CREDIT_PACKS.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> — {p.credits} credits ({p.priceLabel})
          </li>
        ))}
      </ul>
      <h2>How it works</h2>
      <ol>
        <li>Buy a pack (Creem checkout — no Google login required).</li>
        <li>Credits bind to this browser wallet (keep the same device/browser).</li>
        <li>
          On <Link href="/remove">Remove</Link>, upload → try free tool → Run AI Restore if needed.
        </li>
      </ol>
      <p>
        See <Link href="/refund">Refunds</Link> and <Link href="/terms">Terms</Link>. You must be
        18+ to buy credits / run AI. Illegal or prohibited uploads (including any sexual content
        involving minors) are blocked. Successful AI runs are not cash-refundable; failed or
        safety-blocked jobs return the credit to your wallet only. Merchant of record: Creem.
      </p>
    </article>
  );
}
