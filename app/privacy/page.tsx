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
      <p>
        The default Apply and Remove tools process media in your browser. We do not
        upload that media to our servers for the default tools.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use privacy-friendly analytics or Google Analytics in the future to
        understand aggregate traffic. If enabled, that will be disclosed here and in the
        Cookie Policy.
      </p>
      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:hello@matchafilter.online">hello@matchafilter.online</a>
      </p>
      <h2>Children</h2>
      <p>The service is not directed to children under 13.</p>
    </article>
  );
}
