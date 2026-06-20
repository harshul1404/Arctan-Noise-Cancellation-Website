import { promises as fs, createReadStream } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { assertInside, getUploadMetadata, uploadsDir } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  try {
    const metadata = await getUploadMetadata(params.fileId);
    if (!metadata) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    const localPath = assertInside(uploadsDir, metadata.localPath);
    const stat = await fs.stat(localPath);
    const fileSize = stat.size;

    const baseHeaders: Record<string, string> = {
      "Content-Type": metadata.mimeType,
      "Content-Disposition": `inline; filename="${metadata.originalName}"`,
      "Accept-Ranges": "bytes"
    };

    const range = request.headers.get("range");

    // Honor HTTP range requests so the browser can seek within the video.
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : 0;
        let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        // Clamp to valid bounds.
        if (isNaN(start) || start < 0) start = 0;
        if (isNaN(end) || end >= fileSize) end = fileSize - 1;

        if (start > end || start >= fileSize) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${fileSize}`, "Accept-Ranges": "bytes" }
          });
        }

        const stream = createReadStream(localPath, { start, end });
        return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(end - start + 1)
          }
        });
      }
    }

    // Full content.
    const stream = createReadStream(localPath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: { ...baseHeaders, "Content-Length": String(fileSize) }
    });
  } catch (error) {
    console.error("File read failed", error);
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
