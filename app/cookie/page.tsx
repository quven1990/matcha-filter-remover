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

      <h2>What we use</h2>
      <h3>Essential cookies</h3>
      <p>We may use essential cookies required to run the site.</p>
      <h3>Analytics</h3>
      <p>
        Plausible analytics runs without analytics cookies. Google Analytics 4 and Microsoft
        Clarity may set analytics cookies (for example <code>_ga</code> or Clarity session
        cookies); see the Privacy Policy for details.
      </p>
      <h3>Voluntary samples</h3>
      <p>
        Opt-in sample sharing does not rely on cookies. The consent box may be pre-checked;
        nothing is uploaded until you tap Share sample (you can uncheck or choose Not now).
      </p>

      <h2>Your choices</h2>
      <h3>Browser controls</h3>
      <p>You can block or clear cookies through your browser settings.</p>

      <h2>Contact</h2>
      <h3>Email</h3>
      <p>
        Cookie or privacy questions:{" "}
        <a href="mailto:privacy@matchafilter.online">privacy@matchafilter.online</a>
      </p>
    </article>
  );
}
