/** Client helpers for voluntary compressed sample sharing. */

export type SampleShareMeta = {
  mode: "remove" | "apply";
  mediaType: "image" | "video";
  width: number;
  height: number;
};

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

export async function canvasToSampleBlob(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Blob> {
  const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const w = Math.max(1, Math.round(sourceWidth * scale));
  const h = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("encode_failed");
  if (blob.size > 900 * 1024) {
    const tighter = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.65),
    );
    if (!tighter) throw new Error("encode_failed");
    return tighter;
  }
  return blob;
}

export async function uploadVoluntarySample(
  blob: Blob,
  meta: SampleShareMeta,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const body = new FormData();
  body.set("consent", "yes");
  body.set("mode", meta.mode);
  body.set("media_type", meta.mediaType);
  body.set("width", String(Math.round(meta.width)));
  body.set("height", String(Math.round(meta.height)));
  body.set("sample", blob, "sample.jpg");

  const res = await fetch("/api/sample", {
    method: "POST",
    body,
  });
  let data: { ok?: boolean; id?: string; error?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    /* ignore */
  }
  if (!res.ok || !data.ok || !data.id) {
    return { ok: false, error: data.error || `http_${res.status}` };
  }
  return { ok: true, id: data.id };
}
