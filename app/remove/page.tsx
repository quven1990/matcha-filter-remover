import type { Metadata } from "next";
import Link from "next/link";
import { MediaTool } from "@/components/MediaTool";

export const metadata: Metadata = {
  title: "Matcha Filter Remover — Reduce the Green Effect Online",
  description:
    "Free matcha filter remover for photos and short videos. Reduce green cast, grain, and harsh contrast on-device. Cannot reveal hidden or censored detail.",
  alternates: { canonical: "/remove" },
  openGraph: {
    title: "Matcha Filter Remover",
    description:
      "Reduce viral matcha green cast and grain on-device. Free, private, best-effort cleanup.",
    url: "https://matchafilter.online/remove",
  },
};

const faq = [
  {
    q: "What is a matcha filter remover?",
    a: "A tool that reduces the viral matcha green tint, grain, and harsh contrast on a saved photo or video so the frame is clearer.",
  },
  {
    q: "Can this restore the exact original TikTok file?",
    a: "No. Once an effect is baked into an export, missing detail cannot be recovered perfectly. This tool makes a best-effort cleanup of what is still visible.",
  },
  {
    q: "Can it reveal hidden or censored content behind the filter?",
    a: "No. It does not uncover masked, painted-over, or NSFW-obscured detail. It only adjusts visible pixels.",
  },
  {
    q: "Do you upload my media?",
    a: "No for the default on-device remover. Processing stays in your browser.",
  },
  {
    q: "Is Matcha Filter affiliated with TikTok?",
    a: "No. Independent tool. Not endorsed by TikTok.",
  },
];

export default function RemovePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Matcha Filter Remover",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        url: "https://matchafilter.online/remove",
        description:
          "Free on-device matcha filter remover for photos and short videos. Reduces green cast and grain without uploading media.",
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
      {
        "@type": "HowTo",
        name: "How to use Matcha Filter Remover",
        description: "Reduce a viral matcha green filter from a photo or short video on-device.",
        step: [
          {
            "@type": "HowToStep",
            name: "Open Matcha Filter Remover",
            text: "Go to https://matchafilter.online/remove",
          },
          {
            "@type": "HowToStep",
            name: "Upload your photo or short video",
            text: "Choose a JPG, PNG, WebP, MP4, or WebM file you have rights to edit.",
          },
          {
            "@type": "HowToStep",
            name: "Adjust if needed",
            text: "Tune Color neutralize, Noise reduction, and Detail restore, then compare With filter vs Filter removed.",
          },
          {
            "@type": "HowToStep",
            name: "Download the cleaned result",
            text: "Export in the original format when your browser supports it.",
          },
        ],
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
        mode="remove"
        title="Matcha Filter Remover"
        subtitle="Upload a matcha-green clip or screenshot. We reduce the tint and grain so the frame is easier to read — best effort, on your device."
      />

      <section className="section answer-box">
        <h2>Quick answer</h2>
        <p>
          <strong>Matcha Filter Remover</strong> is a free, on-device tool that reduces the
          viral matcha green cast, grain, and harsh contrast on a saved photo or short
          video. It cannot perfectly restore the original file or reveal hidden/censored
          content.
        </p>
      </section>

      <section className="section">
        <h2>How the remover works</h2>
        <p>
          Upload a photo or short video. We analyze cast, tone range, and noise, then
          auto-set Color neutralize, Noise reduction, and Detail restore — with adaptive
          white-balance under the hood. Everything stays in this tab.
        </p>
      </section>

      <section className="section">
        <h2>What it can and cannot fix</h2>
        <p>
          Green or yellow cast and mild grain are often reducible. Warped geometry and
          painted-over detail are not recoverable from a flat export.
        </p>
      </section>

      <section className="section">
        <h2>Free, private, no account</h2>
        <p>
          The default remover runs in your browser. No signup is required, and your media
          is not uploaded to our servers for this tool. See also{" "}
          <Link href="/guide/how-to-remove-matcha-filter">how to remove a matcha filter</Link>{" "}
          and <Link href="/apply">apply matcha filter</Link>.
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
