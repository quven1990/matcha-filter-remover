import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="prose">
      <h1>Terms of Use</h1>
      <p>Last updated: August 9, 2026</p>
      <h2>Service</h2>
      <h3>What we provide</h3>
      <p>
        Matcha Filter provides free, on-device tools to apply or reduce a matcha-style
        green look. Results are best-effort and not a guaranteed restoration of any
        original file.
      </p>
      <h2>Your responsibilities</h2>
      <h3>Allowed use</h3>
      <p>
        Only process media you have rights to edit. Do not use the service to harass,
        exploit, or process intimate imagery of others without lawful permission.
      </p>
      <h2>No affiliation</h2>
      <h3>Independent product</h3>
      <p>We are not affiliated with TikTok or its parent companies.</p>
      <h2>Disclaimer</h2>
      <h3>Best-effort results</h3>
      <p>
        The tools are provided “as is.” We do not claim pixel-perfect recovery or the
        ability to reveal hidden or censored content.
      </p>
      <h2>Contact</h2>
      <h3>Email</h3>
      <p>
        <a href="mailto:hello@matchafilter.online">hello@matchafilter.online</a>
      </p>
    </article>
  );
}
