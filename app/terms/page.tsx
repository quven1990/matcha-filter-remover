import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="prose">
      <h1>Terms of Use</h1>
      <p>Last updated: August 12, 2026</p>
      <h2>Service</h2>
      <h3>What we provide</h3>
      <p>
        Matcha Filter provides free, on-device tools to apply or reduce a matcha-style green look,
        plus optional paid AI Restore credits. Results are best-effort and not a guaranteed
        restoration of any original file.
      </p>
      <h3>Credits &amp; payments</h3>
      <p>
        AI credit packs are one-time digital purchases via Creem (merchant of record). Credits bind
        to a browser wallet id. Credits are consumed when an AI job succeeds. Full refund rules are
        on the <a href="/refund">Refunds</a> page. In short:
      </p>
      <ul>
        <li>
          Cash refunds: duplicate / processor errors, or unused packs within 7 days if no AI job was
          started on that wallet.
        </li>
        <li>
          Successful AI runs (image delivered) are not cash-refundable, including dissatisfaction
          with creative quality.
        </li>
        <li>
          Failed or safety-blocked jobs return the credit to the wallet automatically — not a card
          refund.
        </li>
        <li>
          Chargebacks filed without contacting us first may lead to wallet suspension while we
          investigate.
        </li>
      </ul>
      <p>
        See also <a href="/pricing">Pricing</a>.
      </p>
      <h2>Your responsibilities</h2>
      <h3>Allowed use</h3>
      <p>
        Matcha Filter is a matcha-style filter toolkit (apply / remove / optional AI restore). It
        is not an adult-content generator. Only process media you have rights to edit. Do not use
        the service to harass, exploit, or process intimate imagery of others without lawful
        permission.
      </p>
      <h3>Prohibited inputs (zero tolerance)</h3>
      <p>
        Do not bring prohibited visual media into our tools. You must not use Matcha Filter —
        including the free on-device Apply and Remove tools, exports, or paid AI Restore — to
        process, upload, enhance, filter, distribute, or attempt to restore any NSFW, adult,
        pornographic, or sexually explicit images or video. This blanket prohibition applies
        regardless of consent, age of subjects, or whether the media is real, fictional, or
        AI-generated.
      </p>
      <p>You must also not upload or run our tools on:</p>
      <ul>
        <li>
          Any sexual, pornographic, or sexually suggestive content involving minors (anyone under
          18), including fictional or AI-generated depictions
        </li>
        <li>Child sexual abuse material (CSAM) or attempts to create, enhance, or restore it</li>
        <li>
          Non-consensual intimate imagery of adults (including “revenge porn” or deepnudes)
        </li>
        <li>
          Attempts to unblur, uncensor, or reconstruct intentionally hidden / mosaicked /
          painted-over private body areas
        </li>
        <li>Content that is otherwise illegal in your jurisdiction</li>
      </ul>
      <p>
        We may refuse, block, or terminate access for violations. We may suspend a wallet (blocking
        further purchases and AI Restore) immediately, including after repeated automated safety
        blocks. Suspended wallets are not entitled to cash refunds for credits already successfully
        consumed. AI Restore may run automated safety checks; blocked jobs do not deliver an image.
        We may report apparent CSAM to relevant authorities or providers where required. Do not
        email suspected CSAM image files to us; report via{" "}
        <a href="mailto:abuse@matchafilter.online">abuse@matchafilter.online</a> with order / wallet
        context only.
      </p>
      <h3>Age</h3>
      <p>
        You must be at least 18 to buy credits or run AI Restore. The free on-device tools are not
        directed to children under 13.
      </p>
      <h2>No affiliation</h2>
      <h3>Independent product</h3>
      <p>We are not affiliated with TikTok or its parent companies.</p>
      <h2>Disclaimer</h2>
      <h3>Best-effort results</h3>
      <p>
        The tools are provided “as is.” We do not claim pixel-perfect recovery or the ability to
        reveal hidden or censored content.
      </p>
      <h2>Contact</h2>
      <h3>Email</h3>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:contact@matchafilter.online">contact@matchafilter.online</a>
      </p>
      <p>
        Abuse / illegal content reports:{" "}
        <a href="mailto:abuse@matchafilter.online">abuse@matchafilter.online</a> (or contact@ if
        abuse@ is unavailable)
      </p>
      <p>
        Billing / refunds:{" "}
        <a href="mailto:billing@matchafilter.online">billing@matchafilter.online</a>
      </p>
    </article>
  );
}
