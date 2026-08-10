import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraBanner } from "@/components/AdsterraBanner";
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
        <h3>Upload once, export locally</h3>
        <p>
          Upload a still or short clip, then download a shareable result without jumping
          through a separate creator app for a basic matcha grade.
        </p>
        <h3>Need to reverse the look?</h3>
        <p>
          Prefer reducing an existing green veil? Use{" "}
          <Link href="/remove">Matcha Filter Remover</Link> for best-effort cleanup.
        </p>
      </section>

      <section className="section">
        <h2>Tune strength, grain, and motion</h2>
        <h3>Filter strength</h3>
        <p>Controls how strong the olive / green grade feels across the frame.</p>
        <h3>Liquid motion</h3>
        <p>Adds soft watery movement suited to short loops and aesthetic drafts.</p>
        <h3>Film grain</h3>
        <p>Layers texture so the look feels less flat on phones and desktop previews.</p>
      </section>

      <section className="section faq">
        <h2>FAQ</h2>
        {faq.map((item) => (
          <details key={item.q}>
            <summary>
              <h3>{item.q}</h3>
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <AdsterraBanner size="300x250" />
    </>
  );
}
