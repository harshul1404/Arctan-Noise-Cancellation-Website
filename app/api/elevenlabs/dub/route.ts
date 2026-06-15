import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStorageDirs, getUploadMetadata, outputsDir } from "@/lib/storage";
import { createCenterCutBackgroundStem, getAudioChannels } from "@/lib/ffmpeg";
import { elStartDubbing } from "@/lib/elevenlabsApi";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  fileId: z.string().min(8),
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

    // Extract background music stem via FFmpeg center-cut (stereo only).
    const channels = await getAudioChannels(upload.localPath);
    const hasBgStem = channels >= 2;
    if (hasBgStem) {
      const bgStemPath = path.join(outputsDir, `el-${parsed.data.fileId}-bg.wav`);
      await createCenterCutBackgroundStem(upload.localPath, bgStemPath);
      console.log(`[el-dub] Extracted background stem for ${parsed.data.fileId} (${channels}ch)`);
    } else {
      console.log(`[el-dub] Mono audio — skipping center-cut background extraction`);
    }

    // Submit full video to ElevenLabs Dubbing API.
    const { dubbingId, expectedDurationSec } = await elStartDubbing({
      localPath: upload.localPath,
      filename: upload.originalName,
      mimeType: upload.mimeType,
      sourceLang: parsed.data.sourceLang,
      targetLang: parsed.data.targetLang
    });

    console.log(`[el-dub] Job ${dubbingId} submitted — expected ${expectedDurationSec}s`);

    // Persist job metadata for the status/finish endpoint.
    await fs.writeFile(
      path.join(outputsDir, `el-${dubbingId}-meta.json`),
      JSON.stringify({
        fileId: parsed.data.fileId,
        sourceLang: parsed.data.sourceLang,
        targetLang: parsed.data.targetLang,
        hasBgStem,
        originalPath: upload.localPath
      }),
      "utf8"
    );

    return NextResponse.json({ dubbingId, expectedDurationSec });
  } catch (error) {
    console.error("[el-dub] Failed:", error);
    const m = error instanceof Error ? error.message : "Dubbing failed.";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
