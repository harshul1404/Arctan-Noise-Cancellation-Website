import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ensureStorageDirs, getUploadMetadata, outputPath, outputsDir } from "@/lib/storage";
import { concatenateAudioSegments, extractAudioToWav, getMediaDuration } from "@/lib/ffmpeg";
import { createQwenClonedVoice } from "@/lib/qwenVoiceClone";
import { validatePhraseTimings } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 300;

const phraseSchema = z.object({
  index: z.number().int().min(0),
  start: z.number().min(0),
  end: z.number().min(0),
  speakerId: z.string(),
  translatedText: z.string()
});

const schema = z.object({
  fileId: z.string().min(8),
  sourceLang: z.string().optional(),
  targetLang: z.string(),
  voice: z.string(),
  phrases: z.array(phraseSchema).optional()
});

function isQuotaError(err: unknown) {
  return /403|free tier|quota|billing|exhausted/i.test(err instanceof Error ? err.message : String(err));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const upload = await getUploadMetadata(parsed.data.fileId);
    if (!upload) return NextResponse.json({ error: "Uploaded file not found." }, { status: 404 });

    await ensureStorageDirs();

    const jobId = nanoid(16);
    const workDir = outputPath(`${jobId}-segments`);
    await fs.mkdir(workDir, { recursive: true });

    const sourceAudioPath = path.join(workDir, "source.wav");
    await extractAudioToWav(upload.localPath, sourceAudioPath);
    const duration = await getMediaDuration(upload.localPath);
    if (parsed.data.phrases) {
      const timingError = validatePhraseTimings(parsed.data.phrases, duration);
      if (timingError) return NextResponse.json({ error: timingError }, { status: 400 });
    }

    // Voice-clone enrollment — uses the provided phrase timestamps to collect
    // per-speaker reference audio from the source, then enrolls Qwen voice clones.
    const speakerClones: Array<{ speakerId: string; voiceId: string; model: string }> = [];

    if (parsed.data.phrases && parsed.data.phrases.length > 0 && process.env.QWEN_VOICE_CLONING === "true") {
      const PRIMARY = process.env.QWEN_TTS_VC_MODEL || "qwen3-tts-vc-2026-01-22";
      const FALLBACK = process.env.QWEN_TTS_VC_FALLBACK_MODEL || "qwen3-tts-vc-realtime-2026-01-15";

      // Group phrases by speaker
      const speakerRanges = new Map<string, Array<{ start: number; end: number }>>();
      for (const p of parsed.data.phrases) {
        if (!speakerRanges.has(p.speakerId)) speakerRanges.set(p.speakerId, []);
        speakerRanges.get(p.speakerId)!.push({ start: p.start, end: p.end });
      }

      for (const [speakerId, ranges] of speakerRanges) {
        try {
          const refPath = path.join(workDir, `speaker-${speakerId}-ref.wav`);
          await concatenateAudioSegments(sourceAudioPath, ranges, refPath, 60);
          const baseName = `spk${jobId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}s${speakerId}`;

          for (const model of [PRIMARY, FALLBACK]) {
            try {
              const voiceId = await createQwenClonedVoice({
                referenceAudioPath: refPath,
                preferredName: baseName,
                language: parsed.data.sourceLang === "hi" ? undefined : parsed.data.sourceLang,
                model
              });
              speakerClones.push({ speakerId, voiceId, model });
              console.log(`[setup-job] Speaker ${speakerId}: clone enrolled → ${voiceId} (${model})`);
              break;
            } catch (err) {
              if (model === PRIMARY && isQuotaError(err)) continue;
              console.warn(`[setup-job] Speaker ${speakerId}: enrollment failed on ${model}: ${err instanceof Error ? err.message : err}`);
              break;
            }
          }
        } catch (err) {
          console.warn(`[setup-job] Speaker ${speakerId}: ref audio prep failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    const jobState = {
      duration,
      sourceLang: parsed.data.sourceLang ?? undefined,
      targetLang: parsed.data.targetLang,
      voice: parsed.data.voice,
      speakerClones
    };
    await fs.writeFile(
      path.join(outputsDir, `${jobId}-job.json`),
      JSON.stringify(jobState, null, 2),
      "utf8"
    );

    return NextResponse.json({
      jobId,
      duration,
      speakersCloned: speakerClones.length
    });
  } catch (error) {
    console.error("Setup job failed", error);
    const m = error instanceof Error ? error.message : "Setup failed.";
    if (m.includes("ENOENT")) return NextResponse.json({ error: "FFmpeg is not installed or not on PATH." }, { status: 500 });
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
