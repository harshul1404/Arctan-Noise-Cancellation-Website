import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import path from "path";
import { createDubbedVideo, normalizeVideoTimestamps } from "@/lib/ffmpeg";
import { outputPath, publicOutputUrl, UploadMetadata } from "@/lib/storage";

type ElevenLabsDubInput = {
  upload: UploadMetadata;
  sourceLang?: string;
  targetLang: string;
};

type DubStatus = {
  status?: string;
  error?: string;
  target_languages?: string[];
  source_language?: string | null;
  media_metadata?: {
    content_type?: string;
    duration?: number;
  } | null;
};

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

function getApiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Missing ELEVENLABS_API_KEY.");
  return key;
}

async function elevenLabsFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${ELEVENLABS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "xi-api-key": getApiKey(),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${detail}`);
  }
  return response;
}

export async function createElevenLabsDub(input: ElevenLabsDubInput) {
  const form = new FormData();
  const fileBuffer = await fs.readFile(input.upload.localPath);
  const mimeType = elevenLabsMimeType(input.upload);
  form.append("file", new Blob([fileBuffer], { type: mimeType }), input.upload.originalName);
  form.append("name", `LT dub ${path.parse(input.upload.originalName).name}`.slice(0, 120));
  form.append("target_lang", input.targetLang);
  if (input.sourceLang && input.sourceLang !== "auto") form.append("source_lang", input.sourceLang);
  form.append("num_speakers", "0");
  form.append("watermark", "false");
  form.append("highest_resolution", "true");
  form.append("drop_background_audio", "false");
  form.append("disable_voice_cloning", "false");

  const createResponse = await elevenLabsFetch("/dubbing", {
    method: "POST",
    body: form
  });
  const created = (await createResponse.json()) as { dubbing_id?: string; expected_duration_sec?: number };
  if (!created.dubbing_id) throw new Error("ElevenLabs did not return a dubbing ID.");

  const status = await waitForDub(created.dubbing_id, created.expected_duration_sec);
  if (status.status !== "dubbed") {
    throw new Error(status.error || `ElevenLabs dubbing ended with status: ${status.status ?? "unknown"}`);
  }

  const audioResponse = await elevenLabsFetch(`/dubbing/${created.dubbing_id}/audio/${input.targetLang}`);
  const contentType = audioResponse.headers.get("content-type") ?? "";
  const data = Buffer.from(await audioResponse.arrayBuffer());
  const extension = inferDubExtension(contentType, data);
  const jobId = nanoid(16);
  const filename = `${jobId}-elevenlabs-dub.${extension}`;
  await fs.writeFile(outputPath(filename), data);

  let videoUrl: string | undefined;
  let audioUrl: string | undefined;
  let lipSyncMode: "provider_video_render" | "audio_timing_only" = "audio_timing_only";

  if (extension === "mp4" || extension === "mov" || contentType.includes("video")) {
    const normalizedFilename = `${jobId}-elevenlabs-dub-aligned.mp4`;
    await normalizeVideoTimestamps(outputPath(filename), outputPath(normalizedFilename));
    videoUrl = publicOutputUrl(normalizedFilename);
    lipSyncMode = "provider_video_render";
  } else {
    audioUrl = publicOutputUrl(filename);
    if (input.upload.fileType === "video") {
      const muxedFilename = `${jobId}-elevenlabs-dubbed.mp4`;
      await createDubbedVideo(input.upload.localPath, outputPath(filename), outputPath(muxedFilename));
      videoUrl = publicOutputUrl(muxedFilename);
    }
  }

  return {
    jobId,
    transcript:
      "Dubbed with ElevenLabs production dubbing. Speaker detection, voice cloning, timing alignment, and background audio handling are managed by ElevenLabs.",
    videoUrl,
    audioUrl,
    usage: {
      provider: "elevenlabs",
      dubbingId: created.dubbing_id,
      status,
      mediaType: contentType || status.media_metadata?.content_type,
      capabilities: {
        speakerDetection: true,
        voiceCloning: true,
        backgroundAudio: true,
        timingAlignment: true,
        lipSync: lipSyncMode === "provider_video_render",
        lipSyncMode
      }
    }
  };
}

function elevenLabsMimeType(upload: UploadMetadata) {
  if (upload.mimeType && upload.mimeType !== "application/octet-stream") return upload.mimeType;
  switch (upload.extension.toLowerCase()) {
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    default:
      return upload.fileType === "video" ? "video/mp4" : "audio/mpeg";
  }
}

function inferDubExtension(contentType: string, data: Buffer) {
  const type = contentType.toLowerCase();
  if (type.includes("mp4")) return "mp4";
  if (type.includes("quicktime")) return "mov";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (data.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  if (data.subarray(0, 3).toString("ascii") === "ID3") return "mp3";
  if (data.subarray(0, 4).toString("ascii") === "RIFF") return "wav";
  return "mp3";
}

async function waitForDub(dubbingId: string, expectedDurationSec?: number) {
  const deadlineMs = Date.now() + Math.max(15 * 60_000, (expectedDurationSec ?? 60) * 20_000);

  while (Date.now() < deadlineMs) {
    const response = await elevenLabsFetch(`/dubbing/${dubbingId}`);
    const status = (await response.json()) as DubStatus;
    if (status.status === "dubbed" || status.status === "failed") return status;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("ElevenLabs dubbing timed out before the job completed.");
}
