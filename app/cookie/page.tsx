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
        We may use essential cookies required to run the site. If we enable analytics
        cookies later, we will update this page and provide a consent choice where
        required.
      </p>
      <p>
        You can control cookies through your browser settings.
      </p>
    </article>
  );
}
