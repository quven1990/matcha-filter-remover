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
      <p>Last updated: August 12, 2026</p>
      <p>
        AI credit packs are <strong>digital one-time goods</strong> sold via Creem (merchant of
        record). Buying credits means you can run AI Restore; it does not guarantee a specific
        artistic outcome.
      </p>

      <h2>When we refund money</h2>
      <ul>
        <li>Duplicate charges or confirmed payment / processor errors.</li>
        <li>
          Unused packs within <strong>7 days</strong> of purchase if <strong>no AI jobs</strong>{" "}
          were started on that wallet (email us with your Creem order / receipt id).
        </li>
      </ul>

      <h2>Credits (not cash)</h2>
      <ul>
        <li>
          If an AI job fails or is blocked by safety checks after a credit was reserved, that{" "}
          <strong>credit is returned to your wallet automatically</strong> — this is not a card
          refund.
        </li>
      </ul>

      <h2>When we do not refund</h2>
      <ul>
        <li>Credits already used on a <strong>successful</strong> AI job (image delivered).</li>
        <li>
          Dissatisfaction with creative quality after a successful run (AI is best-effort; matcha
          filters that permanently baked the original cannot always be recovered).
        </li>
        <li>Change of mind after any AI job was started.</li>
        <li>
          Chargebacks filed instead of contacting us first may lead to wallet suspension while we
          investigate. Suspended wallets cannot buy credits or run AI Restore until reviewed, and
          are not entitled to cash refunds for credits already successfully consumed.
        </li>
      </ul>

      <h2>How to request</h2>
      <p>
        Email{" "}
        <a href="mailto:billing@matchafilter.online">billing@matchafilter.online</a> within the
        window above. Include: Creem order id / receipt, approximate purchase time, and the browser
        you used (credits bind to a local wallet id). We verify whether any AI job was started on
        that wallet before approving an unused-pack refund. Free on-device Remove/Apply never require
        payment — see <Link href="/pricing">Pricing</Link> and <Link href="/terms">Terms</Link>.
      </p>
    </article>
  );
}
