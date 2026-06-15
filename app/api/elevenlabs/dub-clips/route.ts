import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStorageDirs, getUploadMetadata, outputsDir } from "@/lib/storage";
import { trimMediaSegment } from "@/lib/ffmpeg";
import { elStartDubbing } from "@/lib/elevenlabsApi";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  fileId: z.string().min(8),
  clips: z.array(z.object({
    index: z.number().int().min(0),
    start: z.number().min(0),
    end: z.number().positive()
  })).min(2),
  sourceLang: z.string().default("auto"),
  targetLang: z.string().default("en")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const upload = await getUploadMetadata(parsed.data.fileId);
    if (!upload) return NextResponse.json({ error: "Uploaded file not found." }, { status: 404 });

    await ensureStorageDirs();

    const clipJobs: Array<{
      index: number;
      dubbingId: string;
      start: number;
      end: number;
      expectedDurationSec: number;
    }> = [];

    for (const clip of parsed.data.clips) {
      // Trim clip from source video.
      const clipPath = path.join(outputsDir, `el-${parsed.data.fileId}-clip${clip.index}.mp4`);
      await trimMediaSegment(upload.localPath, clipPath, clip.start, clip.end, true);
      console.log(`[el-clips] Trimmed clip ${clip.index}: ${clip.start.toFixed(2)}s–${clip.end.toFixed(2)}s → ${clipPath}`);

      // Submit the trimmed clip to ElevenLabs.
      const { dubbingId, expectedDurationSec } = await elStartDubbing({
        localPath: clipPath,
        filename: `clip-${clip.index}.mp4`,
        mimeType: "video/mp4",
        sourceLang: parsed.data.sourceLang,
        targetLang: parsed.data.targetLang
      });
      console.log(`[el-clips] Clip ${clip.index} → ElevenLabs job ${dubbingId}`);

      // Write meta so the existing status route can mux correctly.
      // Use the trimmed clip as originalPath; skip bg mixing for clips.
      await fs.writeFile(
        path.join(outputsDir, `el-${dubbingId}-meta.json`),
        JSON.stringify({
          fileId: parsed.data.fileId,
          sourceLang: parsed.data.sourceLang,
          targetLang: parsed.data.targetLang,
          hasBgStem: false,
          originalPath: clipPath
        }),
        "utf8"
      );

      clipJobs.push({ index: clip.index, dubbingId, start: clip.start, end: clip.end, expectedDurationSec });
    }

    return NextResponse.json({ clipJobs });
  } catch (error) {
    console.error("[el-clips] Failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Clip dubbing failed." }, { status: 500 });
  }
}
