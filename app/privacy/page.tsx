import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 12, 2026</p>
      <p>
        Matcha Filter (“we”) provides an on-device photo and video toolkit at
        matchafilter.online, with optional paid AI restore credits.
      </p>
      <h2>Media you process</h2>
      <h3>On-device tools (default)</h3>
      <p>
        The default Apply and Remove tools process media in your browser. We do not
        upload that media to our servers unless you explicitly opt in to share a sample
        or you run optional AI Restore.
      </p>
      <h3>Optional AI Restore</h3>
      <p>
        If you buy credits and run AI Restore, the selected frame is uploaded to our
        edge function and an AI image provider (currently fal.ai) solely to generate a
        restored still. NSFW, adult, pornographic, and sexually explicit media are
        prohibited on all tools (see <a href="/terms">Terms</a>). Uploads are used for that
        request only; we do not use them for advertising or model training by us. The
        provider may apply automated safety screening. We do not intentionally retain AI upload bytes after the response is
        returned. Failed or safety-blocked jobs refund the credit. For safety and
        fraud prevention we may store wallet status, safety-block event counts, and
        related ledger metadata (not the image itself), and may suspend a wallet after
        repeated blocks or abuse reports. See <a href="/pricing">Pricing</a>,{" "}
        <a href="/refund">Refunds</a>, and <a href="/terms">Terms</a>.
      </p>
      <h3>Payments</h3>
      <p>
        Credit purchases are processed by Creem (merchant of record). Creem receives
        payment details; we store wallet id, optional email, order ids, and credit
        ledger entries in Cloudflare D1 to deliver credits.
      </p>
      <h3>Voluntary sample sharing</h3>
      <p>
        After you process a file, we may ask once whether to share a compressed thumbnail
        (for example after you adjust sliders, or before Save/Download). Nothing is uploaded
        unless you tap “Confirm &amp; share”. Cancel (or close the dialog) and we collect
        nothing — and we won’t ask again in this browser tab. Samples have no original
        filename, are stored privately in our D1 database, are not published, and are not used
        for advertising. You can request deletion by emailing{" "}
        <a href="mailto:privacy@matchafilter.online">privacy@matchafilter.online</a>.
      </p>
      <h2>Analytics</h2>
      <h3>Plausible, Google Analytics, and Clarity</h3>
      <p>
        We use Plausible Analytics (self-hosted at plausible.shipsolo.io), Google Analytics
        4 (measurement ID G-GZRT1YKE5C), and Microsoft Clarity (project ID xzfom2wtm3) to
        understand aggregate traffic, product usage, and session behavior. Plausible does
        not use cookies for analytics. Google Analytics and Clarity may set cookies and
        process data as described in{" "}
        <a href="https://policies.google.com/privacy" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>{" "}
        and{" "}
        <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">
          Microsoft&apos;s Privacy Statement
        </a>
        . These services do not receive the media you process in the tools.
      </p>
      <h2>Advertising</h2>
      <h3>Adsterra</h3>
      <p>
        We may show third-party ads (Adsterra) on content areas of the site. Ad networks may
        set cookies or use device identifiers to measure and personalize ads. Ads are kept
        outside the upload/preview/export controls so they do not block tool actions. See also
        the Cookie Policy.
      </p>
      <h2>Contact</h2>
      <h3>Privacy requests</h3>
      <p>
        Privacy questions or data requests:{" "}
        <a href="mailto:privacy@matchafilter.online">privacy@matchafilter.online</a>
      </p>
      <h3>General contact</h3>
      <p>
        Other questions:{" "}
        <a href="mailto:contact@matchafilter.online">contact@matchafilter.online</a>
      </p>
      <h2>Children</h2>
      <h3>Age restriction</h3>
      <p>
        The service is not directed to children under 13. Purchasing credits and using AI
        Restore requires that you are at least 18.
      </p>
    </article>
  );
}
