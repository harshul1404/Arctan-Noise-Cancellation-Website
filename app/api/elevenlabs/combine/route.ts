import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { execa } from "execa";
import { z } from "zod";
import { outputsDir, publicOutputUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  clipJobs: z.array(z.object({
    index: z.number().int().min(0),
    dubbingId: z.string()
  })).min(2)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    // Sort clips by original index.
    const sorted = [...parsed.data.clipJobs].sort((a, b) => a.index - b.index);

    // Verify every clip output file exists.
    const clipPaths: string[] = [];
    for (const job of sorted) {
      const p = path.join(outputsDir, `el-${job.dubbingId}-final.mp4`);
      try {
        await fs.access(p);
        clipPaths.push(p);
      } catch {
        return NextResponse.json(
          { error: `Clip ${job.index} is not ready yet. Wait for all clips to finish dubbing.` },
          { status: 400 }
        );
      }
    }

    // Write an FFmpeg concat list.
    const id = nanoid(12);
    const listPath = path.join(outputsDir, `el-list-${id}.txt`);
    const outputFilename = `el-combined-${id}.mp4`;
    const outputPath = path.join(outputsDir, outputFilename);

    await fs.writeFile(listPath, clipPaths.map(p => `file '${p}'`).join("\n"), "utf8");

    try {
      await execa("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]);
    } finally {
      await fs.unlink(listPath).catch(() => {});
    }

    console.log(`[el-combine] Joined ${sorted.length} clips → ${outputFilename}`);
    return NextResponse.json({ videoUrl: publicOutputUrl(outputFilename) });
  } catch (error) {
    console.error("[el-combine] Failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Combine failed." }, { status: 500 });
  }
}
