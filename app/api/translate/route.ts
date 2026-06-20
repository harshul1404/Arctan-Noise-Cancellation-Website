import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createAlignedDubbedVideo } from "@/lib/alignedDubbing";
import { createElevenLabsDub } from "@/lib/elevenlabs";
import { createDubbedVideo, extractAudioToWav } from "@/lib/ffmpeg";
import { translateWithQwen } from "@/lib/qwen";
import { getUploadMetadata, outputPath, publicOutputUrl } from "@/lib/storage";
import { translateRequestSchema, validateTranslateOptions } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 300;

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
  if (message.includes("DASHSCOPE_API_KEY")) return "Missing API key. Set DASHSCOPE_API_KEY on the server.";
  if (message.includes("ELEVENLABS_API_KEY")) return "Missing ElevenLabs API key. Set ELEVENLABS_API_KEY on the server.";
  if (message.includes("ElevenLabs API error")) return message;
  if (message.includes("ElevenLabs dubbing")) return message;
  if (status === 401 || code === "invalid_api_key" || message.toLowerCase().includes("incorrect api key")) {
    return "Alibaba rejected the API key. Check DASHSCOPE_API_KEY, rotate it if needed, and make sure it belongs to the endpoint region you are using.";
  }
  if (message.includes("FFmpeg")) return message;
  if (message.includes("Streaming interrupted")) return message;
  if (message.includes("free tier") || message.includes("Voice cloning") || message.includes("Cloned voice")) return message;
  if (message.toLowerCase().includes("api")) return "Alibaba API error. Check the server logs for details.";
  return message || "Translation failed.";
}

function useProductionDubbingProvider() {
  return process.env.DUBBING_PROVIDER?.toLowerCase() === "elevenlabs";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = translateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
    }
    const validationError = validateTranslateOptions(parsed.data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const upload = await getUploadMetadata(parsed.data.fileId);
    if (!upload) {
      return NextResponse.json({ error: "Uploaded file was not found." }, { status: 404 });
    }
    if (upload.fileType !== parsed.data.fileType) {
      return NextResponse.json({ error: "Uploaded file type does not match the request." }, { status: 400 });
    }

    if (upload.fileType === "video" && parsed.data.outputMode === "text_audio_video" && useProductionDubbingProvider()) {
      const dub = await createElevenLabsDub({
        upload,
        sourceLang: parsed.data.sourceLang,
        targetLang: parsed.data.targetLang
      });
      return NextResponse.json(dub);
    }

    if (upload.fileType === "video" && parsed.data.outputMode === "text_audio_video") {
      const aligned = await createAlignedDubbedVideo({
        upload,
        sourceLang: parsed.data.sourceLang,
        targetLang: parsed.data.targetLang,
        voice: parsed.data.voice ?? "Cherry"
      });
      return NextResponse.json(aligned);
    }

    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const shouldUseLocalAudioFallback =
      upload.fileType === "video" &&
      (!publicBaseUrl || /localhost|127\.0\.0\.1|\[::1\]/.test(publicBaseUrl));
    const extractedAudioFilename = shouldUseLocalAudioFallback ? `${nanoid(16)}-source.wav` : undefined;
    const extractedAudioPath = extractedAudioFilename ? outputPath(extractedAudioFilename) : undefined;
    if (extractedAudioPath) {
      await extractAudioToWav(upload.localPath, extractedAudioPath);
    }

    const result = await translateWithQwen({
      upload,
      inputAudioPath: extractedAudioPath,
      inputAudioFormat: extractedAudioPath ? "wav" : undefined,
      publicFileUrl: publicBaseUrl && !shouldUseLocalAudioFallback ? `${publicBaseUrl}/api/files/${upload.fileId}` : undefined,
      sourceLang: parsed.data.sourceLang,
      targetLang: parsed.data.targetLang,
      outputMode: parsed.data.outputMode,
      voice: parsed.data.voice
    });

    let videoUrl: string | undefined;
    if (parsed.data.outputMode === "text_audio_video") {
      if (!result.audioFilename) {
        return NextResponse.json({ error: "Audio generation is required before video muxing." }, { status: 500 });
      }
      await fs.access(upload.localPath);
      const videoFilename = `${result.jobId}.mp4`;
      await createDubbedVideo(upload.localPath, outputPath(result.audioFilename), outputPath(videoFilename));
      videoUrl = publicOutputUrl(videoFilename);
    }

    return NextResponse.json({
      jobId: result.jobId,
      transcript: result.transcript,
      audioUrl: result.audioUrl,
      videoUrl,
      usage: result.usage
    });
  } catch (error) {
    console.error("Translation failed", error);
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
  }
}
