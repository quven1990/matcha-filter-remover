import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Matcha Filter — Viral Matcha Look, Apply or Remove Online",
  description:
    "Matcha Filter is a private browser toolkit to apply the viral matcha green effect or reduce it from photos and videos — free, on-device, no account.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-atmosphere" aria-hidden>
          <span className="hero-blob hero-blob-a" />
          <span className="hero-blob hero-blob-b" />
          <span className="hero-blob hero-blob-c" />
          <span className="hero-grain" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">On-device · Private</p>
          <h1 className="display brand-display">Matcha Filter</h1>
          <p className="lead">
            Apply the viral green look, or dial it back when you need a clearer frame —
            processed on your device.
          </p>
          <div className="cta-row">
            <Link href="/remove" className="btn-primary">
              Remove Matcha Filter
            </Link>
            <Link href="/apply" className="btn-secondary">
              Apply Matcha Filter
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-split">
        <div>
          <p className="eyebrow">Choose a path</p>
          <h2>Two tools. One matcha trend.</h2>
        </div>
        <div className="path-row">
          <Link href="/remove" className="path-link">
            <span className="path-kicker">Most searched</span>
            <strong>Remove</strong>
            <span>Reduce green cast, grain, and haze on a saved photo or short video.</span>
          </Link>
          <Link href="/apply" className="path-link">
            <span className="path-kicker">Create</span>
            <strong>Apply</strong>
            <span>Add liquid motion, olive grade, and film grain without leaving the browser.</span>
          </Link>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Privacy</p>
        <h2>Private by default — media stays in your browser.</h2>
        <p>
          Default tools run on-device with WebGL. No account wall, no upload server for
          the free remover and apply flow.
        </p>
      </section>

      <section className="section section-last">
        <p className="eyebrow">Limits</p>
        <h2>Honest limits beat false “restore original” claims.</h2>
        <p>
          A baked-in effect cannot be perfectly reversed. We reduce visible cast and
          grain — we do not uncover hidden or censored detail.
        </p>
        <div className="cta-row">
          <Link href="/guide/what-is-matcha-filter" className="btn-ghost">
            Read the guide
          </Link>
          <Link href="/guide/how-to-remove-matcha-filter" className="btn-ghost">
            How to remove
          </Link>
        </div>
      </section>
    </>
  );
}
