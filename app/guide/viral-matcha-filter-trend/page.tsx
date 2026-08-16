import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraLeaderboard } from "@/components/AdsterraBanner";

export const metadata: Metadata = {
  title: "Viral Matcha Filter Trend Explained",
  description:
    "What the viral matcha filter trend is, why people search for it, and how to apply or clean the green TikTok-style look safely.",
  alternates: { canonical: "/guide/viral-matcha-filter-trend" },
};

export default function ViralMatchaFilterTrendPage() {
  const articleJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Viral Matcha Filter Trend Explained",
    description:
      "A plain-language guide to the viral matcha filter trend, the green look, and safe ways to apply or clean it.",
    author: {
      "@type": "Organization",
      name: "Matcha Filter",
    },
    publisher: {
      "@type": "Organization",
      name: "Matcha Filter",
      url: "https://matchafilter.online",
    },
    mainEntityOfPage: "https://matchafilter.online/guide/viral-matcha-filter-trend",
    inLanguage: "en-US",
  };

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the viral matcha filter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It is a green, hazy short-video look often used for dramatic before/after edits. It is an aesthetic effect, not an official TikTok feature from this site.",
        },
      },
      {
        "@type": "Question",
        name: "Can I remove the viral matcha filter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can clean green cast, haze, grain, and harsh contrast from a saved file, but you cannot perfectly recover original pixels once the effect is baked in.",
        },
      },
      {
        "@type": "Question",
        name: "Can it reveal hidden or censored content?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Matcha Filter Remover does not reveal hidden, censored, blurred, or painted-over detail.",
        },
      },
    ],
  };

  return (
    <article className="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
      <p className="eyebrow">Trend guide</p>
      <h1>Viral Matcha Filter Trend Explained</h1>

      <div className="answer-box prose-answer">
        <h2>Short answer</h2>
        <p>
          The viral matcha filter is a green-tinted short-video look: olive cast, haze, grain,
          and sometimes a liquid-metal texture. People search for it to understand the trend,
          recreate the look, or <Link href="/remove">clean the matcha filter</Link> from a saved
          photo or clip.
        </p>
      </div>

      <h2>Why the matcha filter went viral</h2>
      <h3>It reads fast in a scroll</h3>
      <p>
        The green cast is easy to recognize in a feed, so even a short frame can signal the
        trend before the viewer reads a caption.
      </p>
      <h3>It creates a strong reveal</h3>
      <p>
        Many edits use the filter as a before/after contrast: hazy green first, cleaner color
        after. That makes the result feel dramatic even when the underlying edit is simple.
      </p>

      <h2>Apply it or remove it</h2>
      <h3>If you want the viral look</h3>
      <p>
        Open <Link href="/apply">Apply Matcha Filter</Link> to add a green, grainy look to your
        own image or short clip in the browser.
      </p>
      <h3>If you want to clean the look</h3>
      <p>
        Open <Link href="/remove">Matcha Filter Remover</Link> to reduce green cast, haze, and
        grain from a saved file. For platform-specific steps, use the{" "}
        <Link href="/guide/how-to-remove-matcha-filter-on-tiktok">TikTok matcha filter guide</Link>.
      </p>

      <h2>Safe limits</h2>
      <h3>Best-effort cleanup</h3>
      <p>
        A finished export does not contain the untouched original pixels. Cleanup can make the
        color more natural, but it cannot rebuild the exact original file.
      </p>
      <h3>No hidden-detail recovery</h3>
      <p>
        This site does not help reveal hidden, censored, blurred, or NSFW-obscured content. Use
        it only on media you have rights to edit.
      </p>

      <AdsterraLeaderboard />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/remove" className="btn-primary" style={{ marginRight: "0.75rem" }}>
          Remove Matcha Filter
        </Link>
        <Link href="/guide/what-is-matcha-filter" className="btn-secondary">
          Read the definition
        </Link>
      </p>
    </article>
  );
}
