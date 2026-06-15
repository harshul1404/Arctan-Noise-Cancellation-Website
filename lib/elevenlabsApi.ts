import { promises as fs } from "fs";

const EL_BASE = "https://api.elevenlabs.io/v1";

function elKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Missing ELEVENLABS_API_KEY in environment.");
  return key;
}

export async function elStartDubbing(params: {
  localPath: string;
  filename: string;
  mimeType: string;
  sourceLang: string; // "auto" or ISO-639-1 code
  targetLang: string; // e.g. "en"
}): Promise<{ dubbingId: string; expectedDurationSec: number }> {
  const fileBuffer = await fs.readFile(params.localPath);
  const blob = new Blob([fileBuffer], { type: params.mimeType || "video/mp4" });

  const form = new FormData();
  form.append("file", blob, params.filename);
  form.append("target_lang", params.targetLang);
  if (params.sourceLang && params.sourceLang !== "auto") {
    form.append("source_lang", params.sourceLang);
  }
  form.append("num_speakers", "0");   // auto-detect speakers
  form.append("watermark", "false");
  form.append("highest_resolution", "true");

  const res = await fetch(`${EL_BASE}/dubbing`, {
    method: "POST",
    headers: { "xi-api-key": elKey() },
    body: form as any
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs dubbing start failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { dubbing_id: string; expected_duration_sec: number };
  return { dubbingId: data.dubbing_id, expectedDurationSec: data.expected_duration_sec };
}

export async function elGetDubbingStatus(dubbingId: string): Promise<{
  status: "dubbing" | "dubbed" | "failed";
  error?: string;
}> {
  const res = await fetch(`${EL_BASE}/dubbing/${dubbingId}`, {
    headers: { "xi-api-key": elKey() }
  });
  if (!res.ok) throw new Error(`ElevenLabs status check failed (${res.status}): ${await res.text()}`);
  const data = await res.json() as { status: string; error?: string };
  return { status: data.status as "dubbing" | "dubbed" | "failed", error: data.error };
}

export async function elDownloadDubbedAudio(dubbingId: string, langCode: string): Promise<Buffer> {
  const res = await fetch(`${EL_BASE}/dubbing/${dubbingId}/audio/${langCode}`, {
    headers: { "xi-api-key": elKey() }
  });
  if (!res.ok) throw new Error(`ElevenLabs audio download failed (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function elDeleteDubbing(dubbingId: string): Promise<void> {
  await fetch(`${EL_BASE}/dubbing/${dubbingId}`, {
    method: "DELETE",
    headers: { "xi-api-key": elKey() }
  });
}
