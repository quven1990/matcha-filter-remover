import type { Metadata } from "next";
import Link from "next/link";
import { AdsterraLeaderboard } from "@/components/AdsterraBanner";

export const metadata: Metadata = {
  title: "How to Clean or Remove a Matcha Filter (Free)",
  description:
    "How to clean a matcha filter from a photo or video — free online, no signup. Step-by-step with Matcha Filter Remover. Honest about limits.",
  alternates: { canonical: "/guide/how-to-remove-matcha-filter" },
};

export default function HowToRemovePage() {
  const howToJson = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to clean or remove a matcha filter from a photo or video",
    description:
      "Free online steps to clean a matcha filter with Matcha Filter Remover. Best-effort, on-device cleanup.",
    totalTime: "PT2M",
    tool: {
      "@type": "HowToTool",
      name: "Matcha Filter Remover",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Save media you can edit",
        text: "Save or screenshot a clip you have rights to edit.",
        url: "https://matchafilter.online/guide/how-to-remove-matcha-filter",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Open the remover",
        text: "Go to Matcha Filter Remover at https://matchafilter.online/remove",
        url: "https://matchafilter.online/remove",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Upload and process",
        text: "Upload the file and run the on-device remove effect. Adjust neutralize, denoise, and detail if needed.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Compare and download",
        text: "Use the compare split to check With filter vs Filter removed, then download the result.",
      },
    ],
  };

  return (
    <article className="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJson) }}
      />
      <p className="eyebrow">Guide</p>
      <h1>How to Clean or Remove a Matcha Filter</h1>

      <div className="answer-box prose-answer">
        <h2>Short answer</h2>
        <p>
          To clean a matcha filter for free: open{" "}
          <Link href="/remove">Matcha Filter Remover</Link>, upload a photo or short video, run
          Remove effect, compare sides, and download. No signup. Expect a clearer green cast — not
          a perfect original rebuild.
        </p>
      </div>

      <h2>Step-by-step</h2>
      <h3>1. Save media you can edit</h3>
      <p>Save or screenshot a clip you have rights to edit.</p>
      <h3>2. Open Matcha Filter Remover</h3>
      <p>
        Go to <Link href="/remove">Matcha Filter Remover</Link>.
      </p>
      <h3>3. Upload and process</h3>
      <p>
        Upload the file and run the on-device remove effect. Adjust Color neutralize, Noise
        reduction, and Detail restore if needed.
      </p>
      <h3>4. Compare and download</h3>
      <p>
        Use the compare split to check With filter vs Filter removed, then download the
        result.
      </p>
      <h3>5. Optional: AI Restore for hard melts</h3>
      <p>
        If the free sliders still look like liquid metal, use AI Restore on the still (18+).
        Videos: AI restores the <strong>current frame only</strong>. Card checkout may be paused;
        the free remover still works. See{" "}
        <Link href="/remove">Matcha Filter Remover</Link>.
      </p>

      <h2>Honest limits</h2>
      <h3>What you should expect</h3>
      <p>
        Free Remove: cleaner green cast and less grain. AI Restore: stronger still for heavy
        melts — still not a perfect original rebuild.
      </p>
      <h3>What cannot be recovered</h3>
      <p>
        Hidden or censored detail cannot be recovered. Background:{" "}
        <Link href="/guide/what-is-matcha-filter">what the matcha filter is</Link>.
      </p>

      <AdsterraLeaderboard />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/remove" className="btn-primary">
          Open Matcha Filter Remover
        </Link>
      </p>
    </article>
  );
}
