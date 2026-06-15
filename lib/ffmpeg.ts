import { execa } from "execa";
import { parseSilencedetectOutput, SpeechSegment } from "@/lib/audioTimeline";

export async function getMediaDuration(inputPath: string) {
  const { stdout } = await execa("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath
  ]);
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine media duration.");
  }
  return duration;
}

export async function extractAudioToWav(inputPath: string, outputPath: string) {
  try {
    await execa("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "pcm_s16le",
      "-ar",
      "24000",
      "-ac",
      "1",
      outputPath
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      throw new Error("FFmpeg is not installed or is not available on PATH.");
    }
    throw new Error(`FFmpeg failed to extract audio from the video: ${message}`);
  }
}

export async function createReferenceAudio(inputPath: string, outputPath: string, duration = 20) {
  await execa("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-t",
    duration.toFixed(3),
    "-af",
    "highpass=f=80,lowpass=f=12000,volume=1.5",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "24000",
    "-ac",
    "1",
    outputPath
  ]);
}

/**
 * Concatenate multiple time-ranges from a single source file into one WAV.
 * Used to build clean per-speaker reference audio for voice cloning —
 * picking only that speaker's actual speech segments (no silences, no music).
 *
 * @param maxTotalSeconds Stop accumulating once the output would exceed this.
 */
export async function concatenateAudioSegments(
  sourcePath: string,
  timeRanges: Array<{ start: number; end: number }>,
  outputPath: string,
  maxTotalSeconds = 60
): Promise<void> {
  // Filter out very short segments and respect the duration cap.
  const selected: Array<{ start: number; end: number }> = [];
  let total = 0;
  for (const r of timeRanges) {
    const dur = r.end - r.start;
    if (dur < 0.4) continue;
    selected.push(r);
    total += dur;
    if (total >= maxTotalSeconds) break;
  }

  if (selected.length === 0) {
    // Nothing usable — fall back to extracting the first maxTotalSeconds of audio.
    await execa("ffmpeg", [
      "-y", "-i", sourcePath, "-vn", "-t", maxTotalSeconds.toFixed(3),
      "-af", "highpass=f=80,lowpass=f=12000,loudnorm=I=-18:TP=-1.5:LRA=9",
      "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath
    ]);
    return;
  }

  if (selected.length === 1) {
    const r = selected[0];
    await execa("ffmpeg", [
      "-y", "-ss", r.start.toFixed(3), "-t", (r.end - r.start).toFixed(3), "-i", sourcePath,
      "-vn", "-af", "highpass=f=80,lowpass=f=12000,loudnorm=I=-18:TP=-1.5:LRA=9",
      "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath
    ]);
    return;
  }

  // Build a concat filter: each range is a separate -i with -ss/-t seek.
  const args: string[] = ["-y"];
  for (const r of selected) {
    args.push("-ss", r.start.toFixed(3), "-t", (r.end - r.start).toFixed(3), "-i", sourcePath);
  }
  const filterInputs = selected.map((_, i) => `[${i}:a]`).join("");
  args.push(
    "-filter_complex",
    `${filterInputs}concat=n=${selected.length}:v=0:a=1,` +
      `highpass=f=80,lowpass=f=12000,loudnorm=I=-18:TP=-1.5:LRA=9[out]`,
    "-map", "[out]",
    "-vn", "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath
  );
  await execa("ffmpeg", args);
}

export async function createCenterCutBackgroundStem(inputPath: string, outputPath: string) {
  await execa("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-af",
    "pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0,volume=0.7",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "24000",
    "-ac",
    "2",
    outputPath
  ]);
}

export async function mixBackgroundStemWithDubbedSpeech(backgroundPath: string, dubbedSpeechPath: string, outputPath: string) {
  await execa("ffmpeg", [
    "-y",
    "-i",
    backgroundPath,
    "-i",
    dubbedSpeechPath,
    "-filter_complex",
    "[0:a]volume=0.15[bed];[1:a]volume=0.80[voice];[bed][voice]amix=inputs=2:duration=longest:normalize=0:dropout_transition=0,alimiter=limit=0.95[out]",
    "-map",
    "[out]",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "24000",
    outputPath
  ]);
}

export async function detectSilences(inputPath: string) {
  try {
    await execa("ffmpeg", ["-hide_banner", "-i", inputPath, "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-"]);
    return [];
  } catch (error: any) {
    const combined = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    if (error.message?.includes("ENOENT")) {
      throw new Error("FFmpeg is not installed or is not available on PATH.");
    }
    return parseSilencedetectOutput(combined);
  }
}

export async function trimAudioSegment(inputPath: string, outputPath: string, segment: SpeechSegment) {
  await execa("ffmpeg", [
    "-y",
    "-ss",
    segment.start.toFixed(3),
    "-t",
    segment.duration.toFixed(3),
    "-i",
    inputPath,
    "-vn",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "24000",
    "-ac",
    "1",
    outputPath
  ]);
}

export async function fitAudioToDuration(
  inputPath: string,
  outputPath: string,
  targetDuration: number,
  _maxAllowedDuration?: number
) {
  const sourceDuration = await getMediaDuration(inputPath);

  const filters: string[] = [];

  // Speed up dubbed speech if it exceeds the phrase's own duration so it ends
  // at the segment's end timestamp and never bleeds into the next phrase.
  if (sourceDuration > targetDuration + 0.05) {
    const { buildAtempoFilter } = await import("@/lib/audioTimeline");
    const ratio = sourceDuration / targetDuration;
    if (ratio > 1.01) {
      filters.push(buildAtempoFilter(ratio));
    }
  }

  // Pad with silence then hard-trim to the phrase boundary.
  filters.push(
    `apad=pad_dur=${targetDuration.toFixed(3)}`,
    `atrim=0:${targetDuration.toFixed(3)}`,
    `asetpts=N/SR/TB`
  );

  await execa("ffmpeg", ["-y", "-i", inputPath, "-af", filters.join(","), "-ar", "24000", "-ac", "1", outputPath]);
}

export async function getAudioChannels(inputPath: string): Promise<number> {
  try {
    const { stdout } = await execa("ffprobe", [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=channels",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inputPath
    ]);
    const n = Number(stdout.trim());
    return Number.isFinite(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

export async function trimGeneratedSpeech(inputPath: string, outputPath: string) {
  await execa("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-af",
    "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-48dB,loudnorm=I=-18:TP=-1.5:LRA=9",
    "-ar",
    "24000",
    "-ac",
    "1",
    outputPath
  ]);
}

export async function mixSegmentsOnTimeline(
  segmentPaths: Array<{ path: string; start: number; end?: number }>,
  duration: number,
  outputPath: string
) {
  if (segmentPaths.length === 0) {
    throw new Error("No dubbed speech segments were generated.");
  }
  const args = ["-y", "-f", "lavfi", "-t", duration.toFixed(3), "-i", "anullsrc=r=24000:cl=mono"];
  for (const segment of segmentPaths) {
    args.push("-i", segment.path);
  }

  const delayedLabels = segmentPaths.map((segment, index) => {
    const inputIndex = index + 1;
    const delayMs = Math.max(0, Math.round(segment.start * 1000));
    // Hard-cut each segment at its phrase end time so nothing bleeds past the boundary,
    // even if fitAudioToDuration left a rounding remainder.
    const hardCut = segment.end !== undefined
      ? `,atrim=0:${segment.end.toFixed(3)}`
      : "";
    return `[${inputIndex}:a]adelay=${delayMs}:all=1${hardCut}[a${index}]`;
  });
  const mixInputs = ["[0:a]", ...segmentPaths.map((_, index) => `[a${index}]`)].join("");
  // normalize=0: sum inputs at face value; alimiter handles any transient peaks.
  // Without this, amix divides each segment by 1/(N+1), making speech increasingly quiet
  // as the number of phrases grows.
  const filter = `${delayedLabels.join(";")};${mixInputs}amix=inputs=${segmentPaths.length + 1}:duration=first:normalize=0:dropout_transition=0,atrim=0:${duration.toFixed(3)},alimiter=limit=0.95,asetpts=N/SR/TB[out]`;

  await execa("ffmpeg", [...args, "-filter_complex", filter, "-map", "[out]", "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath]);
}

export async function mixOriginalBedWithDubbedSpeech(originalAudioPath: string, dubbedSpeechPath: string, outputPath: string) {
  // normalize=0 prevents amix from attenuating the background differently depending on how many
  // inputs are active — with normalize=1 (default), the background sounds quieter during speech
  // than during silence because amix rescales by 1/N. With normalize=0 we fix levels explicitly.
  // Background at 0.15 + voice at 0.80 = 0.95 max, so alimiter rarely engages and background
  // stays at a near-constant level whether or not speech is playing.
  await execa("ffmpeg", [
    "-y",
    "-i",
    originalAudioPath,
    "-i",
    dubbedSpeechPath,
    "-filter_complex",
    "[0:a]volume=0.15,highpass=f=120,lowpass=f=9000[bed];[1:a]volume=0.80[voice];[bed][voice]amix=inputs=2:duration=longest:normalize=0:dropout_transition=0,alimiter=limit=0.95[out]",
    "-map",
    "[out]",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "24000",
    "-ac",
    "1",
    outputPath
  ]);
}

/** Hard-cut an audio file to exactly `targetDuration` seconds using sample-accurate atrim. */
export async function hardTrimAudio(inputPath: string, outputPath: string, targetDuration: number): Promise<void> {
  const samples = Math.floor(targetDuration * 24000);
  await execa("ffmpeg", [
    "-y", "-i", inputPath,
    "-af", `atrim=end_sample=${samples},asetpts=N/SR/TB`,
    "-ar", "24000", "-ac", "1", outputPath
  ]);
}

export async function trimMediaSegment(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number,
  includeVideo: boolean
): Promise<void> {
  const duration = end - start;
  if (includeVideo) {
    try {
      await execa("ffmpeg", [
        "-y", "-ss", start.toFixed(3), "-t", duration.toFixed(3),
        "-i", inputPath, "-c:v", "copy", "-c:a", "aac", outputPath
      ]);
    } catch {
      await execa("ffmpeg", [
        "-y", "-ss", start.toFixed(3), "-t", duration.toFixed(3),
        "-i", inputPath, "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", outputPath
      ]);
    }
  } else {
    await execa("ffmpeg", [
      "-y", "-ss", start.toFixed(3), "-t", duration.toFixed(3),
      "-i", inputPath, "-vn", "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath
    ]);
  }
}

export async function createDubbedVideo(inputPath: string, audioPath: string, outputPath: string) {
  try {
    await execa("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-i",
      audioPath,
      "-c:v",
      "copy",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-shortest",
      outputPath
    ]);
  } catch (firstError) {
    try {
      await execa("ffmpeg", [
        "-y",
        "-i",
        inputPath,
        "-i",
        audioPath,
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-shortest",
        outputPath
      ]);
    } catch (fallbackError) {
      const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      const firstMessage = firstError instanceof Error ? firstError.message : String(firstError);
      if (message.includes("ENOENT") || firstMessage.includes("ENOENT")) {
        throw new Error("FFmpeg is not installed or is not available on PATH.");
      }
      throw new Error(`FFmpeg failed to create the dubbed video: ${message}`);
    }
  }
}

export async function normalizeVideoTimestamps(inputPath: string, outputPath: string) {
  await execa("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "setpts=PTS-STARTPTS",
    "-af",
    "asetpts=PTS-STARTPTS",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    outputPath
  ]);
}
