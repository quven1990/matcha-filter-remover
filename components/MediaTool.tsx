"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  durationBucket,
  elapsedBucket,
  sizeBucket,
  track,
  valueBucket,
} from "@/lib/analytics";
import { canvasToSampleBlob, uploadVoluntarySample } from "@/lib/sample-share";
import {
  MAX_IMAGE_MB,
  MAX_VIDEO_SECONDS,
  MatchaGL,
  PIPELINE_REV,
  analyzeFrame,
  mergeAnalyzeResults,
  type AnalyzeResult,
  type ProcessMode,
} from "@/lib/webgl-matcha";

type MediaToolProps = {
  mode: ProcessMode;
  title: string;
  subtitle: string;
};

type Kind = "image" | "video" | null;

type UploadIssue = {
  title: string;
  detail: string;
  tone?: "error" | "info";
  reason?: string;
};

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1);
}

function classifyUploadIssue(file: File): UploadIssue | null {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";

  const imageExt = [".jpg", ".jpeg", ".png", ".webp"];
  const videoExt = [".mp4", ".webm", ".mov"];
  const isImage =
    type.startsWith("image/") || imageExt.includes(ext);
  const isVideo =
    type.startsWith("video/") || videoExt.includes(ext);

  if (ext === ".heic" || ext === ".heif" || type.includes("heic") || type.includes("heif")) {
    return {
      title: "HEIC / HEIF is not supported",
      detail: "Export or convert to JPG, PNG, or WebP first, then try again.",
      reason: "heic",
    };
  }
  if (ext === ".gif" || type === "image/gif") {
    return {
      title: "GIF is not supported",
      detail: "Use a still JPG/PNG/WebP, or an MP4/WebM clip under 30 seconds.",
      reason: "gif",
    };
  }
  if (ext === ".avi" || ext === ".mkv" || ext === ".flv" || type.includes("avi") || type.includes("matroska")) {
    return {
      title: "This video format is not supported",
      detail: "Re-export as MP4 or WebM (under 30 seconds, max 20MB) for browser processing.",
      reason: "video_format",
    };
  }
  if (!isImage && !isVideo) {
    return {
      title: "Unsupported file type",
      detail: `“${file.name}” is not a usable photo/video. Accepted: JPG, PNG, WebP, MP4, WebM, MOV.`,
      reason: "unsupported_type",
    };
  }
  if (file.size <= 0) {
    return {
      title: "Empty file",
      detail: "That file has no data. Pick another photo or video and try again.",
      reason: "empty",
    };
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return {
      title: `File is too large (${formatMb(file.size)}MB)`,
      detail: `Keep uploads under ${MAX_IMAGE_MB}MB. Compress or trim the clip, then upload again.`,
      reason: "too_large",
    };
  }
  return null;
}

function fileExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function baseFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "result";
}

function pickImageExport(ext: string): { mime: string; ext: string; quality?: number } {
  if (ext === "jpg" || ext === "jpeg") {
    return { mime: "image/jpeg", ext: "jpg", quality: 0.92 };
  }
  if (ext === "webp") {
    try {
      const probe = document.createElement("canvas");
      probe.width = 1;
      probe.height = 1;
      if (probe.toDataURL("image/webp").startsWith("data:image/webp")) {
        return { mime: "image/webp", ext: "webp", quality: 0.92 };
      }
    } catch {
      /* fall through */
    }
    return { mime: "image/jpeg", ext: "jpg", quality: 0.92 };
  }
  return { mime: "image/png", ext: "png" };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const target = Math.min(Math.max(0, time), Math.max(0, duration > 0 ? duration - 0.04 : 0));
    if (Math.abs(video.currentTime - target) < 0.02) {
      resolve();
      return;
    }
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("seek failed"));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    try {
      video.currentTime = target;
    } catch {
      cleanup();
      reject(new Error("seek failed"));
    }
  });
}

type VideoExportPick = { mime: string; ext: "mp4" | "webm" };

/** Prefer MP4 (mobile/Photos-friendly); fall back to WebM. Include AAC/Opus when audio is present. */
function pickVideoExport(hasAudio: boolean): VideoExportPick | null {
  if (typeof MediaRecorder === "undefined") return null;
  const mp4 = hasAudio
    ? [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=avc1.4D401E,mp4a.40.2",
        "video/mp4;codecs=h264,aac",
        "video/mp4;codecs=avc1.42E01E",
        "video/mp4",
      ]
    : ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=h264", "video/mp4"];
  const webm = hasAudio
    ? [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ]
    : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

  for (const mime of [...mp4, ...webm]) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return { mime, ext: mime.includes("mp4") ? "mp4" : "webm" };
    }
  }
  return null;
}

function mediaElementCaptureStream(video: HTMLVideoElement): MediaStream | null {
  const el = video as HTMLVideoElement & {
    captureStream?: (frameRate?: number) => MediaStream;
    mozCaptureStream?: (frameRate?: number) => MediaStream;
  };
  try {
    if (typeof el.captureStream === "function") return el.captureStream();
    if (typeof el.mozCaptureStream === "function") return el.mozCaptureStream();
  } catch {
    return null;
  }
  return null;
}

/** Canvas video + source audio tracks when the browser allows it. */
function buildExportStream(canvas: HTMLCanvasElement, video: HTMLVideoElement, fps = 30) {
  const canvasStream = canvas.captureStream(fps);
  const combined = new MediaStream(canvasStream.getVideoTracks());
  let hasAudio = false;
  const mediaStream = mediaElementCaptureStream(video);
  if (mediaStream) {
    for (const track of mediaStream.getAudioTracks()) {
      if (track.readyState === "ended") continue;
      combined.addTrack(track);
      hasAudio = true;
    }
  }
  return { stream: combined, hasAudio, mediaStream };
}

type SaveSheetState = {
  kind: "image" | "video";
  url: string;
  fileName: string;
  mime: string;
  blob: Blob;
  canShare: boolean;
  ext: string;
};

function prefersMobileSave() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches;
}

function canShareFile(file: File) {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode image"));
      },
      mime,
      quality,
    );
  });
}

export function MediaTool({ mode, title, subtitle }: MediaToolProps) {
  const isRemove = mode === "remove";
  const [kind, setKind] = useState<Kind>(null);
  const [fileName, setFileName] = useState("");
  const [sourceExt, setSourceExt] = useState("");
  const [strength, setStrength] = useState(82);
  const [liquid, setLiquid] = useState(70);
  const [grain, setGrain] = useState(27);
  const [neutralize, setNeutralize] = useState(82);
  const [denoise, setDenoise] = useState(55);
  const [detail, setDetail] = useState(48);
  const [compare, setCompare] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<UploadIssue | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ready, setReady] = useState(false);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [peekOriginal, setPeekOriginal] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [analysis, setAnalysis] = useState<Pick<AnalyzeResult, "balance" | "toneRange" | "analysisMix">>({
    balance: [1.08, 0.86, 1.12],
    toneRange: [0, 1],
    analysisMix: 0.72,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const compareWrapRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const glRef = useRef<MatchaGL | null>(null);
  const pipelineRevRef = useRef(PIPELINE_REV);
  const startTimeRef = useRef(performance.now());
  const uploadReadyAtRef = useRef<number | null>(null);
  const compareSeenRef = useRef(new Set<string>());
  const paramTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingCompareRef = useRef(false);
  const [draggingCompare, setDraggingCompare] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusProgress, setStatusProgress] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [saveSheet, setSaveSheet] = useState<SaveSheetState | null>(null);
  const [mobileSaveUi, setMobileSaveUi] = useState(false);
  const [autoTuned, setAutoTuned] = useState(false);
  const [shareConsent, setShareConsent] = useState(true);
  const [shareState, setShareState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharePromptHidden, setSharePromptHidden] = useState(false);
  const [hardCase, setHardCase] = useState(false);
  const shareRevivedRef = useRef(false);
  const paramsRef = useRef({
    strength,
    liquid,
    grain,
    neutralize,
    denoise,
    detail,
    analysis,
    isRemove,
    kind: kind as Kind,
  });

  const trackTool = useCallback(
    (event: string, params?: Record<string, string | number | boolean | undefined | null>) => {
      track(event, { tool: mode, page_path: `/${mode}`, ...params });
    },
    [mode],
  );

  const runStage = useCallback(async (text: string, progress: number, ms: number) => {
    setStatusText(text);
    setStatusProgress(progress);
    await sleep(ms);
  }, []);

  const clearStatus = useCallback(() => {
    setStatusText("");
    setStatusProgress(0);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const sync = () => setMobileSaveUi(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const closeSaveSheet = useCallback(() => {
    setSaveSheet((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const noteCompare = useCallback(
    (action: string) => {
      if (compareSeenRef.current.has(action)) return;
      compareSeenRef.current.add(action);
      trackTool("tool_compare_interact", { action, media_type: kind || undefined });
    },
    [kind, trackTool],
  );

  const noteParam = useCallback(
    (param: string, value: number) => {
      if (paramTimerRef.current) clearTimeout(paramTimerRef.current);
      paramTimerRef.current = setTimeout(() => {
        trackTool("tool_param_change", {
          param,
          value_bucket: valueBucket(value),
          media_type: kind || undefined,
        });
      }, 400);
    },
    [kind, trackTool],
  );

  paramsRef.current = {
    strength,
    liquid,
    grain,
    neutralize,
    denoise,
    detail,
    analysis,
    isRemove,
    kind,
  };

  const accept =
    "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov";

  const ensureGL = useCallback(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return null;
    if (glRef.current && pipelineRevRef.current !== PIPELINE_REV) {
      glRef.current.dispose();
      glRef.current = null;
    }
    pipelineRevRef.current = PIPELINE_REV;
    if (!glRef.current) {
      try {
        glRef.current = new MatchaGL(canvas);
      } catch {
        setError({
          title: "WebGL2 is required",
          detail: "This browser cannot run the matcha effect. Try the latest Chrome, Edge, or Firefox.",
          reason: "webgl",
        });
        return null;
      }
    }
    return glRef.current;
  }, []);

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const reset = useCallback(() => {
    trackTool("tool_reset", { had_ready: ready, media_type: kind || undefined });
    stopLoop();
    clearObjectUrl();
    closeSaveSheet();
    setKind(null);
    setFileName("");
    setSourceExt("");
    setReady(false);
    setBusy(false);
    setError(null);
    setCompare(50);
    setPeekOriginal(false);
    setPreviewPaused(false);
    setVideoTime(0);
    setVideoDuration(0);
    setShowTip(false);
    setAutoTuned(false);
    setShareConsent(true);
    setShareState("idle");
    setShareError(null);
    setSharePromptHidden(false);
    setHardCase(false);
    shareRevivedRef.current = false;
    clearStatus();
    uploadReadyAtRef.current = null;
    compareSeenRef.current.clear();
    glRef.current?.resetTemporal();
    if (inputRef.current) inputRef.current.value = "";
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
  }, [clearStatus, closeSaveSheet, kind, ready, trackTool]);

  useEffect(() => {
    trackTool("tool_view");
  }, [trackTool]);

  useEffect(() => {
    if (shareState !== "done") return;
    const timer = window.setTimeout(() => setSharePromptHidden(true), 2800);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  useEffect(
    () => () => {
      stopLoop();
      clearObjectUrl();
      if (paramTimerRef.current) clearTimeout(paramTimerRef.current);
      glRef.current?.dispose();
      glRef.current = null;
    },
    [],
  );

  const drawFrame = useCallback(() => {
    const gl = ensureGL();
    const source = sourceCanvasRef.current;
    const video = videoRef.current;
    const p = paramsRef.current;
    if (!gl || !source) return false;

    if (p.kind === "video" && video) {
      const ctx = source.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      if (video.videoWidth > 0) {
        if (source.width !== video.videoWidth || source.height !== video.videoHeight) {
          source.width = video.videoWidth;
          source.height = video.videoHeight;
          gl.resetTemporal();
        }
        // Keep painting while playing; also hold last frame if briefly stalled
        if (!video.paused || video.currentTime > 0) {
          ctx.drawImage(video, 0, 0);
        }
      }
    }

    if (!source.width) return false;
    gl.upload(source, source.width, source.height);
    const t = (performance.now() - startTimeRef.current) / 1000;

    if (p.isRemove) {
      gl.renderRemove({
        neutralize: p.neutralize,
        denoise: p.denoise,
        detail: p.detail,
        temporal: p.kind === "video" ? 100 : 0,
        balance: p.analysis.balance,
        toneRange: p.analysis.toneRange,
        analysisMix: p.analysis.analysisMix,
      });
    } else {
      gl.renderApply({
        strength: p.strength,
        liquid: p.liquid,
        grain: p.grain,
        time: t,
      });
    }
    setReady(true);
    return true;
  }, [ensureGL]);

  const loop = useCallback(() => {
    drawFrame();
    const p = paramsRef.current;
    // Apply always animates; remove video uses temporal path each frame
    if (p.kind === "image" && p.isRemove) {
      rafRef.current = null;
      return;
    }
    if (p.kind) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [drawFrame]);

  const startLoop = useCallback(() => {
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    if (!kind) return;
    if (isRemove && kind === "image") {
      drawFrame();
      return;
    }
    startLoop();
    return () => stopLoop();
  }, [kind, isRemove, strength, liquid, grain, neutralize, denoise, detail, analysis, drawFrame, startLoop]);

  // Seamless preview loop: when the clip wraps, clear temporal history so end≠start doesn't smear.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || kind !== "video") return;
    let lastTime = 0;
    const onTimeUpdate = () => {
      if (video.currentTime + 0.35 < lastTime) {
        glRef.current?.resetTemporal();
      }
      lastTime = video.currentTime;
      setVideoTime(video.currentTime);
      if (Number.isFinite(video.duration)) setVideoDuration(video.duration);
    };
    const onEnded = () => {
      if (previewPaused) return;
      video.currentTime = 0;
      glRef.current?.resetTemporal();
      void video.play().catch(() => undefined);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [kind, previewPaused]);

  const togglePreviewPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || kind !== "video") return;
    noteCompare("play_pause");
    if (previewPaused) {
      setPreviewPaused(false);
      void video.play().catch(() => undefined);
      startLoop();
    } else {
      video.pause();
      setPreviewPaused(true);
      drawFrame();
    }
  }, [kind, previewPaused, drawFrame, startLoop, noteCompare]);

  const scrubVideo = (next: number) => {
    const video = videoRef.current;
    if (!video || kind !== "video") return;
    noteCompare("scrub");
    const t = Math.max(0, Math.min(video.duration || next, next));
    video.currentTime = t;
    setVideoTime(t);
    glRef.current?.resetTemporal();
    // Stay paused while scrubbing so the chosen frame is inspectable
    if (!video.paused) {
      video.pause();
      setPreviewPaused(true);
    }
    requestAnimationFrame(() => drawFrame());
  };

  const setCompareFromClientX = (clientX: number) => {
    const el = compareWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setCompare(Math.max(0, Math.min(100, pct)));
  };

  const onComparePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready || peekOriginal || busy) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, .preview-actions")) return;
    draggingCompareRef.current = true;
    setDraggingCompare(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setCompareFromClientX(e.clientX);
    noteCompare("split");
  };

  const onComparePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCompareRef.current) return;
    setCompareFromClientX(e.clientX);
  };

  const endCompareDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCompareRef.current) return;
    draggingCompareRef.current = false;
    setDraggingCompare(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const formatClock = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${Math.floor(sec / 60)}:${s}`;
  };

  const applyAnalyzeResult = useCallback(
    (result: AnalyzeResult, mediaKind: Kind) => {
      const nextAnalysis = {
        balance: result.balance,
        toneRange: result.toneRange,
        analysisMix: result.analysisMix,
      };
      setAnalysis(nextAnalysis);
      setNeutralize(result.neutralize);
      setDenoise(result.denoise);
      setDetail(result.detail);
      setAutoTuned(true);
      setHardCase(
        result.greenCast >= 0.11 || result.yellowCast >= 0.18 || result.neutralize >= 58,
      );
      paramsRef.current = {
        ...paramsRef.current,
        neutralize: result.neutralize,
        denoise: result.denoise,
        detail: result.detail,
        analysis: nextAnalysis,
        kind: mediaKind,
      };
      return result;
    },
    [],
  );

  const runAnalyze = useCallback(
    (source: HTMLCanvasElement, mediaKind: Kind = kind): AnalyzeResult | null => {
      const ctx = source.getContext("2d", { willReadFrequently: true });
      if (!ctx || !source.width) return null;
      return applyAnalyzeResult(analyzeFrame(ctx, source.width, source.height), mediaKind);
    },
    [applyAnalyzeResult, kind],
  );

  const analyzeRemoveVideo = useCallback(
    async (video: HTMLVideoElement, source: HTMLCanvasElement) => {
      const ctx = source.getContext("2d", { willReadFrequently: true });
      if (!ctx || !source.width) return null;
      const wasPaused = video.paused;
      video.pause();
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const sampleCount = duration >= 8 ? 5 : duration >= 3 ? 3 : 1;
      const samples: AnalyzeResult[] = [];
      for (let i = 0; i < sampleCount; i++) {
        const t = sampleCount === 1 ? Math.min(0.12, Math.max(0, duration * 0.1)) : (duration * (i + 0.5)) / sampleCount;
        try {
          await seekVideo(video, t);
        } catch {
          continue;
        }
        ctx.drawImage(video, 0, 0, source.width, source.height);
        samples.push(analyzeFrame(ctx, source.width, source.height));
        await runStage(
          `Auto-analyzing frame ${i + 1}/${sampleCount}…`,
          42 + Math.round(((i + 1) / sampleCount) * 18),
          180,
        );
      }
      if (!samples.length) {
        ctx.drawImage(video, 0, 0, source.width, source.height);
        return applyAnalyzeResult(analyzeFrame(ctx, source.width, source.height), "video");
      }
      const merged = applyAnalyzeResult(mergeAnalyzeResults(samples), "video");
      try {
        await seekVideo(video, 0);
      } catch {
        /* keep current */
      }
      if (!wasPaused) {
        await video.play().catch(() => undefined);
      }
      trackTool("tool_auto_analyze", {
        media_type: "video",
        sample_count: samples.length,
        neutralize: merged.neutralize,
        denoise: merged.denoise,
        detail: merged.detail,
      });
      return merged;
    },
    [applyAnalyzeResult, runStage, trackTool],
  );

  const reAnalyze = useCallback(async () => {
    if (!ready || busy || !isRemove) return;
    const source = sourceCanvasRef.current;
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      await runStage("Re-analyzing…", 35, 280);
      if (kind === "video") {
        const video = videoRef.current;
        if (!video) return;
        stopLoop();
        await analyzeRemoveVideo(video, source);
        setPreviewPaused(false);
        video.loop = true;
        await video.play().catch(() => undefined);
        startLoop();
      } else {
        const analyzed = runAnalyze(source, "image");
        if (analyzed) {
          trackTool("tool_auto_analyze", {
            media_type: "image",
            sample_count: 1,
            neutralize: analyzed.neutralize,
            denoise: analyzed.denoise,
            detail: analyzed.detail,
          });
        }
      }
      await runStage("Updated controls…", 90, 220);
    } finally {
      clearStatus();
      setBusy(false);
    }
  }, [
    analyzeRemoveVideo,
    busy,
    clearStatus,
    isRemove,
    kind,
    ready,
    runAnalyze,
    runStage,
    startLoop,
    trackTool,
  ]);

  const fail = (issue: UploadIssue, category: "reject" | "fail" = "fail") => {
    clearObjectUrl();
    setKind(null);
    setReady(false);
    setFileName("");
    setSourceExt("");
    setError(issue);
    setPreviewPaused(false);
    setVideoTime(0);
    setVideoDuration(0);
    setShowTip(false);
    setAutoTuned(false);
    clearStatus();
    uploadReadyAtRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    trackTool(category === "reject" ? "tool_upload_reject" : "tool_upload_fail", {
      reason: issue.reason || "unknown",
    });
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    setShowTip(false);
    setAutoTuned(false);
    setShareConsent(true);
    setShareState("idle");
    setShareError(null);
    setSharePromptHidden(false);
    setHardCase(false);
    shareRevivedRef.current = false;
    stopLoop();
    clearObjectUrl();
    setReady(false);
    setKind(null);
    startTimeRef.current = performance.now();
    uploadReadyAtRef.current = null;
    compareSeenRef.current.clear();
    glRef.current?.resetTemporal();

    try {
      if (!ensureGL()) {
        fail(
          {
            title: "WebGL2 is required",
            detail: "This browser cannot run the matcha effect. Try the latest Chrome, Edge, or Firefox.",
            reason: "webgl",
          },
          "fail",
        );
        return;
      }

      const early = classifyUploadIssue(file);
      if (early) {
        fail(early, "reject");
        return;
      }

      const type = (file.type || "").toLowerCase();
      const name = file.name.toLowerCase();
      const isVideo =
        type.startsWith("video/") ||
        name.endsWith(".mp4") ||
        name.endsWith(".webm") ||
        name.endsWith(".mov");
      const isImage =
        type.startsWith("image/") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp");

      await runStage("Reading file…", 16, 520);

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setFileName(file.name);
      setSourceExt(fileExtension(file.name));
      const source = sourceCanvasRef.current;
      if (!source) {
        fail({
          title: "Preview failed to start",
          detail: "Refresh the page and try uploading again.",
          reason: "preview",
        });
        return;
      }

      if (isImage) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () =>
            reject(
              Object.assign(new Error("decode"), {
                issue: {
                  title: "Could not read that image",
                  detail:
                    "The file may be damaged or in an unsupported encoding. Re-save as JPG or PNG and retry.",
                  reason: "decode",
                } satisfies UploadIssue,
              }),
            );
          img.src = url;
        });
        if (!img.width || !img.height) {
          fail({
            title: "Image has no usable dimensions",
            detail: "Pick another photo (JPG, PNG, or WebP) and try again.",
            reason: "decode",
          });
          return;
        }
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        source.width = Math.max(1, Math.round(img.width * scale));
        source.height = Math.max(1, Math.round(img.height * scale));
        const ctx = source.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          fail({
            title: "Canvas unavailable",
            detail: "Your browser blocked 2D canvas access. Try another browser or disable strict privacy blocking.",
            reason: "canvas",
          });
          return;
        }
        ctx.drawImage(img, 0, 0, source.width, source.height);
        await runStage(
          isRemove ? "Analyzing green cast…" : "Building matcha look…",
          42,
          620,
        );
        if (isRemove) {
          const analyzed = runAnalyze(source, "image");
          if (analyzed) {
            trackTool("tool_auto_analyze", {
              media_type: "image",
              sample_count: 1,
              neutralize: analyzed.neutralize,
              denoise: analyzed.denoise,
              detail: analyzed.detail,
            });
          }
        }
        await runStage(
          isRemove ? "Neutralizing & cleaning…" : "Adding liquid grain…",
          70,
          580,
        );
        await runStage("Preparing compare view…", 92, 480);
        setKind("image");
        setCompare(50);
        setPeekOriginal(false);
      } else if (isVideo) {
        const video = videoRef.current;
        if (!video) {
          fail({
            title: "Video player unavailable",
            detail: "Refresh the page and try again.",
            reason: "preview",
          });
          return;
        }
        await new Promise<void>((resolve, reject) => {
          const onMeta = () => {
            if (Number.isFinite(video.duration) && video.duration > MAX_VIDEO_SECONDS) {
              reject(
                Object.assign(new Error("duration"), {
                  issue: {
                    title: `Video is too long (${Math.ceil(video.duration)}s)`,
                    detail: `Trim to ${MAX_VIDEO_SECONDS} seconds or less for smooth on-device preview and export.`,
                    reason: "video_too_long",
                  } satisfies UploadIssue,
                }),
              );
              return;
            }
            if (!video.videoWidth || !video.videoHeight) {
              reject(
                Object.assign(new Error("dims"), {
                  issue: {
                    title: "Could not decode video frames",
                    detail:
                      "This codec may not play in your browser. Re-export as H.264 MP4 or VP9 WebM and retry.",
                    reason: "decode",
                  } satisfies UploadIssue,
                }),
              );
              return;
            }
            resolve();
          };
          video.addEventListener("loadedmetadata", onMeta, { once: true });
          video.addEventListener(
            "error",
            () =>
              reject(
                Object.assign(new Error("video"), {
                  issue: {
                    title: "Could not read that video",
                    detail:
                      "File may be damaged or use an unsupported codec. Try MP4 (H.264) or WebM under 30s / 20MB.",
                    reason: "decode",
                  } satisfies UploadIssue,
                }),
              ),
            { once: true },
          );
          video.src = url;
          video.load();
        });
        source.width = video.videoWidth || 1280;
        source.height = video.videoHeight || 720;
        const ctx = source.getContext("2d", { willReadFrequently: true });
        await runStage(
          isRemove ? "Analyzing green cast…" : "Building matcha look…",
          42,
          420,
        );
        if (isRemove) {
          await analyzeRemoveVideo(video, source);
        } else if (ctx) {
          ctx.drawImage(video, 0, 0, source.width, source.height);
        }
        await runStage(
          isRemove ? "Neutralizing & cleaning…" : "Adding liquid grain…",
          70,
          580,
        );
        await runStage("Preparing compare view…", 92, 480);
        setKind("video");
        setCompare(50);
        setPeekOriginal(false);
        // Preview always seamless-loops so slider tuning never hits a dead end.
        // Export path turns loop off explicitly.
        video.loop = true;
        setPreviewPaused(false);
        setVideoTime(0);
        setVideoDuration(Number.isFinite(video.duration) ? video.duration : 0);
        await video.play().catch(() => undefined);
      } else {
        fail(
          {
            title: "Unsupported file type",
            detail: "Accepted: JPG, PNG, WebP, MP4, WebM, MOV.",
            reason: "unsupported_type",
          },
          "reject",
        );
        return;
      }
      setError(null);
      const mediaType = isImage ? "image" : "video";
      const video = videoRef.current;
      uploadReadyAtRef.current = performance.now();
      trackTool("tool_upload_success", {
        media_type: mediaType,
        file_ext: fileExtension(file.name) || "unknown",
        size_bucket: sizeBucket(file.size),
        duration_bucket:
          mediaType === "video" && video && Number.isFinite(video.duration)
            ? durationBucket(video.duration)
            : undefined,
      });
      setShowTip(true);
    } catch (e) {
      const issue =
        e && typeof e === "object" && "issue" in e
          ? (e as { issue: UploadIssue }).issue
          : {
              title: "Upload failed",
              detail: e instanceof Error ? e.message : "Something went wrong while reading that file.",
              reason: "unknown",
            };
      fail(issue, issue.reason && ["heic", "gif", "video_format", "unsupported_type", "empty", "too_large"].includes(issue.reason) ? "reject" : "fail");
    } finally {
      clearStatus();
      setBusy(false);
    }
  };

  const onDrop = (ev: DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    trackTool("tool_upload_drop");
    if (!file) {
      setError({
        title: "No file detected",
        detail: "Drop a single JPG, PNG, WebP, MP4, WebM, or MOV file onto this area.",
        reason: "empty",
      });
      trackTool("tool_upload_reject", { reason: "empty" });
      return;
    }
    void onFile(file);
  };

  const shareSample = async () => {
    if (!ready || busy || shareState === "uploading" || shareState === "done") return;
    if (!shareConsent) {
      setShareError("Check the consent box first.");
      setShareState("error");
      return;
    }
    const source = sourceCanvasRef.current;
    const video = videoRef.current;
    if (!source || !kind) return;

    setShareState("uploading");
    setShareError(null);
    trackTool("tool_sample_share_click", { media_type: kind, hard_case: hardCase });

    try {
      // Prefer the uploaded source frame (left side), not the processed result.
      if (kind === "video" && video) {
        const ctx = source.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas_unavailable");
        if (video.videoWidth > 0) {
          if (source.width !== video.videoWidth || source.height !== video.videoHeight) {
            source.width = video.videoWidth;
            source.height = video.videoHeight;
          }
          ctx.drawImage(video, 0, 0);
        }
      }
      if (!source.width || !source.height) throw new Error("empty_frame");

      const blob = await canvasToSampleBlob(source, source.width, source.height);
      const result = await uploadVoluntarySample(blob, {
        mode,
        mediaType: kind,
        width: source.width,
        height: source.height,
      });
      if (!result.ok) {
        setShareState("error");
        setShareError(
          result.error === "sample_storage_unavailable"
            ? "Sample inbox is not ready yet. Try again later."
            : "Could not send the sample. Please try again.",
        );
        trackTool("tool_sample_share_fail", { media_type: kind, reason: result.error });
        return;
      }
      setShareState("done");
      trackTool("tool_sample_share_success", { media_type: kind, hard_case: hardCase });
    } catch {
      setShareState("error");
      setShareError("Could not prepare the sample from this frame.");
      trackTool("tool_sample_share_fail", { media_type: kind, reason: "client" });
    }
  };

  const download = async () => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas || !ready || busy) return;
    const stem = baseFileName(fileName);
    trackTool("tool_download_click", { media_type: kind || undefined });
    const elapsed =
      uploadReadyAtRef.current != null
        ? elapsedBucket(performance.now() - uploadReadyAtRef.current)
        : undefined;

    if (kind === "image") {
      setBusy(true);
      setError(null);
      try {
        const fmt = pickImageExport(sourceExt || "png");
        const exportName = `${mode}-matcha-${stem}.${fmt.ext}`;
        const useSaveSheet = prefersMobileSave();

        await runStage(useSaveSheet ? "Preparing image…" : "Rendering export…", 30, useSaveSheet ? 280 : 700);
        const blob = await canvasToBlob(glCanvas, fmt.mime, fmt.quality);
        await runStage(useSaveSheet ? "Opening save sheet…" : "Packaging file…", 72, useSaveSheet ? 220 : 650);

        if (useSaveSheet) {
          const url = URL.createObjectURL(blob);
          const file = new File([blob], exportName, { type: fmt.mime });
          closeSaveSheet();
          setSaveSheet({
            kind: "image",
            url,
            fileName: exportName,
            mime: fmt.mime,
            blob,
            canShare: canShareFile(file),
            ext: fmt.ext,
          });
          trackTool("tool_download_success", {
            media_type: "image",
            export_ext: fmt.ext,
            format_preserved: fmt.ext === (sourceExt === "jpeg" ? "jpg" : sourceExt),
            elapsed_ms_bucket: elapsed,
            save_method: "mobile_sheet",
          });
        } else {
          await runStage("Starting download…", 94, 400);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = exportName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2_000);
          trackTool("tool_download_success", {
            media_type: "image",
            export_ext: fmt.ext,
            format_preserved: fmt.ext === (sourceExt === "jpeg" ? "jpg" : sourceExt),
            elapsed_ms_bucket: elapsed,
            save_method: "file_download",
          });
        }
      } catch {
        trackTool("tool_download_fail", { media_type: "image", reason: "unknown" });
      } finally {
        clearStatus();
        setBusy(false);
      }
      return;
    }

    const video = videoRef.current;
    const source = sourceCanvasRef.current;
    if (!video || !source || !glCanvas) return;
    setBusy(true);
    setError(null);
    try {
      await runStage("Preparing video export…", 18, 550);
      const gl = ensureGL();
      if (!gl) throw new Error("WebGL2 required");
      stopLoop();
      gl.resetTemporal();

      const previousMuted = video.muted;
      const previousVolume = video.volume;
      // Unmute so captureStream can include audio (muted often yields silent tracks).
      video.muted = false;
      if (video.volume <= 0) video.volume = 0.85;

      const { stream, hasAudio, mediaStream } = buildExportStream(glCanvas, video, 30);
      let picked = pickVideoExport(hasAudio);
      if (!picked && hasAudio) {
        // Retry video-only MIME list if audio-tagged codecs are unsupported
        for (const track of stream.getAudioTracks()) stream.removeTrack(track);
        picked = pickVideoExport(false);
      }
      if (!picked) {
        video.muted = previousMuted;
        video.volume = previousVolume;
        mediaStream?.getTracks().forEach((t) => {
          if (t.kind === "audio") t.stop();
        });
        setError({
          title: "Video export not supported here",
          detail: "This browser cannot record canvas video. Try Chrome/Edge, or download a photo as JPG/PNG instead.",
          reason: "no_recorder",
        });
        trackTool("tool_download_fail", { media_type: "video", reason: "no_recorder" });
        return;
      }

      const exportHasAudio = stream.getAudioTracks().length > 0;
      await runStage(
        exportHasAudio ? "Rendering frames with audio…" : "Rendering frames…",
        40,
        500,
      );

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: picked.mime });
      } catch {
        recorder = new MediaRecorder(stream);
        picked = { mime: "", ext: picked.ext };
      }
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: (picked.mime || "video/webm").split(";")[0] }));
      });

      const ctx = source.getContext("2d", { willReadFrequently: true });
      video.loop = false;
      video.currentTime = 0;
      await video.play();
      recorder.start(100);

      const exportLoop = () => {
        if (!ctx || video.paused || video.ended) return;
        if (source.width !== video.videoWidth && video.videoWidth > 0) {
          source.width = video.videoWidth;
          source.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
        gl.upload(source, source.width, source.height);
        if (isRemove) {
          gl.renderRemove({
            neutralize,
            denoise,
            detail,
            temporal: 100,
            balance: analysis.balance,
            toneRange: analysis.toneRange,
            analysisMix: analysis.analysisMix,
          });
        } else {
          gl.renderApply({
            strength,
            liquid,
            grain,
            time: video.currentTime,
          });
        }
        requestAnimationFrame(exportLoop);
      };
      exportLoop();

      await new Promise<void>((resolve) => {
        video.onended = () => resolve();
      });
      recorder.stop();
      video.pause();
      const blob = await done;

      video.muted = previousMuted;
      video.volume = previousVolume;
      mediaStream?.getTracks().forEach((t) => {
        if (t.kind === "audio") t.stop();
      });

      const exportMime = (picked.mime || blob.type || "video/webm").split(";")[0];
      const exportName = `${mode}-matcha-${stem}.${picked.ext}`;
      const useSaveSheet = prefersMobileSave();
      await runStage("Encoding file…", 78, useSaveSheet ? 320 : 520);

      if (useSaveSheet) {
        await runStage("Opening save sheet…", 92, 220);
        const url = URL.createObjectURL(blob);
        const file = new File([blob], exportName, { type: exportMime });
        closeSaveSheet();
        setSaveSheet({
          kind: "video",
          url,
          fileName: exportName,
          mime: exportMime,
          blob,
          canShare: canShareFile(file),
          ext: picked.ext,
        });
        trackTool("tool_download_success", {
          media_type: "video",
          export_ext: picked.ext,
          format_preserved: picked.ext === sourceExt || (sourceExt === "mov" && picked.ext === "mp4"),
          elapsed_ms_bucket: elapsed,
          save_method: "mobile_sheet",
          has_audio: exportHasAudio,
        });
      } else {
        await runStage("Starting download…", 95, 380);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = exportName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2_000);
        trackTool("tool_download_success", {
          media_type: "video",
          export_ext: picked.ext,
          format_preserved: picked.ext === sourceExt || (sourceExt === "mov" && picked.ext === "mp4"),
          elapsed_ms_bucket: elapsed,
          save_method: "file_download",
          has_audio: exportHasAudio,
        });

        if (picked.ext === "webm" && (sourceExt === "mp4" || sourceExt === "mov")) {
          setError({
            title: "Saved as WebM (browser limit)",
            detail: exportHasAudio
              ? "This browser cannot record MP4 from canvas, so the download is WebM (with audio when possible). Convert to MP4 in any editor if needed."
              : "This browser cannot record MP4 from canvas, so the download is WebM. Convert to MP4 in any editor if needed.",
            tone: "info",
          });
        } else if (!exportHasAudio) {
          setError({
            title: "Exported without audio",
            detail: "This browser could not capture the video’s audio track into the recording. Picture frames are still included.",
            tone: "info",
          });
        }
      }

      video.loop = true;
      setPreviewPaused(false);
      await video.play().catch(() => undefined);
      startLoop();
    } catch {
      setError({
        title: "Video export failed",
        detail: "Try a shorter clip (under 30s), or download a still photo in its original format.",
        reason: "record_fail",
      });
      trackTool("tool_download_fail", { media_type: "video", reason: "record_fail" });
    } finally {
      clearStatus();
      setBusy(false);
    }
  };

  const downloadLabel = (() => {
    if (!ready) return "Download";
    if (kind === "image") {
      const fmt = pickImageExport(sourceExt || "png");
      return mobileSaveUi ? `Save ${fmt.ext.toUpperCase()}` : `Download ${fmt.ext.toUpperCase()}`;
    }
    return mobileSaveUi ? "Save video" : "Download video";
  })();

  const shareSaveSheet = async () => {
    if (!saveSheet) return;
    const file = new File([saveSheet.blob], saveSheet.fileName, { type: saveSheet.mime });
    try {
      await navigator.share({
        files: [file],
        title: saveSheet.fileName,
      });
      trackTool("tool_save_share", { media_type: saveSheet.kind, result: "shared" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        trackTool("tool_save_share", { media_type: saveSheet.kind, result: "cancelled" });
        return;
      }
      trackTool("tool_save_share", { media_type: saveSheet.kind, result: "failed" });
    }
  };

  const downloadSaveSheetFile = () => {
    if (!saveSheet) return;
    const a = document.createElement("a");
    a.href = saveSheet.url;
    a.download = saveSheet.fileName;
    a.click();
    trackTool("tool_save_file_fallback", { media_type: saveSheet.kind });
  };

  const saveSheetTitle = saveSheet?.kind === "video" ? "Save your video" : "Save to Photos";
  const saveSheetHint = (() => {
    if (!saveSheet) return "";
    if (saveSheet.kind === "video") {
      if (saveSheet.ext === "webm") {
        return saveSheet.canShare
          ? "Tap Share, then Save to Files. WebM may not open in iPhone Photos — convert to MP4 if needed."
          : "Download the file, or open it in a player that supports WebM. iPhone Photos usually needs MP4.";
      }
      return saveSheet.canShare
        ? "Tap Share, then Save Video / Save to Files. Preview plays below (audio included when this browser allowed it)."
        : "Download the file, then open it from Files to save to Photos if your phone allows.";
    }
    return saveSheet.canShare
      ? "Tap Share, then choose Save Image / Save to Photos. Or long-press the picture below."
      : "Long-press the picture → Save Image / Add to Photos.";
  })();
  const saveShareLabel =
    saveSheet?.kind === "video"
      ? saveSheet.ext === "webm"
        ? "Share / Save to Files"
        : "Share / Save Video"
      : "Share / Save to Photos";

  const splitPos = peekOriginal ? 100 : Math.max(0, Math.min(100, compare));
  const beforeLabel = isRemove ? "With filter" : "Original";
  const afterLabel = isRemove ? "Filter removed" : "Matcha applied";
  const showSplitLabels = ready && !peekOriginal && splitPos > 8 && splitPos < 92;

  return (
    <section className={`tool-shell ${ready ? "has-export-dock" : ""}`}>
      <div className="tool-intro">
        <p className="eyebrow">{isRemove ? "Remove workspace" : "Apply workspace"} · On-device · Opt-in sample</p>
        <h1 className="display mt-2">{title}</h1>
        <p className="lead mt-3">{subtitle}</p>
        <p className="tool-howto tool-howto-desktop">
          {isRemove
            ? "Left = your upload still with the green matcha look. Right = after we reduce that cast. Drag the split, or hold “Show original” to flash the full left-side frame."
            : "Left = your original upload. Right = with the matcha look applied. Drag the split, or hold “Show original” to flash the untouched frame."}
        </p>
        {ready && (
          <p className="tool-howto tool-howto-mobile">
            Drag the vertical line to compare. Press and hold “Show original” to peek the full before
            frame.
          </p>
        )}
      </div>

      <div className="tool-layout">
        <div className="preview-column">
          {ready && (
            <div className="compare-legend">
              <span className="legend-pill legend-before">{beforeLabel}</span>
              <span className="legend-arrow">→</span>
              <span className="legend-pill legend-after">{afterLabel}</span>
            </div>
          )}

          <div
            className={`preview-frame ${dragOver ? "is-dragover" : ""} ${ready ? "has-media" : ""} ${busy ? "is-busy" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOver(false);
            }}
            onDrop={onDrop}
          >
            {busy && (
              <div className="process-overlay" role="status" aria-live="polite">
                <div className="process-spinner" aria-hidden />
                <p className="process-title">{statusText || "Working…"}</p>
                <div className="process-track" aria-hidden>
                  <div className="process-fill" style={{ width: `${Math.max(8, statusProgress)}%` }} />
                </div>
                <p className="process-sub">On-device processing · usually a couple of seconds</p>
              </div>
            )}

            {!ready && !busy && (
              <button
                type="button"
                className={`dropzone ${error ? "has-error" : ""} ${dragOver ? "is-dragover" : ""}`}
                onClick={() => {
                  trackTool("tool_upload_click", { entry: "dropzone" });
                  inputRef.current?.click();
                }}
                disabled={busy}
              >
                <span className="dropzone-kicker">Step 1</span>
                <span className="dropzone-title">
                  {dragOver
                    ? "Drop to upload"
                    : error
                      ? "Try another file"
                      : (
                        <>
                          <span className="copy-mobile">Tap to choose a photo or video</span>
                          <span className="copy-desktop">Drop a photo or short video</span>
                        </>
                      )}
                </span>
                <span className="dropzone-sub">
                  <span className="copy-mobile">
                    JPG, PNG, WebP, MP4, WebM, MOV · under {MAX_IMAGE_MB}MB · video ≤ {MAX_VIDEO_SECONDS}s
                  </span>
                  <span className="copy-desktop">
                    JPG, PNG, WebP, MP4, WebM, MOV · max {MAX_IMAGE_MB}MB · video ≤ {MAX_VIDEO_SECONDS}s
                  </span>
                </span>
                {error && (
                  <div
                    className={`error-banner dropzone-error ${error.tone === "info" ? "is-info" : ""}`}
                    role="alert"
                  >
                    <div className="error-banner-title">{error.title}</div>
                    <div className="error-banner-detail">{error.detail}</div>
                  </div>
                )}
              </button>
            )}

            <div
              ref={compareWrapRef}
              className={`compare-wrap ${ready ? "" : "sr-only"} ${draggingCompare ? "is-dragging" : ""}`}
              onPointerDown={onComparePointerDown}
              onPointerMove={onComparePointerMove}
              onPointerUp={endCompareDrag}
              onPointerCancel={endCompareDrag}
            >
              <canvas ref={sourceCanvasRef} className="preview-canvas" />
              <canvas
                ref={glCanvasRef}
                className="preview-canvas preview-result"
                style={{
                  // compare/splitPos = line from left. Clip result's left side so:
                  // left of line = source upload, right of line = processed result.
                  clipPath: `inset(0 0 0 ${splitPos}%)`,
                }}
              />
              {ready && (
                <>
                  <div className="compare-divider" style={{ left: `${splitPos}%` }} aria-hidden>
                    <span className="compare-handle" />
                  </div>
                  {showSplitLabels && (
                    <>
                      <div
                        className="compare-label compare-label-before"
                        style={{ maxWidth: `calc(${splitPos}% - 1rem)` }}
                      >
                        {beforeLabel}
                      </div>
                      <div
                        className="compare-label compare-label-after"
                        style={{ maxWidth: `calc(${100 - splitPos}% - 1rem)` }}
                      >
                        {afterLabel}
                      </div>
                    </>
                  )}
                  {peekOriginal && (
                    <div className="compare-label compare-label-before compare-label-full">
                      <span className="copy-mobile">Release to return</span>
                      <span className="copy-desktop">Full original · release to return</span>
                    </div>
                  )}
                  <div className="preview-actions">
                    <button
                      type="button"
                      className={`preview-chip ${peekOriginal ? "is-active" : ""}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setPeekOriginal(true);
                        noteCompare("peek_original");
                      }}
                      onPointerUp={() => setPeekOriginal(false)}
                      onLostPointerCapture={() => setPeekOriginal(false)}
                      onPointerCancel={() => setPeekOriginal(false)}
                    >
                      Hold · show original
                    </button>
                    <div className="preview-actions-end">
                      {kind === "video" && (
                        <button
                          type="button"
                          className="preview-chip"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={togglePreviewPlayback}
                          aria-label={previewPaused ? "Play preview" : "Pause preview"}
                        >
                          {previewPaused ? "Play" : "Pause"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="preview-chip preview-chip-download"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          download();
                        }}
                        disabled={busy}
                      >
                        {mobileSaveUi ? "Save" : "Download"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <video ref={videoRef} className="hidden" playsInline muted />
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void onFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {ready && (
            <p className="compare-hint compare-hint-desktop">
              <strong>How to compare:</strong> left = {isRemove ? "with filter" : "original"}, right ={" "}
              {isRemove ? "filter removed" : "matcha applied"}. Drag the preview split, or press and hold
              “Hold · show original”.
            </p>
          )}
        </div>

        <aside className="controls-panel">
          {ready && showTip && (
            <div className="engage-tip" role="status">
              <div className="engage-tip-copy">
                {isRemove && autoTuned ? (
                  <>
                    <strong>Auto-tuned:</strong> sliders were set from your file
                    {kind === "video" ? " (multi-frame sample)" : ""}. Tweak if needed, or tap Re-analyze.
                  </>
                ) : (
                  <>
                    <strong>Next:</strong> tweak the sliders below
                    {isRemove ? ", or tap Stronger remove" : ""}. Drag the preview line to compare.
                  </>
                )}
              </div>
              <button type="button" className="engage-tip-dismiss" onClick={() => setShowTip(false)}>
                Got it
              </button>
            </div>
          )}

          {ready && !sharePromptHidden && (
            <div
              className={`sample-share ${hardCase && isRemove ? "is-hard" : ""}`}
              role="region"
              aria-label="Optional sample share"
            >
              {shareState === "done" ? (
                <div className="sample-share-done">
                  <span>Thanks — received. Used only to improve the tools.</span>
                  <button
                    type="button"
                    className="engage-tip-dismiss"
                    onClick={() => setSharePromptHidden(true)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="sample-share-head">
                    <strong>
                      {isRemove
                        ? hardCase
                          ? "Tough matcha cast on this frame"
                          : "Optional: help improve remove"
                        : "Optional: help match the viral look"}
                    </strong>
                    <span>Compressed frame · no filename</span>
                  </div>
                  <label className="sample-share-consent">
                    <input
                      type="checkbox"
                      checked={shareConsent}
                      disabled={shareState === "uploading"}
                      onChange={(e) => {
                        setShareConsent(e.target.checked);
                        if (shareState === "error") {
                          setShareState("idle");
                          setShareError(null);
                        }
                      }}
                    />
                    <span>
                      <span className="sample-share-copy-long">
                        {isRemove
                          ? hardCase
                            ? "Pre-checked for convenience — uncheck anytime. Cases like yours help tune the remover. Compressed frame only; default processing stays on-device. "
                            : "Pre-checked for convenience — uncheck anytime. Share a compressed frame so we can review real matcha clips. Default processing stays on-device. "
                          : "Pre-checked for convenience — uncheck anytime. Share a compressed frame of this look so we can refine Apply. Default processing stays on-device. "}
                        <a href="/privacy">Privacy</a>
                      </span>
                      <span className="sample-share-copy-short">
                        {isRemove
                          ? hardCase
                            ? "Pre-checked · tap Share to send this hard case. Uncheck to skip. "
                            : "Pre-checked · tap Share to send a compressed frame. Uncheck to skip. "
                          : "Pre-checked · tap Share to send this look. Uncheck to skip. "}
                        <a href="/privacy">Privacy</a>
                      </span>
                    </span>
                  </label>
                  <div className="sample-share-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-compact"
                      disabled={!shareConsent || shareState === "uploading"}
                      onClick={() => void shareSample()}
                    >
                      {shareState === "uploading" ? "Sending…" : "Share sample"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-compact"
                      disabled={shareState === "uploading"}
                      onClick={() => {
                        setSharePromptHidden(true);
                        trackTool("tool_sample_share_dismiss", {
                          media_type: kind,
                          hard_case: hardCase,
                        });
                      }}
                    >
                      Not now
                    </button>
                    {shareState === "error" && shareError && (
                      <span className="sample-share-status is-bad">{shareError}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {ready && (
          <div className="control-block adjust-block">
            <div className="control-block-head">
              <h2>1. Adjust effect</h2>
              <p>
                {isRemove
                  ? autoTuned
                    ? "Auto-analyzed starting point — adjust if needed."
                    : "Reduce green cast and grain."
                  : "Tune liquid matcha look."}
              </p>
            </div>

            {isRemove ? (
              <div className="control-stack">
                <div className="auto-tune-row">
                  {autoTuned ? (
                    <span className="auto-tune-badge">Auto-tuned</span>
                  ) : (
                    <span className="auto-tune-badge is-manual">Manual</span>
                  )}
                  <button
                    type="button"
                    className="btn-ghost btn-compact"
                    disabled={!ready || busy}
                    onClick={() => void reAnalyze()}
                  >
                    Re-analyze
                  </button>
                </div>
                <label className="control">
                  <span>
                    Color neutralize <em>{neutralize}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={neutralize}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setNeutralize(v);
                      setAutoTuned(false);
                      noteParam("neutralize", v);
                    }}
                  />
                </label>
                <label className="control">
                  <span>
                    Noise reduction <em>{denoise}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={denoise}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDenoise(v);
                      setAutoTuned(false);
                      noteParam("denoise", v);
                    }}
                  />
                </label>
                <label className="control">
                  <span>
                    Detail restore <em>{detail}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={detail}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDetail(v);
                      setAutoTuned(false);
                      noteParam("detail", v);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn-ghost btn-compact"
                  disabled={!ready || busy}
                  onClick={() => {
                    setNeutralize(92);
                    setDenoise(62);
                    setDetail(48);
                    setCompare(50);
                    setAutoTuned(false);
                    trackTool("tool_preset_click", {
                      preset: "stronger_remove",
                      media_type: kind || undefined,
                    });
                    // One soft re-ask after they push harder — still dismissible, never blocks export.
                    if (
                      sharePromptHidden &&
                      shareState !== "done" &&
                      !shareRevivedRef.current
                    ) {
                      shareRevivedRef.current = true;
                      setSharePromptHidden(false);
                      setShareConsent(true);
                      trackTool("tool_sample_share_revive", {
                        media_type: kind || undefined,
                        hard_case: hardCase,
                        reason: "stronger_remove",
                      });
                    }
                  }}
                >
                  Stronger remove preset
                </button>
              </div>
            ) : (
              <div className="control-stack">
                <label className="control">
                  <span>
                    Filter strength <em>{strength}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={strength}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setStrength(v);
                      noteParam("strength", v);
                    }}
                  />
                </label>
                <label className="control">
                  <span>
                    Liquid motion <em>{liquid}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={liquid}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLiquid(v);
                      noteParam("liquid", v);
                    }}
                  />
                </label>
                <label className="control">
                  <span>
                    Film grain <em>{grain}</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={grain}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setGrain(v);
                      noteParam("grain", v);
                    }}
                  />
                </label>
              </div>
            )}
          </div>
          )}

          {ready && (
            <div className="control-block compare-block">
              <div className="control-block-head">
                <h2>2. Compare</h2>
                <p>Confirm before vs after on the same frame.</p>
              </div>
              <div className="control-stack">
                {kind === "video" && (
                  <div className="transport">
                    <button
                      type="button"
                      className="btn-ghost btn-compact transport-toggle"
                      onClick={togglePreviewPlayback}
                      disabled={busy}
                    >
                      {previewPaused ? "Play" : "Pause"}
                    </button>
                    <label className="control transport-scrub">
                      <span>
                        Scrub frame <em>
                          {formatClock(videoTime)} / {formatClock(videoDuration)}
                        </em>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0.1, videoDuration || 0.1)}
                        step={0.01}
                        value={Math.min(videoTime, videoDuration || videoTime)}
                        onChange={(e) => scrubVideo(Number(e.target.value))}
                      />
                    </label>
                  </div>
                )}
                <label className="control">
                  <span>
                    Compare split <em>{Math.round(splitPos)}%</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compare}
                    onChange={(e) => {
                      setCompare(Number(e.target.value));
                      noteCompare("split");
                    }}
                    disabled={peekOriginal}
                  />
                  <span className="control-caption">
                    Drag right → line moves right. Left of line: {isRemove ? "with filter" : "original"} ·
                    Right of line: {isRemove ? "filter removed" : "matcha applied"}
                  </span>
                </label>
                <button
                  type="button"
                  className={`btn-secondary btn-compact hold-original-desktop ${peekOriginal ? "is-pressed" : ""}`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setPeekOriginal(true);
                    noteCompare("peek_original");
                  }}
                  onPointerUp={() => setPeekOriginal(false)}
                  onLostPointerCapture={() => setPeekOriginal(false)}
                  onPointerCancel={() => setPeekOriginal(false)}
                >
                  Hold to show original
                </button>
              </div>
            </div>
          )}

          <div className={`control-block export-block export-block-panel ${ready ? "is-ready" : ""}`}>
            <div className="control-block-head">
              <h2>{ready ? "3. Export" : "Next"}</h2>
              <p>{ready ? "Download keeps your source format when possible." : "Upload a photo or short video to start."}</p>
            </div>
            <div className="action-row">
              {ready ? (
                <>
                  <button type="button" className="btn-primary" onClick={download} disabled={busy}>
                    {downloadLabel}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      trackTool("tool_upload_click", { entry: "replace" });
                      inputRef.current?.click();
                    }}
                    disabled={busy}
                  >
                    Replace file
                  </button>
                  <button type="button" className="btn-ghost" onClick={reset}>
                    Reset
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    trackTool("tool_upload_click", { entry: "primary_cta" });
                    inputRef.current?.click();
                  }}
                  disabled={busy}
                >
                  {isRemove ? "Upload & Remove" : "Upload & Apply"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className={`error-banner ${error.tone === "info" ? "is-info" : ""}`} role="alert">
              <div className="error-banner-title">{error.title}</div>
              <div className="error-banner-detail">{error.detail}</div>
            </div>
          )}

          <p className="fineprint">
            {isRemove
              ? "Best-effort cleanup only. Cannot reveal hidden or censored content. Default tools keep media in this browser tab unless you opt in to share a sample."
              : "Local WebGL look inspired by the viral matcha style. Not affiliated with TikTok. Sharing a sample is optional and off by default."}
          </p>
        </aside>
      </div>

      {ready && (
        <div className="mobile-export-dock" role="region" aria-label="Export actions">
          <button type="button" className="btn-primary" onClick={download} disabled={busy}>
            {downloadLabel}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              trackTool("tool_upload_click", { entry: "replace_dock" });
              inputRef.current?.click();
            }}
            disabled={busy}
          >
            Replace
          </button>
          <button type="button" className="btn-ghost" onClick={reset}>
            Reset
          </button>
        </div>
      )}

      {saveSheet && (
        <div
          className="save-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-sheet-title"
        >
          <button type="button" className="save-sheet-backdrop" aria-label="Close" onClick={closeSaveSheet} />
          <div className="save-sheet-panel">
            <div className="save-sheet-head">
              <h2 id="save-sheet-title">{saveSheetTitle}</h2>
              <button type="button" className="save-sheet-close" onClick={closeSaveSheet}>
                Done
              </button>
            </div>
            <p className="save-sheet-hint">{saveSheetHint}</p>
            {saveSheet.kind === "video" ? (
              <video
                className="save-sheet-video"
                src={saveSheet.url}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="save-sheet-image"
                src={saveSheet.url}
                alt="Processed result — long-press to save"
                draggable={false}
              />
            )}
            <div className="save-sheet-actions">
              {saveSheet.canShare && (
                <button type="button" className="btn-primary" onClick={() => void shareSaveSheet()}>
                  {saveShareLabel}
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={downloadSaveSheetFile}>
                Download file instead
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
