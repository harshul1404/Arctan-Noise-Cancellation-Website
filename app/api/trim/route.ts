import path from "path";
import { NextResponse } from "next/server";
import { ensureStorageDirs, getUploadMetadata, outputsDir, publicOutputUrl } from "@/lib/storage";
import { getMediaDuration, trimMediaSegment } from "@/lib/ffmpeg";
import { trimRequestSchema, validatePhraseTimings } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

function safeMsg(error: unknown) {
  const m = error instanceof Error ? error.message : String(error);
  if (m.includes("ENOENT")) return "FFmpeg is not installed or not available on PATH.";
  return m || "Trim failed.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trimRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const upload = await getUploadMetadata(parsed.data.fileId);
    if (!upload) return NextResponse.json({ error: "Uploaded file not found." }, { status: 404 });
    const duration = await getMediaDuration(upload.localPath);
    const timingError = validatePhraseTimings(parsed.data.phrases, duration);
    if (timingError) return NextResponse.json({ error: timingError }, { status: 400 });

    await ensureStorageDirs();

    const isVideo = upload.fileType === "video";
    const ext = isVideo ? "mp4" : "wav";

    const clips = await Promise.all(
      parsed.data.phrases.map(async (phrase) => {
        const filename = `${parsed.data.jobId}-clip-${phrase.index}.${ext}`;
        const clipPath = path.join(outputsDir, filename);
        await trimMediaSegment(upload.localPath, clipPath, phrase.start, phrase.end, isVideo);
        return {
          index: phrase.index,
          start: phrase.start,
          end: phrase.end,
          speakerId: phrase.speakerId,
          translatedText: phrase.translatedText,
          clipUrl: publicOutputUrl(filename)
        };
      })
    );

    return NextResponse.json({ clips });
  } catch (error) {
    console.error("Trim failed", error);
    return NextResponse.json({ error: safeMsg(error) }, { status: 500 });
  }
}
