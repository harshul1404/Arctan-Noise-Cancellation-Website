"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Languages, Pencil, Sparkles, Video } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { JobProgress } from "@/components/JobProgress";
import { LanguageSelector } from "@/components/LanguageSelector";
import { OutputModeSelector } from "@/components/OutputModeSelector";
import { ResultPreview } from "@/components/ResultPreview";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { ClipPreview, type ClipSegment } from "@/components/ClipPreview";
import { VoiceSelector } from "@/components/VoiceSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { compatibleVoices, supportsAudioTarget } from "@/lib/languages";
import type { TranscriptPhrase } from "@/lib/alignedDubbing";
import { parseTranscriptText } from "@/lib/parseTranscript";
import { OutputMode } from "@/lib/validation";

type UploadedFile = {
  fileId: string;
  originalName: string;
  mimeType: string;
  extension: string;
  localPath: string;
  fileType: "audio" | "video";
  publicUrl?: string;
};

type TimingCheck = {
  phraseIndex: number;
  start: number;
  end: number;
  targetDuration: number;
  actualDuration: number;
  forceTrimmed: boolean;
};

type Result = {
  jobId: string;
  transcript: string;
  audioUrl?: string;
  videoUrl?: string;
  timingChecks?: TimingCheck[];
  usage?: {
    provider?: string;
    capabilities?: {
      voiceCloning?: boolean;
      backgroundAudio?: boolean;
      timingAlignment?: boolean;
      lipSync?: boolean;
      lipSyncMode?: string;
    };
  };
};

// The aligned dubbing path (video → dubbed video) uses a 3-step workflow.
const isAlignedPath = (outputMode: OutputMode, fileType?: "audio" | "video") =>
  outputMode === "text_audio_video" && fileType === "video";

type Step = "idle" | "transcript_ready" | "clips_ready" | "done";

// Preset transcript for Arohi experiment — loaded via "Use Arohi Input" button.
const AROHI_PHRASES: TranscriptPhrase[] = [
  { index: 0,  start: 0.24,  end: 4.08,  speakerId: "0", translatedText: "Congratulations. You are one lucky woman. You are having twins." },
  { index: 1,  start: 12.3,  end: 12.6,  speakerId: "0", translatedText: "No." },
  { index: 2,  start: 14.4,  end: 15.6,  speakerId: "0", translatedText: "That is impossible." },
  { index: 3,  start: 23.3,  end: 27.7,  speakerId: "0", translatedText: "But he told me he could never father a child." },
  { index: 4,  start: 28.2,  end: 34.4,  speakerId: "0", translatedText: "Arohi, your fees still have not come through. If this continues, you will not be allowed into next semester." },
  { index: 5,  start: 34.8,  end: 36.3,  speakerId: "0", translatedText: "The fees still are not paid?" },
  { index: 6,  start: 37.1,  end: 42.1,  speakerId: "0", translatedText: "That cannot be right, ma'am. My fees are always paid on time." },
  { index: 7,  start: 42.2,  end: 56.76, speakerId: "0", translatedText: "The ones who cannot pay all say the same thing. You are not the first to say that, Arohi. This is a respected college. People study here if they can afford it. If this place is out of your league, why are you still hanging around here?" },
  { index: 8,  start: 56.76, end: 63.42, speakerId: "0", translatedText: "No ma'am, please. Please give me one week. I will sort it out somehow. I will pay every penny." },
  { index: 9,  start: 63.5,  end: 66.12, speakerId: "0", translatedText: "Enough. You have only two days to clear your fees." },
];

export function Dashboard({ maxUploadMb }: { maxUploadMb: number }) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [outputMode, setOutputMode] = useState<OutputMode>("text_audio");
  const [voice, setVoice] = useState("Cherry");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Three-step aligned-dubbing state
  const [step, setStep] = useState<Step>("idle");
  const [transcriptJobId, setTranscriptJobId] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<TranscriptPhrase[]>([]);
  const [editedPhrases, setEditedPhrases] = useState<TranscriptPhrase[]>([]);
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [advancedReview, setAdvancedReview] = useState(false);

  // Paste-transcript mode
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const wantsAudio = outputMode !== "text";
  const wantsVideo = outputMode === "text_audio_video";
  const allowedVoices = useMemo(() => compatibleVoices(targetLang), [targetLang]);
  const aligned = isAlignedPath(outputMode, uploadedFile?.fileType);

  useEffect(() => {
    if (!supportsAudioTarget(targetLang) && outputMode !== "text") setOutputMode("text");
    if (outputMode === "text_audio_video" && uploadedFile?.fileType !== "video") setOutputMode("text_audio");
    if (allowedVoices.length > 0 && !allowedVoices.includes(voice as never)) setVoice(allowedVoices[0]);
  }, [allowedVoices, outputMode, targetLang, uploadedFile?.fileType, voice]);

  // Reset multi-step state when file or settings change.
  useEffect(() => {
    setStep("idle");
    setTranscriptJobId(null);
    setPhrases([]);
    setEditedPhrases([]);
    setClips([]);
    setResult(null);
    setAdvancedReview(false);
  }, [uploadedFile?.fileId, sourceLang, targetLang, outputMode, voice]);

  // ── Step 1: generate translated transcript ──────────────────────────────
  async function generateTranscript() {
    if (!uploadedFile) { setError("Upload a video file first."); return; }
    setIsBusy(true);
    setError("");
    setResult(null);
    setStep("idle");
    setClips([]);
    setProgress("Running ASR and translating phrases…");
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploadedFile.fileId,
          fileType: uploadedFile.fileType,
          sourceLang: sourceLang === "auto" ? undefined : sourceLang,
          targetLang,
          voice
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Transcription failed.");
      const p: TranscriptPhrase[] = payload.phrases ?? [];
      setPhrases(p);
      setEditedPhrases(p);
      setTranscriptJobId(payload.jobId);
      setStep("transcript_ready");
      setProgress("Transcript ready — review and edit phrases, then continue to clip preview.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transcription failed.");
      setProgress("");
    } finally {
      setIsBusy(false);
    }
  }

  // ── Paste path: parse text, set up job on server, go to transcript_ready ──
  async function submitPastedTranscript() {
    if (!uploadedFile) { setError("Upload a video file first."); return; }
    const parsed = parseTranscriptText(pastedText);
    if (parsed.length === 0) { setError("No valid phrases found. Use the format: [MM:SS.mmm - MM:SS.mmm] Speaker 0 | Phrase 1: text"); return; }
    setIsBusy(true);
    setError("");
    setResult(null);
    setStep("idle");
    setClips([]);
    setProgress("Setting up job from pasted transcript…");
    try {
      const response = await fetch("/api/setup-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploadedFile.fileId,
          sourceLang: sourceLang === "auto" ? undefined : sourceLang,
          targetLang,
          voice,
          phrases: parsed   // used for voice-clone enrollment per speaker
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Setup failed.");
      setPhrases(parsed);
      setEditedPhrases(parsed);
      setTranscriptJobId(payload.jobId);
      setStep("transcript_ready");
      setProgress("Pasted transcript loaded — review and edit phrases, then continue to clip preview.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Setup failed.");
      setProgress("");
    } finally {
      setIsBusy(false);
    }
  }

  // ── Step 2: trim clips for each edited phrase ───────────────────────────
  async function prepareClips() {
    if (!uploadedFile || !transcriptJobId) return;
    setIsBusy(true);
    setError("");
    setProgress("Trimming source clips for each phrase…");
    try {
      const response = await fetch("/api/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: transcriptJobId,
          fileId: uploadedFile.fileId,
          phrases: editedPhrases
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Clip preparation failed.");
      setClips(payload.clips ?? []);
      setStep("clips_ready");
      setProgress("Clips ready — review each segment, then create the dubbed video.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Clip preparation failed.");
      setProgress("");
    } finally {
      setIsBusy(false);
    }
  }

  // ── Step 3: create dubbed video from clips ───────────────────────────────
  async function createDubbedVideo() {
    if (!uploadedFile || !transcriptJobId) return;
    setIsBusy(true);
    setError("");
    setProgress("Synthesizing voices and mixing timeline…");
    try {
      const response = await fetch("/api/dub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: transcriptJobId,
          fileId: uploadedFile.fileId,
          phrases: editedPhrases
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Dubbing failed.");
      setResult({ jobId: transcriptJobId, transcript: payload.transcript, audioUrl: payload.audioUrl, videoUrl: payload.videoUrl, timingChecks: payload.timingChecks });
      setStep("done");
      setProgress("Complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dubbing failed.");
      setProgress("");
    } finally {
      setIsBusy(false);
    }
  }

  // ── Standard 1-step flow (audio / text output) ───────────────────────────
  async function generate() {
    if (!uploadedFile) { setError("Upload an audio or video file first."); return; }
    setIsBusy(true);
    setError("");
    setResult(null);
    setProgress(wantsVideo ? "Starting production dub" : "Translating");
    const timers = [
      window.setTimeout(() => setProgress(wantsVideo ? "Cloning voices and preserving background" : "Receiving transcript"), 700),
      ...(wantsAudio ? [window.setTimeout(() => setProgress(wantsVideo ? "Rendering final video" : "Receiving audio"), 1400)] : [])
    ];
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploadedFile.fileId,
          fileType: uploadedFile.fileType,
          sourceLang: sourceLang === "auto" ? undefined : sourceLang,
          targetLang,
          outputMode,
          voice: wantsAudio ? voice : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Translation failed.");
      setResult(payload);
      setProgress("Complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Translation failed.");
      setProgress("");
    } finally {
      timers.forEach(clearTimeout);
      setIsBusy(false);
    }
  }

  // ── Step indicator helper ─────────────────────────────────────────────────
  const stepOrder: Step[] = ["idle", "transcript_ready", "clips_ready", "done"];
  const stepIndex = stepOrder.indexOf(step);

  function StepDot({ target, label }: { target: Step; label: string }) {
    const targetIdx = stepOrder.indexOf(target);
    const done = stepIndex > targetIdx;
    const active = stepIndex === targetIdx;
    return (
      <>
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : targetIdx + 1}
        </span>
        <span className={active || done ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
      </>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm text-muted-foreground">
                <Languages className="h-4 w-4" />
                Production dubbing studio
              </div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Dub short-form videos into English</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Upload media, choose the target language, then start a production dub with speaker matching, retained background, and timing alignment.
              </p>
            </div>
            <div className="rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground sm:max-w-sm">
              Use Start for the highest-quality path. The review workflow remains available as an advanced fallback for transcript experiments.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-6">
          <FileUpload
            maxUploadMb={maxUploadMb}
            uploadedFile={uploadedFile}
            disabled={isBusy}
            onUploaded={(file) => { setUploadedFile(file); setResult(null); setProgress(""); }}
            onError={setError}
            onStatus={setProgress}
          />

          <Card>
            <CardHeader>
              <CardTitle>Translation settings</CardTitle>
              <CardDescription>Choose language, output assets, and a compatible voice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <LanguageSelector
                sourceLang={sourceLang} targetLang={targetLang} disabled={isBusy}
                onSourceChange={setSourceLang} onTargetChange={setTargetLang}
              />
              <div className="space-y-2">
                <div className="text-sm font-medium">Output mode</div>
                <OutputModeSelector
                  value={outputMode} targetLang={targetLang} fileType={uploadedFile?.fileType}
                  disabled={isBusy} onChange={setOutputMode}
                />
                {!supportsAudioTarget(targetLang) && (
                  <p className="text-xs text-muted-foreground">This target language supports transcript output only.</p>
                )}
              </div>
              {wantsAudio && (
                <VoiceSelector targetLang={targetLang} value={voice} disabled={isBusy} onChange={setVoice} />
              )}

              {/* ── Video dubbing: production start + optional review workflow ── */}
              {aligned ? (
                <div className="space-y-3">
                  <Button className="w-full" onClick={generate} disabled={!uploadedFile || isBusy}>
                    <Sparkles className="h-4 w-4" />
                    {isBusy && !advancedReview ? "Creating production dub..." : "Start"}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setAdvancedReview((value) => !value)}
                    disabled={isBusy}
                  >
                    <Pencil className="h-4 w-4" />
                    {advancedReview ? "Hide Review Workflow" : "Review Transcript First"}
                  </Button>

                  {advancedReview && (
                    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <StepDot target="idle" label="Transcript" />
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <StepDot target="transcript_ready" label="Review Clips" />
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <StepDot target="clips_ready" label="Create Dubbed Video" />
                      </div>

                      <div className="flex overflow-hidden rounded-md border bg-background text-xs">
                        <button
                          className={`flex-1 px-3 py-1.5 transition-colors ${!pasteMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                          onClick={() => setPasteMode(false)}
                          disabled={isBusy}
                        >
                          Generate
                        </button>
                        <button
                          className={`flex-1 border-l px-3 py-1.5 transition-colors ${pasteMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                          onClick={() => setPasteMode(true)}
                          disabled={isBusy}
                        >
                          Paste Transcript
                        </button>
                      </div>

                      {!pasteMode ? (
                    <Button
                      className="w-full"
                      variant={step !== "idle" ? "outline" : "default"}
                      onClick={generateTranscript}
                      disabled={!uploadedFile || isBusy}
                    >
                      <Pencil className="h-4 w-4" />
                      {isBusy && step === "idle" ? "Generating transcript…" : "Generate Translated Transcript"}
                    </Button>
                      ) : (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        rows={8}
                        disabled={isBusy}
                        placeholder={"[00:00.240 - 00:04.080] Speaker 0 | Phrase 1: Hello world\n[00:05.000 - 00:08.500] Speaker 1 | Phrase 2: How are you?"}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                      />
                      {pastedText.trim() && (() => {
                        const count = parseTranscriptText(pastedText).length;
                        return (
                          <p className="text-[11px] text-muted-foreground">
                            {count > 0 ? `${count} phrase${count !== 1 ? "s" : ""} parsed` : "No valid phrases found — check the format."}
                          </p>
                        );
                      })()}
                      <Button
                        className="w-full"
                        onClick={submitPastedTranscript}
                        disabled={!uploadedFile || isBusy || !pastedText.trim()}
                      >
                        <Pencil className="h-4 w-4" />
                        {isBusy && step === "idle" ? "Setting up…" : "Use Pasted Transcript"}
                      </Button>
                    </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Standard 1-step button ── */
                <Button className="w-full" onClick={generate} disabled={!uploadedFile || isBusy}>
                  <Sparkles className="h-4 w-4" />
                  {isBusy ? "Generating..." : "Generate"}
                </Button>
              )}

              {error && (
                <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Step 1: Editable transcript ── */}
          {aligned && advancedReview && step === "transcript_ready" && editedPhrases.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>Translated Transcript</CardTitle>
                    <CardDescription>
                      {editedPhrases.length} phrase{editedPhrases.length !== 1 ? "s" : ""} detected.
                      Edit timestamps, speaker names, or text before continuing.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs"
                    disabled={isBusy}
                    onClick={() => setEditedPhrases(AROHI_PHRASES)}
                  >
                    Use Arohi Input
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TranscriptEditor
                  phrases={editedPhrases}
                  disabled={isBusy}
                  onChange={setEditedPhrases}
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={prepareClips}
                  disabled={isBusy || editedPhrases.length === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                  {isBusy ? "Preparing clips…" : "Next — Preview Trimmed Clips"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ── Step 2: Trimmed clip preview ── */}
          {aligned && advancedReview && step === "clips_ready" && clips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trimmed Clips</CardTitle>
                <CardDescription>
                  {clips.length} clip{clips.length !== 1 ? "s" : ""} trimmed from the source {uploadedFile?.fileType}.
                  Review each segment before dubbing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClipPreview clips={clips} isVideo={uploadedFile?.fileType === "video"} />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={createDubbedVideo}
                  disabled={isBusy || clips.length === 0}
                >
                  <Video className="h-4 w-4" />
                  {isBusy ? "Creating dubbed video…" : "Create Dubbed Video"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ── Result ── */}
          {result && <ResultPreview result={result} />}

          {/* ── Timing report ── */}
          {result?.timingChecks && result.timingChecks.length > 0 && (() => {
            const checks = result.timingChecks;
            const trimmed = checks.filter(c => c.forceTrimmed);
            const maxOverMs = Math.max(0, ...checks.map(c => Math.round((c.actualDuration - c.targetDuration) * 1000)));
            const allOk = trimmed.length === 0 && maxOverMs <= 20;
            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Timing Report</CardTitle>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${allOk ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {allOk ? "All segments on time" : `${trimmed.length} force-trimmed`}
                    </span>
                  </div>
                  <CardDescription>
                    Actual dubbed audio duration vs target for each phrase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {checks.map(c => {
                      const diffMs = Math.round((c.actualDuration - c.targetDuration) * 1000);
                      const ok = Math.abs(diffMs) <= 20;
                      return (
                        <div key={c.phraseIndex} className="flex items-center gap-2 text-xs font-mono">
                          <span className={ok ? "text-green-600" : "text-amber-600"}>{ok ? "✓" : "⚠"}</span>
                          <span className="text-muted-foreground w-8">#{c.phraseIndex + 1}</span>
                          <span className="text-muted-foreground">{c.start.toFixed(2)}s→{c.end.toFixed(2)}s</span>
                          <span className={`ml-auto ${ok ? "text-muted-foreground" : "text-amber-600 font-medium"}`}>
                            {c.actualDuration.toFixed(3)}s / {c.targetDuration.toFixed(3)}s
                            {diffMs > 0 ? ` (+${diffMs}ms)` : diffMs < 0 ? ` (${diffMs}ms)` : ""}
                          </span>
                          {c.forceTrimmed && <span className="text-amber-600 text-[10px]">trimmed</span>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job progress</CardTitle>
              <CardDescription>{progress ? "Moving through these stages." : "Progress appears here after upload."}</CardDescription>
            </CardHeader>
            <CardContent>
              <JobProgress current={progress} wantsAudio={wantsAudio} wantsVideo={wantsVideo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Output support</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Start uses production dubbing for video: speaker detection, voice cloning, background retention, and timing alignment.</p>
              <p>Audio/text fallback remains available for English, Chinese, Russian, French, German, Portuguese, Spanish, Italian, Korean, Japanese, and Cantonese.</p>
              <p>The review workflow uses the segmented Qwen fallback and is best for transcript timing experiments.</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
