import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraLeaderboard } from "@/components/AdsterraBanner";

export const metadata: Metadata = {
  title: "How to Remove the Matcha Filter on TikTok (Free)",
  description:
    "How to remove a matcha filter from a TikTok video or screenshot you can edit. Free online cleanup with Matcha Filter Remover, plus honest limits.",
  alternates: { canonical: "/guide/how-to-remove-matcha-filter-on-tiktok" },
};

export default function TikTokRemoveGuidePage() {
  const howToJson = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to remove the matcha filter on TikTok",
    description:
      "Free steps to clean a baked-in matcha filter from a TikTok video download or screenshot you have rights to edit.",
    totalTime: "PT2M",
    tool: {
      "@type": "HowToTool",
      name: "Matcha Filter Remover",
      url: "https://matchafilter.online/remove",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Save a file you can edit",
        text: "Download your own TikTok clip or save a screenshot/photo you have rights to edit.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Open Matcha Filter Remover",
        text: "Go to https://matchafilter.online/remove in your browser.",
        url: "https://matchafilter.online/remove",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Upload and run Remove effect",
        text: "Upload the file, then run the free on-device Remove effect to reduce green cast, haze, and grain.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Compare and download",
        text: "Use the compare split to check the cleanup, then download the result.",
      },
    ],
  };

  const faq = [
    {
      q: "Can TikTok give me the original file without the matcha filter?",
      a: "Usually no. Once a filter is baked into an exported video or screenshot, the exact original pixels are not available from that saved file.",
    },
    {
      q: "Can Matcha Filter Remover clean a TikTok screenshot?",
      a: "Yes. Upload the screenshot, run Remove effect, compare sides, and download. It is best-effort cleanup, not a perfect original rebuild.",
    },
    {
      q: "Can it remove the matcha filter from a TikTok video?",
      a: "The free remover can process a short downloaded clip on-device. Optional AI Restore only works on the current frame as a still, not the whole video.",
    },
    {
      q: "Can it reveal hidden or censored content?",
      a: "No. It reduces color and texture effects only. It cannot reveal hidden, censored, blurred, or painted-over detail.",
    },
    {
      q: "Is Matcha Filter affiliated with TikTok?",
      a: "No. Matcha Filter is an independent browser tool and is not endorsed by or affiliated with TikTok.",
    },
  ];

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <article className="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
      <p className="eyebrow">TikTok guide</p>
      <h1>How to Remove the Matcha Filter on TikTok</h1>

      <div className="answer-box prose-answer">
        <h2>Short answer</h2>
        <p>
          To remove a matcha filter from TikTok, save a clip or screenshot you have rights to
          edit, open <Link href="/remove">Matcha Filter Remover</Link>, upload it, run the free
          Remove effect, compare sides, and download. It can clean green cast, haze, and grain,
          but it cannot restore the exact original TikTok file.
        </p>
      </div>

      <h2>Step-by-step</h2>
      <h3>1. Save the TikTok video or screenshot</h3>
      <p>
        Use a downloaded clip, screenshot, or saved photo you have rights to edit. If the matcha
        look is already baked into the export, the cleanup will be best-effort.
      </p>
      <h3>2. Open the remover</h3>
      <p>
        Go to <Link href="/remove">Matcha Filter Remover</Link>. The default Remove tool runs in
        your browser, so the free cleanup does not require an account.
      </p>
      <h3>3. Upload and clean the matcha effect</h3>
      <p>
        Upload a JPG, PNG, WebP, MP4, WebM, or MOV. Run Remove effect, then adjust Color
        neutralize, Noise reduction, and Detail restore if the green cast is still strong.
      </p>
      <h3>4. Compare and download</h3>
      <p>
        Drag the compare split to check “with filter” vs “filter removed”. If it looks cleaner,
        download the result. For short videos, export depends on what your browser supports.
      </p>

      <h2>What works and what does not</h2>
      <h3>Good fit</h3>
      <p>
        Green/olive cast, haze, grain, and harsh contrast on screenshots, photos, or short clips.
      </p>
      <h3>Hard cases</h3>
      <p>
        Heavy liquid-metal melts may need optional AI Restore on a still frame. AI Restore is
        best-effort, 18+, and uses credits.
      </p>
      <h3>Not possible</h3>
      <p>
        No remover can reveal censored, blurred, painted-over, or missing original detail. This
        tool is for color and texture cleanup only.
      </p>

      <h2>Independent tool</h2>
      <p>
        Matcha Filter is not affiliated with TikTok. If you want background on the trend, read{" "}
        <Link href="/guide/what-is-matcha-filter">what the viral matcha filter is</Link>. For a
        broader cleanup walkthrough, see{" "}
        <Link href="/guide/how-to-remove-matcha-filter">
          how to clean or remove a matcha filter
        </Link>
        .
      </p>

      <AdsterraLeaderboard />

      <h2>FAQ</h2>
      {faq.map((item) => (
        <details key={item.q}>
          <summary>
            <h3>{item.q}</h3>
          </summary>
          <p>{item.a}</p>
        </details>
      ))}

      <p style={{ marginTop: "2rem" }}>
        <Link href="/remove" className="btn-primary">
          Open Matcha Filter Remover
        </Link>
      </p>
    </article>
  );
}
