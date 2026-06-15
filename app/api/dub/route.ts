import { NextResponse } from "next/server";
import { dubFromTranscript } from "@/lib/alignedDubbing";
import { getUploadMetadata } from "@/lib/storage";
import { dubRequestSchema, validatePhraseTimings } from "@/lib/validation";
import { getMediaDuration } from "@/lib/ffmpeg";

export const runtime = "nodejs";
export const maxDuration = 300;

function safeMsg(error: unknown) {
  const m = error instanceof Error ? error.message : String(error);
  if (m.includes("DASHSCOPE_API_KEY")) return "Missing API key. Set DASHSCOPE_API_KEY.";
  if (m.includes("free tier") || m.includes("quota")) return m;
  if (m.includes("Job") && m.includes("not found")) return m;
  return m || "Dubbing failed.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = dubRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const upload = await getUploadMetadata(parsed.data.fileId);
    if (!upload) return NextResponse.json({ error: "Uploaded file not found." }, { status: 404 });
    const duration = await getMediaDuration(upload.localPath);
    const timingError = validatePhraseTimings(parsed.data.phrases, duration);
    if (timingError) return NextResponse.json({ error: timingError }, { status: 400 });

    const { transcript, audioUrl, videoUrl, timingChecks } = await dubFromTranscript({
      jobId: parsed.data.jobId,
      upload,
      phrases: parsed.data.phrases
    });

    return NextResponse.json({ transcript, audioUrl, videoUrl, timingChecks });
  } catch (error) {
    console.error("Dubbing failed", error);
    return NextResponse.json({ error: safeMsg(error) }, { status: 500 });
  }
}
