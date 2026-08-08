import type { Metadata } from "next";
import Link from "next/link";
import { MediaTool } from "@/components/MediaTool";

export const metadata: Metadata = {
  title: "Matcha Filter Online — Apply the Viral Green Effect",
  description:
    "Apply a matcha-style green look to photos and videos in your browser. Free on-device matcha filter — no TikTok account required.",
  alternates: { canonical: "/apply" },
  openGraph: {
    title: "Apply Matcha Filter",
    description: "Add a soft green matcha look on-device. Free browser tool.",
    url: "https://matchafilter.online/apply",
  },
};

const faq = [
  {
    q: "Is this the official TikTok matcha filter?",
    a: "No. Inspired look for drafts and posts you create yourself.",
  },
  {
    q: "Does my video leave the device?",
    a: "Not for the default on-device apply tool.",
  },
  {
    q: "Can I remove it later?",
    a: "Yes — use the Matcha Filter Remover for best-effort reduction.",
  },
];

export default function ApplyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Matcha Filter Apply",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        url: "https://matchafilter.online/apply",
        description:
          "Free on-device tool to apply a viral matcha-style green look to photos and short videos.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        isAccessibleForFree: true,
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MediaTool
        mode="apply"
        title="Apply Matcha Filter"
        subtitle="Turn an ordinary clip into the soft green, grainy matcha vibe — processed locally."
      />

      <section className="section answer-box">
        <h2>Quick answer</h2>
        <p>
          <strong>Apply Matcha Filter</strong> adds a soft green, grainy matcha look to a
          photo or short video in your browser. It is not an official TikTok filter, and
          processing stays on your device.
        </p>
      </section>

      <section className="section">
        <h2>Make the look without the app hop</h2>
        <p>
          Upload, tune strength and grain, then download a shareable still or short clip.
          Prefer removing an existing green veil? Use{" "}
          <Link href="/remove">Matcha Filter Remover</Link>.
        </p>
      </section>

      <section className="section">
        <h2>Tune strength, grain, and motion</h2>
        <p>
          Start with the recommended sliders, then adjust Filter strength, Liquid motion,
          and Film grain while comparing Original vs Matcha applied.
        </p>
      </section>

      <section className="section faq">
        <h2>FAQ</h2>
        {faq.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
