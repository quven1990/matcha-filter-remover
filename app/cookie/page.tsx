import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: { canonical: "/cookie" },
};

export default function CookiePage() {
  return (
    <article className="prose">
      <h1>Cookie Policy</h1>
      <p>Last updated: August 9, 2026</p>
      <p>
        We may use essential cookies required to run the site. Plausible analytics runs
        without analytics cookies. Google Analytics 4 and Microsoft Clarity may set
        analytics cookies (for example <code>_ga</code> or Clarity session cookies); see
        the Privacy Policy for details. You can block or clear cookies in your browser
        settings.
      </p>
      <p>
        You can control cookies through your browser settings.
      </p>
    </article>
  );
}
