import { z } from "zod";
import { isVoiceCompatible, supportsAudioTarget, targetLanguages } from "@/lib/languages";

export const audioExtensions = new Set(["wav", "mp3", "m4a"]);
export const videoExtensions = new Set(["mp4", "mov", "webm"]);

const audioMimePrefixes = ["audio/"];
const videoMimePrefixes = ["video/"];
const knownAudioMimes = new Set(["application/octet-stream"]);

export type FileType = "audio" | "video";
export type OutputMode = "text" | "text_audio" | "text_audio_video";

export const translateRequestSchema = z.object({
  fileId: z.string().min(8),
  fileType: z.enum(["audio", "video"]),
  sourceLang: z.string().optional(),
  targetLang: z.string(),
  outputMode: z.enum(["text", "text_audio", "text_audio_video"]),
  voice: z.string().optional()
});

export function getMaxUploadBytes() {
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? "100");
  return (Number.isFinite(maxMb) && maxMb > 0 ? maxMb : 100) * 1024 * 1024;
}

export function normalizeExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function inferFileType(extension: string): FileType | null {
  if (audioExtensions.has(extension)) return "audio";
  if (videoExtensions.has(extension)) return "video";
  return null;
}

export function validateUploadFile(file: File, extension: string) {
  const fileType = inferFileType(extension);
  if (!fileType) {
    return "Unsupported file type. Upload WAV, MP3, M4A, MP4, MOV, or WEBM.";
  }
  const mimeType = file.type || "application/octet-stream";
  const mimeOk =
    fileType === "audio"
      ? audioMimePrefixes.some((prefix) => mimeType.startsWith(prefix)) || knownAudioMimes.has(mimeType)
      : videoMimePrefixes.some((prefix) => mimeType.startsWith(prefix)) || mimeType === "application/octet-stream";
  if (!mimeOk) {
    return "The file MIME type does not match the selected media type.";
  }
  if (file.size > getMaxUploadBytes()) {
    return `File is too large. The current limit is ${Math.round(getMaxUploadBytes() / 1024 / 1024)} MB.`;
  }
  return null;
}

export function validateTranslateOptions(input: z.infer<typeof translateRequestSchema>) {
  if (!targetLanguages.some((language) => language.code === input.targetLang)) {
    return "Unsupported target language.";
  }
  if (input.outputMode === "text_audio_video" && input.fileType !== "video") {
    return "Dubbed video output is only available for video uploads.";
  }
  if (input.outputMode !== "text" && !supportsAudioTarget(input.targetLang)) {
    return "This target language supports transcript output only.";
  }
  if (input.outputMode !== "text" && !isVoiceCompatible(input.voice, input.targetLang)) {
    return "The selected voice is not compatible with the target language.";
  }
  return null;
}

export const transcribeRequestSchema = z.object({
  fileId: z.string().min(8),
  fileType: z.enum(["audio", "video"]),
  sourceLang: z.string().optional(),
  targetLang: z.string(),
  voice: z.string()
});

const phraseSchema = z.object({
  index: z.number().int().min(0),
  start: z.number().min(0),
  end: z.number().min(0),
  speakerId: z.string(),
  translatedText: z.string()
});

export type DubbingPhrase = z.infer<typeof phraseSchema>;

export function validatePhraseTimings(phrases: DubbingPhrase[], duration?: number) {
  const tolerance = 0.015;
  const sorted = [...phrases].sort((a, b) => a.start - b.start || a.end - b.end);

  for (const phrase of sorted) {
    if (phrase.end <= phrase.start) {
      return `Phrase ${phrase.index + 1} must end after it starts.`;
    }
    if (duration !== undefined && phrase.end > duration + tolerance) {
      return `Phrase ${phrase.index + 1} ends after the source video duration.`;
    }
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (current.start < previous.end - tolerance) {
      return `Phrase ${current.index + 1} overlaps phrase ${previous.index + 1}.`;
    }
  }

  return null;
}

export const dubRequestSchema = z.object({
  jobId: z.string().min(8),
  fileId: z.string().min(8),
  phrases: z.array(phraseSchema).min(1)
});

export const trimRequestSchema = z.object({
  jobId: z.string().min(8),
  fileId: z.string().min(8),
  phrases: z.array(phraseSchema).min(1)
});

export function safeOutputFilename(filename: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return null;
  return filename;
}
