import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds — Matcha Filter",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <article className="prose">
      <h1>Refunds</h1>
      <p>Last updated: August 11, 2026</p>
      <p>
        AI credit packs are sold as digital one-time purchases via Creem (merchant of record).
      </p>
      <h2>When we refund</h2>
      <ul>
        <li>Duplicate charges or confirmed payment errors.</li>
        <li>AI jobs that failed after a charge — credits are auto-refunded to your wallet.</li>
        <li>Unused packs within 14 days if no AI jobs were run (contact us).</li>
      </ul>
      <h2>When we do not refund</h2>
      <ul>
        <li>Credits already spent on successful AI jobs.</li>
        <li>Dissatisfaction with creative results after a successful AI run (best-effort).</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Email{" "}
        <a href="mailto:billing@matchafilter.online">billing@matchafilter.online</a> with your
        Creem order id / receipt. Free on-device tools never require payment — see{" "}
        <Link href="/pricing">Pricing</Link>.
      </p>
    </article>
  );
}
