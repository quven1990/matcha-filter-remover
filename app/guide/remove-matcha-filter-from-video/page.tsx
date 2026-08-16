import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraLeaderboard } from "@/components/AdsterraBanner";

export const metadata: Metadata = {
  title: "Remove Matcha Filter From Video (Free)",
  description:
    "How to remove a matcha filter from a short video online. Free browser cleanup for green cast and grain, plus honest limits for AI Restore.",
  alternates: { canonical: "/guide/remove-matcha-filter-from-video" },
  openGraph: {
    title: "Remove Matcha Filter From Video (Free)",
    description:
      "Free browser cleanup for matcha filter videos, with honest limits for AI Restore and baked-in effects.",
    url: "https://matchafilter.online/guide/remove-matcha-filter-from-video",
  },
};

export default function RemoveMatchaFilterFromVideoPage() {
  const howToJson = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to remove a matcha filter from video",
    description:
      "Free browser steps to clean a matcha filter from a short video with Matcha Filter Remover.",
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
        name: "Save a short video you can edit",
        text: "Use an MP4, WebM, or MOV clip you own or have rights to edit.",
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
        text: "Upload the clip, run the free Remove effect, and adjust neutralize, denoise, and detail controls.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Preview and export",
        text: "Scrub the video, compare frames, and download when your browser supports export.",
      },
    ],
  };

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can Matcha Filter Remover process video?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The free remover can process short MP4, WebM, or MOV clips in the browser.",
        },
      },
      {
        "@type": "Question",
        name: "Does AI Restore fix a whole video?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Optional AI Restore works on the current frame as a still image. It does not restore every video frame.",
        },
      },
      {
        "@type": "Question",
        name: "Can video cleanup recover the exact original file?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Once the matcha effect is baked into a video export, cleanup is best-effort and cannot recreate exact original pixels.",
        },
      },
    ],
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
      <p className="eyebrow">Video guide</p>
      <h1>Remove Matcha Filter From Video</h1>

      <div className="answer-box prose-answer">
        <h2>Short answer</h2>
        <p>
          To remove a matcha filter from video, open{" "}
          <Link href="/remove">Matcha Filter Remover</Link>, upload a short MP4, WebM, or MOV,
          run the free Remove effect, compare frames, and download. The free tool cleans green
          cast, haze, grain, and contrast in the browser.
        </p>
      </div>

      <h2>Step-by-step</h2>
      <h3>1. Use a clip you can edit</h3>
      <p>
        Start with a short video file you own or have permission to edit. If it came from
        TikTok, the exact original without the effect is usually not inside the saved export.
      </p>
      <h3>2. Upload to the remover</h3>
      <p>
        Go to <Link href="/remove">Matcha Filter Remover</Link> and upload MP4, WebM, or MOV.
        The free cleanup runs on-device for privacy.
      </p>
      <h3>3. Clean the green effect</h3>
      <p>
        Run Remove effect, then tune Color neutralize, Noise reduction, and Detail restore if a
        frame still looks too green or grainy.
      </p>
      <h3>4. Compare and export</h3>
      <p>
        Scrub the clip and use the compare split to inspect frames before downloading. Export
        support depends on browser video capabilities.
      </p>

      <h2>Free video cleanup vs AI Restore</h2>
      <h3>Use free Remove for the whole short clip</h3>
      <p>
        Free Remove is the right path for video-level color cleanup: green cast, haze, grain,
        and harsh contrast.
      </p>
      <h3>Use AI Restore only for one hard frame</h3>
      <p>
        Optional AI Restore is for a still frame that looks melted or embossed after free
        cleanup. It does not process an entire video, and it cannot uncover hidden or censored
        content.
      </p>

      <h2>Related TikTok searches</h2>
      <p>
        For TikTok-specific wording and limits, see{" "}
        <Link href="/guide/how-to-remove-matcha-filter-on-tiktok">
          how to remove the matcha filter on TikTok
        </Link>
        . For trend context, read the{" "}
        <Link href="/guide/viral-matcha-filter-trend">viral matcha filter trend guide</Link>.
      </p>

      <AdsterraLeaderboard />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/remove" className="btn-primary">
          Open Video Remover
        </Link>
      </p>
    </article>
  );
}
