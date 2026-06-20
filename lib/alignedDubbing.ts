import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { SpeechSegment } from "@/lib/audioTimeline";
import {
  concatenateAudioSegments,
  createDubbedVideo,
  createCenterCutBackgroundStem,
  extractAudioToWav,
  fitAudioToDuration,
  getAudioChannels,
  getMediaDuration,
  hardTrimAudio,
  mixBackgroundStemWithDubbedSpeech,
  mixOriginalBedWithDubbedSpeech,
  mixSegmentsOnTimeline,
  trimGeneratedSpeech,
  trimAudioSegment
} from "@/lib/ffmpeg";
import { transcribeWithDeepgram } from "@/lib/deepgramAsr";
import { transcribeWithQwenFileAsr, QwenAsrSentence, QwenAsrResult } from "@/lib/qwenAsr";
import { translateAudioFileWithQwen, translateTextWithQwen } from "@/lib/qwen";
import { compatibleVoices } from "@/lib/languages";
import { createQwenClonedVoice, langTypeForCode, synthesizeWithQwenClonedVoice } from "@/lib/qwenVoiceClone";
import { outputPath, publicOutputUrl, UploadMetadata } from "@/lib/storage";

export type AlignedDubbingInput = {
  upload: UploadMetadata;
  sourceLang?: string;
  targetLang: string;
  voice: string; // default preset voice (used as fallback)
};

/** One translated phrase that the user can edit before dubbing. */
export type TranscriptPhrase = {
  index: number;
  start: number;        // seconds in source video
  end: number;          // seconds in source video
  speakerId: string;
  translatedText: string;
};

type JobState = {
  duration: number;
  sourceLang?: string;
  targetLang: string;
  voice: string;
  speakerClones: Array<{ speakerId: string; voiceId: string; model: string }>;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createAlignedDubbedVideo(input: AlignedDubbingInput) {
  const jobId = nanoid(16);
  const workDir = outputPath(`${jobId}-segments`);
  await fs.mkdir(workDir, { recursive: true });

  // ── 1. Extract source audio ────────────────────────────────────────────
  const sourceAudioPath = path.join(workDir, "source.wav");
  await extractAudioToWav(input.upload.localPath, sourceAudioPath);
  const duration = await getMediaDuration(input.upload.localPath);

  // ── 2. ASR source audio (diarization + punctuation + ITN enabled) ──────
  const sourceAudioFilename = `${jobId}-source.wav`;
  await fs.copyFile(sourceAudioPath, outputPath(sourceAudioFilename));
  const sourceAsr = await loadOrCreateSourceAsr(
    input.upload.fileId,
    publicAbsoluteUrl(publicOutputUrl(sourceAudioFilename)),
    sourceAudioPath,
    input.sourceLang
  );

  // Build phrase segments; preserve speakerId from ASR.
  const segments = mergeAdjacentSegmentsForCompleteness(buildSegmentsFromAsrSentences(sourceAsr.sentences, duration));
  if (segments.length === 0) {
    throw new Error("Qwen ASR did not return any speech phrases for this video.");
  }

  const uniqueSpeakers = sourceAsr.speakers; // ordered by first appearance
  console.log(`[aligned-dubbing] Detected ${uniqueSpeakers.length} speaker(s): ${uniqueSpeakers.join(", ")}`);

  // ── 3. Build per-speaker voice map ────────────────────────────────────
  // speakerVoiceMap : speakerId → preset voice name (fallback when no clone)
  // speakerCloneMap : speakerId → { voiceId, model } (voice ID is model-specific)
  const speakerVoiceMap = buildPresetVoiceMap(uniqueSpeakers, input.targetLang, input.voice);
  const speakerCloneMap = new Map<string, { voiceId: string; model: string }>();

  const PRIMARY_VC_MODEL = process.env.QWEN_TTS_VC_MODEL || "qwen3-tts-vc-2026-01-22";
  const FALLBACK_VC_MODEL = process.env.QWEN_TTS_VC_FALLBACK_MODEL || "qwen3-tts-vc-realtime-2026-01-15";

  if (process.env.QWEN_VOICE_CLONING === "true") {
    for (const speakerId of uniqueSpeakers) {
      const speakerRefPath = path.join(workDir, `speaker-${speakerId}-ref.wav`);
      const speakerRanges = sourceAsr.sentences
        .filter((s) => (s.speakerId ?? "0") === speakerId)
        .map((s) => ({ start: s.start, end: s.end }));

      await concatenateAudioSegments(sourceAudioPath, speakerRanges, speakerRefPath, 60);

      const baseName = `spk${jobId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}s${speakerId}`;

      let enrolled = false;
      for (const model of [PRIMARY_VC_MODEL, FALLBACK_VC_MODEL]) {
        try {
          const clonedVoice = await createQwenClonedVoice({
            referenceAudioPath: speakerRefPath,
            preferredName: baseName,
            language: input.sourceLang === "hi" ? undefined : input.sourceLang,
            model
          });
          speakerCloneMap.set(speakerId, { voiceId: clonedVoice, model });
          console.log(`[aligned-dubbing] Speaker ${speakerId}: voice clone ready → ${clonedVoice} (model: ${model})`);
          enrolled = true;
          break;
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          if (model === PRIMARY_VC_MODEL && isQuotaError(err)) {
            console.warn(
              `[aligned-dubbing] Speaker ${speakerId}: primary VC model quota exhausted, ` +
                `retrying with fallback model "${FALLBACK_VC_MODEL}".`
            );
            continue; // try fallback model
          }
          console.warn(
            `[aligned-dubbing] Speaker ${speakerId}: voice cloning failed on model "${model}", ` +
              `using preset voice "${speakerVoiceMap.get(speakerId)}". Reason: ${reason}`
          );
          break;
        }
      }
      if (!enrolled) {
        console.warn(`[aligned-dubbing] Speaker ${speakerId}: no voice clone available — will use preset voice.`);
      }
    }
  }

  // ── 4. Translate and dub each phrase ──────────────────────────────────
  const fittedSegments: Array<{ path: string; start: number; end?: number }> = [];
  const transcriptParts: string[] = [];
  const usages: unknown[] = [];
  const langType = langTypeForCode(input.targetLang);

  for (let i = 0; i < segments.length; i++) {
    let segment = segments[i];
    const sid = segment.speakerId ?? "0";

    const segmentInputPath = path.join(workDir, `segment-${segment.index}-source.wav`);
    const segmentDubPath = path.join(workDir, `segment-${segment.index}-dub.wav`);
    const segmentTrimmedDubPath = path.join(workDir, `segment-${segment.index}-dub-trimmed.wav`);
    const segmentFitPath = path.join(workDir, `segment-${segment.index}-fit.wav`);

    // Translate with this speaker's assigned preset voice.
    const presetVoice = speakerVoiceMap.get(sid) ?? input.voice;
    console.log(
      `[aligned-dubbing] Segment ${segment.index + 1}/${segments.length} ` +
        `[${formatTimestamp(segment.start)}-${formatTimestamp(segment.end)}] ` +
        `Speaker ${sid} — translating…`
    );
    let translated = await translateSegmentTextFirst(sourceAudioPath, segmentInputPath, segment, input, presetVoice);
    let translatedText = translated.transcript.trim();

    let mergeCount = 0;
    while (
      isProbablyIncompleteTranslation(translatedText) &&
      canMergeWithNextSegment(segment, segments[i + 1], duration) &&
      mergeCount < 2
    ) {
      const next = segments[i + 1];
      segment = {
        ...segment,
        end: next.end,
        duration: next.end - segment.start,
        sourceText: joinSourceText(segment.sourceText, next.sourceText)
      };
      i += 1;
      mergeCount += 1;
      console.warn(
        `[aligned-dubbing] Segment ${segment.index + 1}: translation looked incomplete; ` +
          `merged with following phrase and retried.`
      );
      translated = await translateSegmentTextFirst(sourceAudioPath, segmentInputPath, segment, input, presetVoice);
      translatedText = translated.transcript.trim();
    }

    if (!translatedText) {
      // Skip completely silent/music-only phrases rather than failing the whole job.
      console.warn(
        `[aligned-dubbing] Segment ${segment.index + 1} (${formatTimestamp(segment.start)}-${formatTimestamp(segment.end)}): ` +
          `empty translation — skipping.`
      );
      continue;
    }
    if (isProbablyIncompleteTranslation(translatedText)) {
      const fallbackText = await recoverIncompleteTranslation(segment, input);
      if (fallbackText) {
        console.warn(
          `[aligned-dubbing] Segment ${segment.index + 1}: LiveTranslate text looked incomplete; ` +
            `using Qwen text translation fallback.`
        );
        translatedText = fallbackText.transcript;
        if (fallbackText.usage) usages.push(fallbackText.usage);
      }
    }
    if (isProbablyIncompleteTranslation(translatedText)) {
      throw new Error(
        `Translation completeness check failed for phrase ${segment.index + 1}: "${translatedText}". ` +
          "The output was not returned because Qwen produced an incomplete translated line."
      );
    }

    // Silence window: allow dubbed speech to expand into trailing silence before
    // the next phrase, capped at 80% of the gap so phrases don't bleed together.
    const nextStart = segments[i + 1]?.start ?? duration;
    const silenceGap = nextStart - segment.end;
    const maxAllowedDuration = segment.duration + Math.max(0, silenceGap * 0.8);

    // If we have a clone for this speaker, re-synthesize with it.
    // speakerCloneMap stores { voiceId, model } — voice IDs are model-specific.
    const cloneEntry = speakerCloneMap.get(sid);
    let synthesizedAudio: Buffer;
    if (cloneEntry) {
      synthesizedAudio = await synthesizeWithCloneFallback(
        translatedText,
        cloneEntry,
        sid,
        segment.index,
        langType,
        speakerRefPathFor(workDir, sid),
        input.sourceLang,
        sourceAsr,
        sourceAudioPath,
        speakerCloneMap,
        FALLBACK_VC_MODEL,
        translated.audio
      );
    } else {
      synthesizedAudio = translated.audio;
    }

    // Qwen may return no audio for music/noise/very-short segments.  When the
    // primary audio is empty but we have a clone, attempt TTS re-synthesis.
    // Otherwise skip this segment rather than writing a corrupt file.
    if (synthesizedAudio.length === 0) {
      if (cloneEntry) {
        try {
          synthesizedAudio = await synthesizeWithQwenClonedVoice({
            text: translatedText,
            voice: cloneEntry.voiceId,
            model: cloneEntry.model,
            languageType: langType
          });
          console.log(`[aligned-dubbing] Segment ${segment.index + 1}: recovered from no-audio via voice-clone TTS.`);
        } catch (err) {
          console.warn(
            `[aligned-dubbing] Segment ${segment.index + 1}: no audio from Qwen and TTS fallback failed — skipping. ` +
              `Reason: ${err instanceof Error ? err.message : err}`
          );
          continue;
        }
      } else {
        console.warn(
          `[aligned-dubbing] Segment ${segment.index + 1}: Qwen returned no audio and no voice clone available — skipping.`
        );
        continue;
      }
    }

    await fs.writeFile(segmentDubPath, synthesizedAudio);
    // Remove leading/trailing silence and normalise loudness.
    await trimGeneratedSpeech(segmentDubPath, segmentTrimmedDubPath);
    const rawDubDuration = await getMediaDuration(segmentDubPath);
    // `silenceremove` can strip an entire low-amplitude segment to zero bytes.
    // Guard with try/catch so a single bad segment does not kill the whole job.
    let trimmedDubDuration = 0;
    try {
      trimmedDubDuration = await getMediaDuration(segmentTrimmedDubPath);
    } catch {
      trimmedDubDuration = 0;
    }
    // Fall back to untrimmed when: zero result OR too much removed from longer speech.
    if (trimmedDubDuration < 0.1 || (rawDubDuration > 1 && trimmedDubDuration < rawDubDuration * 0.75)) {
      console.warn(
        `[aligned-dubbing] Segment ${segment.index + 1}: trim left ${trimmedDubDuration.toFixed(2)}s ` +
          `from ${rawDubDuration.toFixed(2)}s; reverting to untrimmed speech.`
      );
      await fs.copyFile(segmentDubPath, segmentTrimmedDubPath);
    }
    // Fit into the available silence window (gentle compression ≤1.35×, no hard cut).
    await fitAudioToDuration(segmentTrimmedDubPath, segmentFitPath, segment.duration, maxAllowedDuration);

    fittedSegments.push({ path: segmentFitPath, start: segment.start, end: segment.end });
    transcriptParts.push(
      `[${formatTimestamp(segment.start)} - ${formatTimestamp(segment.end)}] ` +
        `Speaker ${sid} | Phrase ${segment.index + 1}: ${translatedText}`
    );
    if (translated.usage) usages.push(translated.usage);
  }

  if (fittedSegments.length === 0) {
    throw new Error("No speech segments could be translated.");
  }

  // ── 5. Mix timeline + background ──────────────────────────────────────
  const audioFilename = `${jobId}.wav`;
  const videoFilename = `${jobId}.mp4`;
  const speechOnlyPath = path.join(workDir, "dubbed-speech-only.wav");
  await mixSegmentsOnTimeline(fittedSegments, duration, speechOnlyPath);
  await blendBackground(
    input.upload.localPath,
    sourceAudioPath,
    speechOnlyPath,
    workDir,
    outputPath(audioFilename)
  );

  // ── 6. ASR QC on dubbed audio (non-fatal) ─────────────────────────────
  let verification: ReturnType<typeof verifyPhraseTiming> | undefined;
  try {
    const dubbedAsr =
      process.env.DEEPGRAM_API_KEY
        ? await transcribeWithDeepgram({ localAudioPath: outputPath(audioFilename), language: input.targetLang })
        : await transcribeWithQwenFileAsr({
            fileUrl: publicAbsoluteUrl(publicOutputUrl(audioFilename)),
            language: input.targetLang
          });
    verification = verifyPhraseTiming(segments, dubbedAsr.sentences);
    if (!verification.ok) {
      console.warn(
        `[aligned-dubbing] ASR QC: ${verification.matched}/${verification.checkedPhrases} phrases verified ` +
          `within ±${verification.toleranceSeconds}s. Unmatched: ${verification.failures.slice(0, 5).join("; ")}`
      );
    } else {
      console.log(`[aligned-dubbing] ASR QC passed: ${verification.matched}/${verification.checkedPhrases} phrases.`);
    }
  } catch (err) {
    console.warn("[aligned-dubbing] Dubbed-audio ASR QC failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  // ── 7. Mux dubbed audio into video ────────────────────────────────────
  await createDubbedVideo(input.upload.localPath, outputPath(audioFilename), outputPath(videoFilename));

  return {
    jobId,
    transcript: transcriptParts.join("\n\n"),
    audioUrl: publicOutputUrl(audioFilename),
    videoUrl: publicOutputUrl(videoFilename),
    usage: {
      provider: "qwen",
      speakers: uniqueSpeakers.length,
      cloningEnabled: process.env.QWEN_VOICE_CLONING === "true",
      cloningSucceeded: uniqueSpeakers.filter((id) => speakerCloneMap.has(id)).length,
      backgroundMode: process.env.QWEN_BACKGROUND_MODE || "none",
      segments: segments.length,
      timingVerification: verification,
      segmentUsage: usages
    }
  };
}

// ---------------------------------------------------------------------------
// Two-step workflow: Step 1 — transcribe + translate (text only, no synthesis)
// ---------------------------------------------------------------------------

export async function transcribeAndTranslate(input: AlignedDubbingInput): Promise<{
  jobId: string;
  phrases: TranscriptPhrase[];
  speakers: string[];
  duration: number;
}> {
  const jobId = nanoid(16);
  const workDir = outputPath(`${jobId}-segments`);
  await fs.mkdir(workDir, { recursive: true });

  const sourceAudioPath = path.join(workDir, "source.wav");
  await extractAudioToWav(input.upload.localPath, sourceAudioPath);
  const duration = await getMediaDuration(input.upload.localPath);

  const sourceAudioFilename = `${jobId}-source.wav`;
  await fs.copyFile(sourceAudioPath, outputPath(sourceAudioFilename));
  const sourceAsr = await loadOrCreateSourceAsr(
    input.upload.fileId,
    publicAbsoluteUrl(publicOutputUrl(sourceAudioFilename)),
    sourceAudioPath,
    input.sourceLang
  );

  const segments = mergeAdjacentSegmentsForCompleteness(buildSegmentsFromAsrSentences(sourceAsr.sentences, duration));
  if (segments.length === 0) throw new Error("No speech phrases detected in this video.");

  const uniqueSpeakers = sourceAsr.speakers;
  const speakerVoiceMap = buildPresetVoiceMap(uniqueSpeakers, input.targetLang, input.voice);

  // Voice-clone enrollment happens here so step 2 only needs synthesis.
  const PRIMARY_VC_MODEL = process.env.QWEN_TTS_VC_MODEL || "qwen3-tts-vc-2026-01-22";
  const FALLBACK_VC_MODEL = process.env.QWEN_TTS_VC_FALLBACK_MODEL || "qwen3-tts-vc-realtime-2026-01-15";
  const speakerCloneMap = new Map<string, { voiceId: string; model: string }>();

  if (process.env.QWEN_VOICE_CLONING === "true") {
    for (const speakerId of uniqueSpeakers) {
      const refPath = path.join(workDir, `speaker-${speakerId}-ref.wav`);
      const ranges = sourceAsr.sentences
        .filter((s) => (s.speakerId ?? "0") === speakerId)
        .map((s) => ({ start: s.start, end: s.end }));
      try {
        await concatenateAudioSegments(sourceAudioPath, ranges, refPath, 60);
        for (const model of [PRIMARY_VC_MODEL, FALLBACK_VC_MODEL]) {
          try {
            const voiceId = await createQwenClonedVoice({
              referenceAudioPath: refPath,
              preferredName: `spk${jobId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}s${speakerId}`,
              language: input.sourceLang === "hi" ? undefined : input.sourceLang,
              model
            });
            speakerCloneMap.set(speakerId, { voiceId, model });
            console.log(`[step1] Speaker ${speakerId}: clone enrolled → ${voiceId} (${model})`);
            break;
          } catch (err) {
            if (model === PRIMARY_VC_MODEL && isQuotaError(err)) { continue; }
            console.warn(`[step1] Speaker ${speakerId}: enrollment failed on "${model}": ${err instanceof Error ? err.message : err}`);
            break;
          }
        }
      } catch (err) {
        console.warn(`[step1] Speaker ${speakerId}: ref audio prep failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // Translate each segment — save audio to disk so step 2 can reuse it.
  const phrases: TranscriptPhrase[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const sid = segment.speakerId ?? "0";
    const presetVoice = speakerVoiceMap.get(sid) ?? input.voice;
    const segInputPath = path.join(workDir, `segment-${segment.index}-source.wav`);
    const segXlatedPath = path.join(workDir, `segment-${segment.index}-translated.wav`);

    console.log(
      `[step1] Segment ${i + 1}/${segments.length} [${formatTimestamp(segment.start)}-${formatTimestamp(segment.end)}] translating…`
    );
    try {
      const translated = await translateSegmentTextFirst(sourceAudioPath, segInputPath, segment, input, presetVoice);
      const text = translated.transcript.trim();
      if (!text) { console.warn(`[step1] Segment ${i + 1}: empty translation — skipped.`); continue; }
      if (isProbablyIncompleteTranslation(text)) {
        throw new Error(`Qwen produced an incomplete translation for phrase ${i + 1}: "${text}"`);
      }
      if (translated.audio.length > 0) await fs.writeFile(segXlatedPath, translated.audio);
      phrases.push({ index: phrases.length, start: segment.start, end: segment.end, speakerId: sid, translatedText: text });
    } catch (err) {
      console.warn(`[step1] Segment ${i + 1}: translation error — skipped. ${err instanceof Error ? err.message : err}`);
    }
  }

  if (phrases.length === 0) throw new Error("Translation produced no output for any speech segment.");

  const jobState: JobState = {
    duration,
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    voice: input.voice,
    speakerClones: Array.from(speakerCloneMap.entries()).map(([speakerId, c]) => ({ speakerId, ...c }))
  };
  await fs.writeFile(outputPath(`${jobId}-job.json`), JSON.stringify(jobState, null, 2), "utf8");
  return { jobId, phrases, speakers: uniqueSpeakers, duration };
}

// ---------------------------------------------------------------------------
// Two-step workflow: Step 2 — dub from (possibly edited) transcript
// ---------------------------------------------------------------------------

export type SegmentTimingCheck = {
  phraseIndex: number;
  start: number;
  end: number;
  targetDuration: number;
  actualDuration: number;
  forceTrimmed: boolean;
};

export async function dubFromTranscript(input: {
  jobId: string;
  upload: UploadMetadata;
  phrases: TranscriptPhrase[];
}): Promise<{ transcript: string; audioUrl: string; videoUrl: string; timingChecks: SegmentTimingCheck[] }> {
  const workDir = outputPath(`${input.jobId}-segments`);
  const sourceAudioPath = path.join(workDir, "source.wav");

  let jobState: JobState;
  try {
    jobState = JSON.parse(await fs.readFile(outputPath(`${input.jobId}-job.json`), "utf8")) as JobState;
  } catch {
    throw new Error(`Job ${input.jobId} not found. Please run "Generate Translated Transcript" again.`);
  }

  const { duration, sourceLang, targetLang, voice } = jobState;
  const langType = langTypeForCode(targetLang);
  const FALLBACK_VC_MODEL = process.env.QWEN_TTS_VC_FALLBACK_MODEL || "qwen3-tts-vc-realtime-2026-01-15";
  const speakerCloneMap = new Map<string, { voiceId: string; model: string }>(
    jobState.speakerClones.map((c) => [c.speakerId, { voiceId: c.voiceId, model: c.model }])
  );

  const fittedSegments: Array<{ path: string; start: number; end?: number }> = [];
  const transcriptParts: string[] = [];
  const timingChecks: SegmentTimingCheck[] = [];

  for (const phrase of input.phrases) {
    if (!phrase.translatedText.trim()) continue;

    const segment: SpeechSegment = {
      index: phrase.index, start: phrase.start, end: phrase.end,
      duration: phrase.end - phrase.start, speakerId: phrase.speakerId
    };
    const segDubPath = path.join(workDir, `segment-${phrase.index}-dub2.wav`);
    const segTrimPath = path.join(workDir, `segment-${phrase.index}-dub2-trimmed.wav`);
    const segFitPath = path.join(workDir, `segment-${phrase.index}-fit2.wav`);
    const segCachedPath = path.join(workDir, `segment-${phrase.index}-translated.wav`);

    const sortedPhrases = [...input.phrases].sort((a, b) => a.start - b.start);
    const posInSorted = sortedPhrases.findIndex((p) => p.index === phrase.index);
    const nextStart = sortedPhrases[posInSorted + 1]?.start ?? duration;
    const maxAllowedDuration = segment.duration + Math.max(0, (nextStart - phrase.end) * 0.8);

    const cloneEntry = speakerCloneMap.get(phrase.speakerId);
    let synthesizedAudio: Buffer | null = null;

    // 1. Try voice-clone synthesis (uses the user's edited text).
    if (cloneEntry) {
      synthesizedAudio = await synthesizeWithCloneFallback(
        phrase.translatedText, cloneEntry, phrase.speakerId, phrase.index, langType,
        speakerRefPathFor(workDir, phrase.speakerId), sourceLang,
        { sentences: [] } as any, sourceAudioPath,
        speakerCloneMap, FALLBACK_VC_MODEL, Buffer.alloc(0)
      );
      if (synthesizedAudio.length === 0) synthesizedAudio = null;
    }

    // 2. Fall back to audio cached from step 1 (unchanged translation).
    if (!synthesizedAudio) {
      try { synthesizedAudio = await fs.readFile(segCachedPath); } catch { /* miss */ }
    }

    // 3. Last resort: re-translate the segment audio.
    //    For user-added phrases the source file won't exist yet — trim it first.
    if (!synthesizedAudio || synthesizedAudio.length === 0) {
      const segSrcPath = path.join(workDir, `segment-${phrase.index}-source.wav`);
      const srcExists = await fs.access(segSrcPath).then(() => true).catch(() => false);
      if (!srcExists) {
        try { await trimAudioSegment(sourceAudioPath, segSrcPath, segment); } catch { /* best-effort */ }
      }
      try {
        const re = await translateAudioFileWithQwen({
          audioPath: segSrcPath, audioFormat: "wav", sourceLang, targetLang, voice
        });
        if (re.audio.length > 0) synthesizedAudio = re.audio;
      } catch (err) {
        console.warn(`[step2] Segment ${phrase.index + 1}: re-translation failed — skipping. ${err instanceof Error ? err.message : err}`);
      }
    }

    if (!synthesizedAudio || synthesizedAudio.length === 0) {
      console.warn(`[step2] Segment ${phrase.index + 1}: no audio — skipping.`);
      continue;
    }

    await fs.writeFile(segDubPath, synthesizedAudio);
    await trimGeneratedSpeech(segDubPath, segTrimPath);
    const rawDur = await getMediaDuration(segDubPath);
    let trimmedDur = 0;
    try { trimmedDur = await getMediaDuration(segTrimPath); } catch { /* zero */ }
    if (trimmedDur < 0.1 || (rawDur > 1 && trimmedDur < rawDur * 0.75)) {
      await fs.copyFile(segDubPath, segTrimPath);
    }
    await fitAudioToDuration(segTrimPath, segFitPath, segment.duration, maxAllowedDuration);

    // Measure actual duration and force hard-trim if still over target.
    const measuredDur = await getMediaDuration(segFitPath);
    let forceTrimmed = false;
    if (measuredDur > segment.duration + 0.015) {
      const tmpPath = path.join(workDir, `segment-${phrase.index}-fix2.wav`);
      await hardTrimAudio(segFitPath, tmpPath, segment.duration);
      await fs.rename(tmpPath, segFitPath);
      forceTrimmed = true;
      console.warn(
        `[step2] Segment ${phrase.index + 1}: force-trimmed ${((measuredDur - segment.duration) * 1000).toFixed(0)}ms overage`
      );
    }
    const finalDur = await getMediaDuration(segFitPath);
    timingChecks.push({
      phraseIndex: phrase.index,
      start: phrase.start,
      end: phrase.end,
      targetDuration: segment.duration,
      actualDuration: finalDur,
      forceTrimmed
    });

    fittedSegments.push({ path: segFitPath, start: phrase.start, end: phrase.end });
    transcriptParts.push(
      `[${formatTimestamp(phrase.start)} - ${formatTimestamp(phrase.end)}] ` +
        `Speaker ${phrase.speakerId} | Phrase ${phrase.index + 1}: ${phrase.translatedText}`
    );
  }

  if (fittedSegments.length === 0) throw new Error("No speech segments could be dubbed.");

  const audioFilename = `${input.jobId}-dubbed.wav`;
  const videoFilename = `${input.jobId}-dubbed.mp4`;
  const speechOnlyPath = path.join(workDir, "dubbed-speech-only2.wav");

  await mixSegmentsOnTimeline(fittedSegments, duration, speechOnlyPath);
  await blendBackground(input.upload.localPath, sourceAudioPath, speechOnlyPath, workDir, outputPath(audioFilename));
  await createDubbedVideo(input.upload.localPath, outputPath(audioFilename), outputPath(videoFilename));

  return {
    transcript: transcriptParts.join("\n\n"),
    audioUrl: publicOutputUrl(audioFilename),
    videoUrl: publicOutputUrl(videoFilename),
    timingChecks
  };
}

async function translateSegment(
  sourceAudioPath: string,
  segmentInputPath: string,
  segment: SpeechSegment,
  input: AlignedDubbingInput,
  presetVoice: string
) {
  await trimAudioSegment(sourceAudioPath, segmentInputPath, segment);
  return withRetries(`segment ${segment.index + 1} translation`, () => {
    return translateAudioFileWithQwen({
      audioPath: segmentInputPath,
      audioFormat: "wav",
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      voice: presetVoice
    });
  });
}

async function translateSegmentTextFirst(
  sourceAudioPath: string,
  segmentInputPath: string,
  segment: SpeechSegment,
  input: AlignedDubbingInput,
  presetVoice: string
) {
  if (segment.sourceText?.trim() && process.env.QWEN_TEXT_FIRST_TRANSLATION !== "false") {
    try {
      const textTranslation = await withRetries(`segment ${segment.index + 1} text translation`, () =>
        translateTextWithQwen({
          text: segment.sourceText ?? "",
          sourceLang: input.sourceLang,
          targetLang: input.targetLang
        })
      );
      return {
        transcript: textTranslation.transcript,
        audio: Buffer.alloc(0),
        usage: textTranslation.usage
      };
    } catch (err) {
      console.warn(
        `[aligned-dubbing] Segment ${segment.index + 1}: text-first translation failed; ` +
          `falling back to LiveTranslate audio. Reason: ${err instanceof Error ? err.message : err}`
      );
    }
  }
  return translateSegment(sourceAudioPath, segmentInputPath, segment, input, presetVoice);
}

async function recoverIncompleteTranslation(segment: SpeechSegment, input: AlignedDubbingInput) {
  const sourceText = segment.sourceText?.trim();
  if (!sourceText) return undefined;
  try {
    const fallback = await withRetries(`segment ${segment.index + 1} text translation fallback`, () =>
      translateTextWithQwen({
        text: sourceText,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang
      })
    );
    return isProbablyIncompleteTranslation(fallback.transcript) ? undefined : fallback;
  } catch (err) {
    console.warn(
      `[aligned-dubbing] Segment ${segment.index + 1}: text translation fallback failed. ` +
        `Reason: ${err instanceof Error ? err.message : err}`
    );
    return undefined;
  }
}

async function withRetries<T>(label: string, fn: () => Promise<T>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableQwenError(error)) break;
      const delayMs = 1200 * attempt;
      console.warn(
        `[aligned-dubbing] ${label} failed on attempt ${attempt}/${attempts}; retrying in ${delayMs}ms. ` +
          `Reason: ${error instanceof Error ? error.message : error}`
      );
      await sleep(delayMs);
    }
  }
  throw lastError;
}

function isRetryableQwenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ETIMEDOUT|EAI_AGAIN|terminated|Streaming interrupted|fetch failed|socket/i.test(message);
}

/** True when DashScope returns a free-tier quota exhaustion / billing error. */
function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /403|free tier|quota|billing|exhausted/i.test(message);
}

function speakerRefPathFor(workDir: string, speakerId: string) {
  return path.join(workDir, `speaker-${speakerId}-ref.wav`);
}

/**
 * Synthesize translated text with a cloned voice.
 * If the synthesis call fails with a quota/billing error on the primary model,
 * automatically re-enroll the speaker with the fallback model and retry.
 * The updated clone entry is written back to speakerCloneMap so subsequent
 * phrases for the same speaker don't re-enroll again.
 */
async function synthesizeWithCloneFallback(
  text: string,
  cloneEntry: { voiceId: string; model: string },
  speakerId: string,
  segmentIndex: number,
  langType: string,
  refAudioPath: string,
  sourceLang: string | undefined,
  sourceAsr: { sentences: Array<{ speakerId?: string; start: number; end: number }> },
  sourceAudioPath: string,
  speakerCloneMap: Map<string, { voiceId: string; model: string }>,
  fallbackModel: string,
  fallbackAudio: Buffer
): Promise<Buffer> {
  // First attempt with current (primary) model.
  try {
    return await synthesizeWithQwenClonedVoice({
      text,
      voice: cloneEntry.voiceId,
      model: cloneEntry.model,
      languageType: langType
    });
  } catch (primaryErr) {
    const reason = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);

    if (!isQuotaError(primaryErr) || cloneEntry.model === fallbackModel) {
      // Not a quota error, or already on fallback — give up on cloning this segment.
      if (process.env.QWEN_REQUIRE_VOICE_CLONING === "true") {
        throw new Error(`Cloned voice synthesis failed for phrase ${segmentIndex + 1}: ${reason}`);
      }
      console.warn(
        `[aligned-dubbing] Segment ${segmentIndex + 1}: cloned synthesis failed, ` +
          `falling back to translated audio. Reason: ${reason}`
      );
      return fallbackAudio;
    }

    // Quota error on primary model → re-enroll with fallback model and retry.
    console.warn(
      `[aligned-dubbing] Segment ${segmentIndex + 1}: primary VC model quota exhausted. ` +
        `Re-enrolling speaker ${speakerId} with fallback model "${fallbackModel}".`
    );
    try {
      const newVoiceId = await createQwenClonedVoice({
        referenceAudioPath: refAudioPath,
        preferredName: `spk${speakerId}fb`,
        language: sourceLang === "hi" ? undefined : sourceLang,
        model: fallbackModel
      });
      const newEntry = { voiceId: newVoiceId, model: fallbackModel };
      speakerCloneMap.set(speakerId, newEntry); // cache so next phrases skip re-enrollment
      console.log(
        `[aligned-dubbing] Speaker ${speakerId}: re-enrolled with fallback model → ${newVoiceId}`
      );
      return await synthesizeWithQwenClonedVoice({
        text,
        voice: newVoiceId,
        model: fallbackModel,
        languageType: langType
      });
    } catch (fallbackErr) {
      if (process.env.QWEN_REQUIRE_VOICE_CLONING === "true") {
        throw new Error(
          `Fallback cloned voice synthesis failed for phrase ${segmentIndex + 1} on model "${fallbackModel}": ${
            fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          }`
        );
      }
      console.warn(
        `[aligned-dubbing] Segment ${segmentIndex + 1}: fallback VC model also failed, ` +
          `using translated audio. Reason: ${fallbackErr instanceof Error ? fallbackErr.message : fallbackErr}`
      );
      return fallbackAudio;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadOrCreateSourceAsr(
  fileId: string,
  fileUrl: string,
  localAudioPath: string,
  language?: string
): Promise<QwenAsrResult> {
  const provider = process.env.DEEPGRAM_API_KEY ? "deepgram" : "qwen";
  const cachePath = outputPath(`${fileId}-${provider}-source-asr.json`);
  try {
    const cached = JSON.parse(await fs.readFile(cachePath, "utf8")) as QwenAsrResult;

    // Validate the cached result is not a truncated/failed run.
    // A healthy result has at least 1 sentence with words, and total speech
    // duration > 0.  If it looks suspiciously empty, delete the file and re-run.
    const totalCachedSpeech = cached.sentences.reduce((s, c) => s + (c.end - c.start), 0);
    const hasWords = cached.sentences.some((s) => s.words.length > 0);
    if (cached.sentences.length === 0 || totalCachedSpeech < 0.5 || !hasWords) {
      console.warn(
        `[aligned-dubbing] Cached ${provider} ASR for ${fileId} looks invalid ` +
          `(${cached.sentences.length} sentences, ${totalCachedSpeech.toFixed(1)}s total speech) — discarding.`
      );
      await fs.unlink(cachePath).catch(() => undefined);
      throw new Error("invalid cache");
    }

    console.log(
      `[aligned-dubbing] Loaded cached ${provider} ASR for ${fileId}: ` +
        `${cached.sentences.length} sentences, ${cached.speakers.length} speaker(s).`
    );
    return cached;
  } catch {
    // Cache miss or invalid — run fresh transcription.
  }

  console.log(`[aligned-dubbing] Running ${provider} ASR for ${fileId}…`);
  const result =
    provider === "deepgram"
      ? await withRetries("source Deepgram ASR", () => transcribeWithDeepgram({ localAudioPath, language }), 2)
      : await withRetries("source Qwen ASR", () => transcribeWithQwenFileAsr({ fileUrl, language }), 2);

  console.log(
    `[aligned-dubbing] ${provider} ASR complete: ${result.sentences.length} sentences, ` +
      `${result.speakers.length} speaker(s): ${result.speakers.join(", ")}`
  );
  await fs.writeFile(cachePath, JSON.stringify(result, null, 2), "utf8");
  return result;
}

function canMergeWithNextSegment(current: SpeechSegment, next: SpeechSegment | undefined, mediaDuration: number) {
  if (!next) return false;
  if ((current.speakerId ?? "0") !== (next.speakerId ?? "0")) return false;
  const gap = next.start - current.end;
  const mergedDuration = next.end - current.start;
  return gap >= -0.3 && gap <= 2.5 && mergedDuration <= Math.min(24, mediaDuration);
}

function isProbablyIncompleteTranslation(text: string) {
  const normalized = text.trim().replace(/[\u200B-\u200D\uFEFF]+/g, "");
  if (!normalized) return false;
  if (/^where\b/i.test(normalized)) return true;
  // Trailing ellipsis means Qwen believes the thought continues.
  if (/(…|\.\.\.)\s*["')\]]?$/.test(normalized)) return true;
  // Hard mid-sentence punctuation: comma, semicolon, colon.
  if (/[,;:،，]\s*["')\]]?$/.test(normalized)) return true;
  // Any conventional sentence-ending punctuation (incl. CJK) → complete.
  if (/[.!?。！？]"?'?$/.test(normalized)) return false;
  if (/\b(last|final|previous|next)\s+(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$/i.test(normalized)) {
    return true;
  }
  // Only flag unambiguous subordinate/coordinating conjunctions that cannot
  // grammatically end an English sentence.  DO NOT include content words,
  // articles, prepositions, or auxiliaries — they legitimately end many
  // translations in other language pairs (e.g. verb-final target languages).
  return /\b(and|but|or|if|because|although|unless|until|while|whereas|whenever)$/i.test(normalized);
}

// ---------------------------------------------------------------------------
// Speaker voice assignment
// ---------------------------------------------------------------------------

/**
 * Assign a different preset voice to each speaker, cycling through all
 * voices compatible with the target language.  Speaker "0" gets the user's
 * chosen voice first; remaining speakers get the next compatible voices in order.
 */
function buildPresetVoiceMap(
  speakerIds: string[],
  targetLang: string,
  defaultVoice: string
): Map<string, string> {
  const available = compatibleVoices(targetLang);
  const map = new Map<string, string>();
  if (available.length === 0) return map;

  // Put the user-chosen voice first so the primary speaker keeps their choice.
  const defaultIndex = available.indexOf(defaultVoice as never);
  const ordered =
    defaultIndex >= 0
      ? [defaultVoice, ...available.filter((v) => v !== defaultVoice)]
      : available;

  speakerIds.forEach((id, i) => {
    map.set(id, ordered[i % ordered.length]);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Background blending
// ---------------------------------------------------------------------------

async function blendBackground(
  videoPath: string,
  sourceAudioPath: string,
  speechOnlyPath: string,
  workDir: string,
  outputAudioPath: string
) {
  const mode = process.env.QWEN_BACKGROUND_MODE;
  if (mode === "center_cut") {
    const channels = await getAudioChannels(videoPath);
    if (channels >= 2) {
      const backgroundPath = path.join(workDir, "background-center-cut.wav");
      await createCenterCutBackgroundStem(videoPath, backgroundPath);
      await mixBackgroundStemWithDubbedSpeech(backgroundPath, speechOnlyPath, outputAudioPath);
      return;
    }
    console.warn("[aligned-dubbing] center_cut requires stereo audio; falling back to original_low.");
  }
  if (mode === "center_cut" || mode === "original_low" || !mode) {
    await mixOriginalBedWithDubbedSpeech(sourceAudioPath, speechOnlyPath, outputAudioPath);
    return;
  }
  // mode === "none": speech only, no background
  await fs.copyFile(speechOnlyPath, outputAudioPath);
}

// ---------------------------------------------------------------------------
// Phrase segmentation
// ---------------------------------------------------------------------------

function buildSegmentsFromAsrSentences(sentences: QwenAsrSentence[], duration: number): SpeechSegment[] {
  // Keep phrases clause-sized so synthesized speech starts and finishes near
  // the matching source phrase instead of drifting inside long chunks.
  const maxPhraseDuration = Number(process.env.QWEN_MAX_PHRASE_SECONDS || 4.5);

  const rawSegments: Array<{ start: number; end: number; speakerId?: string; sourceText?: string }> = sentences.flatMap((sentence) => {
    if (sentence.end - sentence.start <= maxPhraseDuration || sentence.words.length < 2) {
      return [{ start: sentence.start, end: sentence.end, speakerId: sentence.speakerId, sourceText: sentence.text }];
    }
    return splitSentenceOnWordBoundaries(sentence, maxPhraseDuration);
  });

  return rawSegments
    .map((seg, index) => {
      const start = clamp(seg.start, 0, duration);
      const end = clamp(seg.end, 0, duration);
      return { index, start, end, duration: end - start, speakerId: seg.speakerId, sourceText: seg.sourceText };
    })
    .filter((seg) => seg.duration >= 0.25)
    .map((seg, index) => ({ ...seg, index }));
}

function wordEndsSentence(text: string) {
  return /[.!?。！？]$/.test(text.trim());
}

function wordEndsClause(text: string) {
  return /[,;:،，；：]$/.test(text.trim());
}

function splitSentenceOnWordBoundaries(
  sentence: QwenAsrSentence,
  maxPhraseDuration: number
): Array<{ start: number; end: number; speakerId?: string; sourceText?: string }> {
  const segments: Array<{ start: number; end: number; speakerId?: string; sourceText?: string }> = [];
  let start = sentence.words[0]?.start ?? sentence.start;
  let startWordIndex = 0;

  for (let idx = 0; idx < sentence.words.length; idx++) {
    const word = sentence.words[idx];
    const nextWord = sentence.words[idx + 1];
    const gapToNext = nextWord ? nextWord.start - word.end : 0;
    const isLongEnough = word.end - start >= Math.min(2.5, maxPhraseDuration);
    const shouldBreakForPunctuation = wordEndsSentence(word.text) && word.end - start >= 1.2;
    const shouldBreakForClause = wordEndsClause(word.text) && word.end - start >= 1.5;
    const shouldBreakForGap = gapToNext >= 0.28 && isLongEnough;
    const shouldBreakForLength = word.end - start >= maxPhraseDuration;
    const isLast = idx === sentence.words.length - 1;

    if (shouldBreakForPunctuation || shouldBreakForClause || shouldBreakForGap || shouldBreakForLength || isLast) {
      segments.push({
        start,
        end: word.end,
        speakerId: sentence.speakerId,
        sourceText: wordsToText(sentence.words.slice(startWordIndex, idx + 1))
      });
      start = nextWord?.start ?? word.end;
      startWordIndex = idx + 1;
    }
  }

  return segments.length > 0
    ? segments
    : [{ start: sentence.start, end: sentence.end, speakerId: sentence.speakerId, sourceText: sentence.text }];
}

function mergeAdjacentSegmentsForCompleteness(segments: SpeechSegment[]) {
  if (process.env.QWEN_MERGE_SHORT_SEGMENTS !== "true") {
    return segments.map((segment, index) => ({ ...segment, index }));
  }

  const merged: SpeechSegment[] = [];
  const maxMergedDuration = Number(process.env.QWEN_MAX_MERGED_PHRASE_SECONDS || 10);
  const maxMergeGap = Number(process.env.QWEN_MAX_MERGE_GAP_SECONDS || 0.85);

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push({ ...segment, index: 0 });
      continue;
    }
    const sameSpeaker = (previous.speakerId ?? "0") === (segment.speakerId ?? "0");
    const gap = segment.start - previous.end;
    const mergedDuration = segment.end - previous.start;
    const hasTightContinuation = gap >= -0.35 && gap <= maxMergeGap;
    const hasShortSide = previous.duration < 4 || segment.duration < 4;
    if (sameSpeaker && hasTightContinuation && hasShortSide && mergedDuration <= maxMergedDuration) {
      previous.end = segment.end;
      previous.duration = previous.end - previous.start;
      previous.sourceText = joinSourceText(previous.sourceText, segment.sourceText);
      continue;
    }
    merged.push({ ...segment, index: merged.length });
  }

  return merged.map((segment, index) => ({ ...segment, index }));
}

function wordsToText(words: Array<{ text: string }>) {
  return words
    .map((word) => word.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function joinSourceText(left?: string, right?: string) {
  return [left, right]
    .map((text) => text?.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// ASR timing QC (non-fatal)
// ---------------------------------------------------------------------------

function verifyPhraseTiming(sourceSegments: SpeechSegment[], dubbedSentences: QwenAsrSentence[]) {
  const tolerance = Number(process.env.QWEN_TIMING_TOLERANCE_SECONDS || 2.5);
  const failures: string[] = [];
  let matched = 0;

  for (const source of sourceSegments) {
    const match = findBestTimingMatch(source, dubbedSentences, tolerance);
    if (!match) {
      failures.push(
        `phrase ${source.index + 1} near ${formatTimestamp(source.start)}-${formatTimestamp(source.end)}`
      );
    } else {
      matched++;
    }
  }

  const matchRate = sourceSegments.length > 0 ? matched / sourceSegments.length : 1;
  return {
    ok: matchRate >= 0.5,
    checkedPhrases: sourceSegments.length,
    matched,
    matchRate,
    toleranceSeconds: tolerance,
    failures
  };
}

function findBestTimingMatch(source: SpeechSegment, dubbedSentences: QwenAsrSentence[], tolerance: number) {
  let best: QwenAsrSentence | undefined;
  let bestOverlap = 0;
  for (const sentence of dubbedSentences) {
    const overlap =
      Math.min(source.end + tolerance, sentence.end) - Math.max(source.start - tolerance, sentence.start);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = sentence;
    }
  }
  return bestOverlap >= Math.min(0.25, source.duration * 0.25) ? best : undefined;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

function publicAbsoluteUrl(route: string) {
  const baseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("Video phrase timestamping requires PUBLIC_BASE_URL so Qwen ASR can fetch generated audio files.");
  }
  return `${baseUrl}${route}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTimestamp(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
