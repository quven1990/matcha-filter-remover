import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraBanner } from "@/components/AdsterraBanner";
import { MediaTool } from "@/components/MediaTool";
import { PAYMENTS_ENABLED } from "@/lib/billing-packs";

export const metadata: Metadata = {
  title: "Free Matcha Filter Remover — Clean Filter & Video",
  description:
    "Free matcha filter remover for photos & short videos — no signup. Clean the matcha effect on-device; optional AI Restore for hard melts (18+).",
  alternates: { canonical: "/remove" },
  openGraph: {
    title: "Free Matcha Filter Remover — Clean Filter & Video",
    description:
      "Free matcha filter remover for photos and short videos. Clean the matcha effect on-device; optional AI for hard melts (18+).",
    url: "https://matchafilter.online/remove",
  },
};

const aiCheckoutNote = PAYMENTS_ENABLED
  ? "Use Restore this frame from the tool, confirm you are 18+, then run AI Restore on this page (1 credit per still / current video frame)."
  : "AI Restore checkout is temporarily paused while live billing is enabled. The free on-device remover still works.";

const faq = [
  {
    q: "What is a matcha filter remover?",
    a: "A free online tool to remove or clean a viral matcha filter from a saved photo, screenshot, or short video. The default remover reduces green/olive tint, grain, and harsh contrast in your browser. Optional AI Restore is for heavy liquid-metal melts the free tool cannot undo.",
  },
  {
    q: "Is matcha filter removal the same as a matcha effect remover?",
    a: "Yes — people also search remove matcha filter, matcha filter removal, matcha effect remover, and clean filter matcha. They all mean this job: reduce the baked-in green effect on a file you can edit.",
  },
  {
    q: "Is the matcha filter remover free?",
    a: "Yes. The default on-device remover is free — no signup, no card. Optional AI Restore uses credits when checkout is open, and only for hard melts.",
  },
  {
    q: "When should I use free Remove vs AI Restore?",
    a: "Use free Remove for a green/olive color cast, grain, and harsh contrast. Use AI Restore when the filter melted skin into liquid metal, moss, or heavy emboss and the free sliders still look fake. AI is best-effort, 18+, and does not uncover censored detail. " +
      aiCheckoutNote,
  },
  {
    q: "Does AI Restore work on video?",
    a: "Free Remove can process a short video on-device. AI Restore only restores the current frame (a still), not the whole clip.",
  },
  {
    q: "How do I clean a matcha filter?",
    a: "Upload the photo or clip and run Remove effect first. That is how you clean or clear a light matcha filter online (same job as clean filter matcha). If the melt is still extreme, try AI Restore when available. It will not uncover censored or hidden detail.",
  },
  {
    q: "How do I remove a matcha filter from a video?",
    a: "Upload a short MP4, WebM, or MOV, run free Remove effect on-device, scrub frames to check, then download. That covers searches like matcha filter remover video. AI Restore (when open) only fixes the current frame as a still — not the whole clip. See the video guide below for details.",
  },
  {
    q: "How do I remove a matcha filter on TikTok?",
    a: "TikTok does not export the original unfiltered file once an effect is baked in. Save a screenshot or download the clip you have rights to edit, open this remover, upload, and run Remove effect. For TikTok-specific steps, see the TikTok matcha filter guide below. Best-effort cleanup, not a perfect original.",
  },
  {
    q: "Can I remove a matcha filter from a TikTok screenshot?",
    a: "Yes. Save a screenshot or photo, upload it here, run Remove effect, and compare sides. For a hard melt, AI Restore (when checkout is open) can try a stronger still restore. Results are best-effort — not a perfect original file.",
  },
  {
    q: "Can this restore the exact original TikTok file?",
    a: "No. Once an effect is baked into an export, missing detail cannot be recovered perfectly. Free Remove is color/texture cleanup. AI Restore is a best-effort reconstruction, not the original pixels.",
  },
  {
    q: "Can it reveal hidden or censored content behind the filter?",
    a: "No. Neither the free remover nor AI Restore uncovers masked, painted-over, or NSFW-obscured detail. Do not bring NSFW or illegal media into the tools. AI Restore is 18+ and blocks prohibited inputs.",
  },
  {
    q: "Do you upload my media?",
    a: "No for the default on-device remover — it stays in your browser. If you run AI Restore, the selected still is sent to our edge function and an AI provider for that job only. See Privacy.",
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
          "Free matcha filter remover for photos and short videos, plus optional AI Restore for heavy melts. No signup for the free tool.",
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
        description:
          "Free online matcha filter removal for photos and short videos, with optional AI Restore for heavy liquid-metal melts.",
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
            name: "Run free Remove effect",
            text: "Tune Color neutralize, Noise reduction, and Detail restore, then compare With filter vs Filter removed.",
          },
          {
            "@type": "HowToStep",
            name: "Optional: AI Restore for hard melts",
            text: "If the free tool still looks melted, run AI Restore on the still (18+). Video AI restores the current frame only.",
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
        subtitle="Free on-device cleanup for green cast and grain. Optional AI Restore for heavy liquid-metal melts (18+). Works on TikTok screenshots and short clips."
      />

      <section className="section answer-box">
        <h2>Quick answer</h2>
        <p>
          <strong>Matcha Filter Remover</strong> is a <strong>free</strong> online tool to{" "}
          <strong>clean a matcha filter</strong> (also searched as remove matcha filter, matcha
          effect remover, or clean filter matcha). No signup. Start with the on-device remover for
          green/olive cast and grain. If the look is a heavy liquid-metal melt, optional{" "}
          <strong>AI Restore</strong> can try a stronger still (18+). Neither path restores the
          exact original file or reveals hidden/censored content.
        </p>
      </section>

      <section className="section">
        <h2>Clean a matcha filter (free, no signup)</h2>
        <p>
          If you searched <em>clean filter matcha</em>, <em>clear matcha filter</em>, or{" "}
          <em>matcha filter remover free</em>, this is the page: run the free on-device remover,
          compare With filter vs Filter removed, then download. No account.
        </p>
      </section>

      <section className="section">
        <h2>Remove matcha filter from a photo or short video</h2>
        <p>
          Upload a photo or short clip, run <strong>Remove effect</strong>, scrub or drag the
          compare split, then download. Free Remove processes the video on-device — that is the path
          for <em>matcha filter remover video</em> / <em>remove matcha filter video</em>. Optional
          AI Restore only enhances the current frame as a still when the melt is too heavy for
          sliders. For video-specific steps, read{" "}
          <Link href="/guide/remove-matcha-filter-from-video">
            how to remove a matcha filter from video
          </Link>
          .
        </p>
      </section>

      <section className="section">
        <h2>Viral and TikTok matcha filter guides</h2>
        <p>
          If you found this page through the viral matcha filter trend, start with the{" "}
          <Link href="/guide/viral-matcha-filter-trend">viral matcha filter trend guide</Link>.
          For TikTok screenshots or downloaded clips, use the{" "}
          <Link href="/guide/how-to-remove-matcha-filter-on-tiktok">
            TikTok matcha filter removal guide
          </Link>
          . For video exports, use the{" "}
          <Link href="/guide/remove-matcha-filter-from-video">video matcha filter remover guide</Link>
          .
        </p>
      </section>

      <section className="section">
        <h2>How the remover works</h2>
        <h3>Upload a photo or short video</h3>
        <p>
          Choose a JPG, PNG, WebP, MP4, WebM, or MOV file you have rights to edit. Processing
          starts in this browser tab.
        </p>
        <h3>Analyze cast, tone, and noise</h3>
        <p>
          We analyze green cast, tone range, and noise, then auto-set Color neutralize, Noise
          reduction, and Detail restore — with adaptive white-balance under the hood.
        </p>
        <h3>Compare and download</h3>
        <p>
          Drag the split to check With filter vs Filter removed, then export in the original
          format when your browser supports it. Everything stays on-device for the default tool.
        </p>
      </section>

      <section className="section">
        <h2>Free Remove vs AI Restore</h2>
        <h3>Free on-device Remove</h3>
        <p>
          Best for a green/olive color grade, extra grain, and harsh contrast. Runs in your
          browser — no account, no upload. Short videos are processed locally.
        </p>
        <h3>Optional AI Restore</h3>
        <p>
          Best when matcha has melted into liquid metal, mossy texture, or heavy emboss and the
          free sliders still look fake. AI Restore uses 1 credit per still, is 18+, and for video
          restores <strong>the current frame only</strong>. It is a best-effort reconstruction, not
          the original file, and will not unblur or uncover censored areas.{" "}
          {PAYMENTS_ENABLED ? (
            <>
              Credits: <Link href="/pricing#packs">Pricing</Link>.
            </>
          ) : (
            <>
              Card checkout is temporarily paused; the free remover still works. See{" "}
              <Link href="/pricing#packs">Pricing</Link> when live billing reopens.
            </>
          )}
        </p>
      </section>

      <section className="section">
        <h2>What it can and cannot fix</h2>
        <h3>What the free tool can reduce</h3>
        <p>
          Green or yellow cast, mild film grain, and harsh contrast are often reducible on a
          finished export.
        </p>
        <h3>What AI Restore can try</h3>
        <p>
          Heavier liquid-metal / embossed matcha stills that the free tool cannot undo — same
          person, pose, and framing, more natural color and texture. Still best-effort.
        </p>
        <h3>What neither can restore</h3>
        <p>
          Painted-over or censored regions, missing original pixels, and NSFW-obscured detail
          cannot be recovered. Do not bring NSFW, adult, or illegal media into these tools.
        </p>
      </section>

      <section className="section">
        <h2>Free, private, no account</h2>
        <h3>On-device by default</h3>
        <p>
          This matcha filter remover is free to use online with no signup. The default remover
          runs in your browser. Media stays on-device unless you explicitly opt in to share a
          compressed sample.
        </p>
        <h3>Related guides</h3>
        <p>
          See also{" "}
          <Link href="/guide/how-to-remove-matcha-filter">how to remove a matcha filter</Link>,{" "}
          <Link href="/guide/how-to-remove-matcha-filter-on-tiktok">
            how to remove the matcha filter on TikTok
          </Link>
          ,{" "}
          <Link href="/guide/remove-matcha-filter-from-video">
            remove matcha filter from video
          </Link>
          ,{" "}
          <Link href="/guide/viral-matcha-filter-trend">viral matcha filter trend</Link>
          ,{" "}
          <Link href="/apply">apply matcha filter</Link>, and{" "}
          <Link href="/pricing#packs">AI Restore credits</Link>.
        </p>
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
