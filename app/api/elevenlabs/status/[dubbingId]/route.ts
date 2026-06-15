import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { execa } from "execa";
import { outputsDir, publicOutputUrl } from "@/lib/storage";
import { createDubbedVideo, mixBackgroundStemWithDubbedSpeech } from "@/lib/ffmpeg";
import { elGetDubbingStatus, elDownloadDubbedAudio } from "@/lib/elevenlabsApi";

export const runtime = "nodejs";
export const maxDuration = 300;

type Meta = {
  fileId: string;
  sourceLang: string;
  targetLang: string;
  hasBgStem: boolean;
  originalPath: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { dubbingId: string } }
) {
  const { dubbingId } = params;
  const finalFilename = `el-${dubbingId}-final.mp4`;
  const finalPath = path.join(outputsDir, finalFilename);

  // Already finished — return immediately.
  try {
    await fs.access(finalPath);
    return NextResponse.json({
      status: "done",
      videoUrl: publicOutputUrl(finalFilename)
    });
  } catch { /* not done yet */ }

  // Poll ElevenLabs.
  const { status, error } = await elGetDubbingStatus(dubbingId);

  if (status === "failed") {
    return NextResponse.json({ status: "failed", error: error ?? "ElevenLabs dubbing failed." });
  }
  if (status === "dubbing") {
    return NextResponse.json({ status: "dubbing" });
  }

  // status === "dubbed" — download, mix, mux.
  const metaPath = path.join(outputsDir, `el-${dubbingId}-meta.json`);
  let meta: Meta;
  try {
    meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as Meta;
  } catch {
    return NextResponse.json({ status: "failed", error: "Job metadata not found. Please start a new job." }, { status: 404 });
  }

  console.log(`[el-status] Downloading dubbed audio for job ${dubbingId}`);
  const dubbedBuffer = await elDownloadDubbedAudio(dubbingId, meta.targetLang);
  const rawDubbedPath = path.join(outputsDir, `el-${dubbingId}-raw.mp3`);
  await fs.writeFile(rawDubbedPath, dubbedBuffer);

  // Convert dubbed MP3 to 24kHz mono WAV for mixing.
  const dubbedWavPath = path.join(outputsDir, `el-${dubbingId}-dubbed.wav`);
  await execa("ffmpeg", [
    "-y", "-i", rawDubbedPath,
    "-ar", "24000", "-ac", "1", dubbedWavPath
  ]);

  // Mix with background stem if available.
  const mixedPath = path.join(outputsDir, `el-${dubbingId}-mixed.wav`);
  const bgStemPath = path.join(outputsDir, `el-${meta.fileId}-bg.wav`);
  const bgExists = meta.hasBgStem && await fs.access(bgStemPath).then(() => true).catch(() => false);

  if (bgExists) {
    console.log(`[el-status] Mixing background stem for ${dubbingId}`);
    await mixBackgroundStemWithDubbedSpeech(bgStemPath, dubbedWavPath, mixedPath);
  } else {
    await fs.copyFile(dubbedWavPath, mixedPath);
  }

  // Mux mixed audio into the original video container.
  console.log(`[el-status] Muxing final video for ${dubbingId}`);
  await createDubbedVideo(meta.originalPath, mixedPath, finalPath);

  // Clean up intermediate files.
  await Promise.allSettled([
    fs.unlink(rawDubbedPath),
    fs.unlink(dubbedWavPath),
    fs.unlink(mixedPath)
  ]);

  return NextResponse.json({
    status: "done",
    videoUrl: publicOutputUrl(finalFilename)
  });
}
