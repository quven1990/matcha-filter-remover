import type { Metadata } from "next";
import Link from "next/link";
import { ExampleCompare } from "@/components/ExampleCompare";
import { PricingCheckout } from "@/components/PricingCheckout";
import { AI_IMAGE_CREDIT_COST } from "@/lib/billing-packs";

export const metadata: Metadata = {
  title: "AI Credits — Matcha Filter",
  description:
    "Buy AI restore credits for hard matcha filters. Free on-device Remove stays free. Pay-as-you-go via Creem.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <article className="prose pricing-page">
      <p className="eyebrow">Matcha Filter · AI Restore</p>
      <h1>When free sliders still look melted</h1>
      <p className="pricing-lead">
        Free Remove stays on-device and unlimited. AI Restore is optional —{" "}
        <strong>{AI_IMAGE_CREDIT_COST} credit per still</strong>, charged only when the job
        succeeds.
      </p>

      <div className="pricing-proof">
        <ExampleCompare
          beforeSrc="/demo/pricing-free.webp?v=3"
          afterSrc="/demo/pricing-ai.webp?v=3"
          beforeLabel="Free · still soft"
          afterLabel="AI Restore"
          hint="Example · drag · not your file"
        />
      </div>

      <PricingCheckout />

      <h2>How it works</h2>
      <ol>
        <li>Pick a pack (Creem checkout — no account required).</li>
        <li>Credits stay in this browser wallet (same device/browser).</li>
        <li>
          Open <Link href="/remove">Remove</Link>, upload, then Run AI Restore on hard frames.
        </li>
      </ol>
      <p className="pricing-legal">
        See <Link href="/refund">Refunds</Link> and <Link href="/terms">Terms</Link>. 18+ to buy /
        run AI. Prohibited inputs are blocked — details in Terms. Successful AI runs aren’t
        cash-refundable; failed or safety-blocked jobs return the credit only. Merchant of record:
        Creem.
      </p>
    </article>
  );
}
