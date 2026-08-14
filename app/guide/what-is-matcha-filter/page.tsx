import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraLeaderboard } from "@/components/AdsterraBanner";

export const metadata: Metadata = {
  title: "What Is the Viral Matcha Filter? TikTok Trend Explained",
  description:
    "The viral matcha filter is a green-tinted TikTok-style video look. Learn what the trend means, why it spread, and how to apply or clean it.",
  alternates: { canonical: "/guide/what-is-matcha-filter" },
};

export default function WhatIsPage() {
  const articleJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What Is the Viral Matcha Filter?",
    description:
      "The matcha filter is a viral green-tinted TikTok-style look, often used for aesthetic posts and before/after reveals.",
    author: {
      "@type": "Organization",
      name: "Matcha Filter",
    },
    publisher: {
      "@type": "Organization",
      name: "Matcha Filter",
      url: "https://matchafilter.online",
    },
    mainEntityOfPage: "https://matchafilter.online/guide/what-is-matcha-filter",
    inLanguage: "en-US",
  };

  return (
    <article className="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson) }}
      />
      <p className="eyebrow">Guide</p>
      <h1>What Is the Viral Matcha Filter?</h1>

      <div className="answer-box prose-answer">
        <h2>Short definition</h2>
        <p>
          The viral matcha filter is a heavy green-tinted short-video look — soft haze,
          olive grade, grain, and sometimes a liquid-metal texture — popular on feeds like
          TikTok. It is an aesthetic effect, not a tea product, and not an official platform
          brand.
        </p>
      </div>

      <p>
        People search for the matcha filter trend when they want to understand the green
        look, recreate it, or clean it from a saved clip. This guide explains the trend
        without claiming perfect original-file recovery.
      </p>

      <h2>What people mean by “matcha filter”</h2>
      <h3>Color and texture traits</h3>
      <p>
        Creators usually mean a strong green cast with soft haze or grain — sometimes paired
        with a mid-clip clear reveal. It is an effect look, not a tea product.
      </p>
      <h3>Not the same as green-screen removal</h3>
      <p>
        Correcting a green color cast is different from chroma-key background removal. This
        guide is about the aesthetic filter look on finished media.
      </p>

      <h2>Why it spread</h2>
      <h3>Instant recognition in a fast scroll</h3>
      <p>
        The color is instantly recognizable in a fast scroll, so the look travels quickly in
        short-form feeds.
      </p>
      <h3>Before / after contrast</h3>
      <p>
        The contrast between filtered and clear frames makes simple edits feel dramatic,
        which rewards reposts and remakes.
      </p>

      <h2>Apply it or clean it</h2>
      <h3>If you want the look</h3>
      <p>
        Use <Link href="/apply">Apply Matcha Filter</Link> to add a green, grainy look to
        your own drafts in the browser.
      </p>
      <h3>If you want to reduce the look</h3>
      <p>
        Use <Link href="/remove">Matcha Filter Remover</Link> to clean green cast and haze
        from a saved photo, screenshot, or short clip. For TikTok-specific steps, see{" "}
        <Link href="/guide/how-to-remove-matcha-filter-on-tiktok">
          how to remove the matcha filter on TikTok
        </Link>
        .
      </p>

      <h2>A note on misuse</h2>
      <h3>What we explain</h3>
      <p>
        Some posts misuse heavy filters in ways that break platform rules. We explain the
        trend for clarity so people can recognize the look.
      </p>
      <h3>What we do not help with</h3>
      <p>
        We do not help evade moderation — and our remover cannot reveal hidden or censored
        detail.
      </p>

      <AdsterraLeaderboard />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/apply" className="btn-secondary" style={{ marginRight: "0.75rem" }}>
          Try Apply
        </Link>
        <Link href="/remove" className="btn-primary">
          Try Remove
        </Link>
      </p>
    </article>
  );
}
