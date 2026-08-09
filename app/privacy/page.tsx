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
      <p>Last updated: August 9, 2026</p>
      <p>
        Matcha Filter (“we”) provides an on-device photo and video toolkit at
        matchafilter.online.
      </p>
      <h2>Media you process</h2>
      <h3>On-device tools (default)</h3>
      <p>
        The default Apply and Remove tools process media in your browser. We do not
        upload that media to our servers unless you explicitly opt in to share a sample.
      </p>
      <h3>Voluntary sample sharing</h3>
      <p>
        After you upload a file, you may optionally choose “Share sample” and confirm
        consent. Only then do we receive a compressed thumbnail/frame (no original
        filename) so we can review difficult matcha cases and improve the tools. Samples
        are stored privately in our D1 database, are not published, and are not used
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
      <p>The service is not directed to children under 13.</p>
    </article>
  );
}
