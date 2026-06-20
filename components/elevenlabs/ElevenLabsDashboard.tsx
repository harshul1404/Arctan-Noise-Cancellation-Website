"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, Clock, Download, Loader2, Music, Pause, Play, Plus, Scissors, Trash2, Upload, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadedFile = {
  fileId: string;
  originalName: string;
  mimeType: string;
  fileType: "audio" | "video";
};

type ClipJob = {
  index: number;
  dubbingId: string;
  start: number;
  end: number;
  status: "dubbing" | "done" | "failed";
  videoUrl?: string;
  error?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
}

function fmtTimeShort(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function parseTimeSec(raw: string): number | null {
  const s = raw.trim();
  const colonMatch = s.match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
  if (colonMatch) {
    const val = parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]) + (colonMatch[3] ? parseFloat(`0.${colonMatch[3]}`) : 0);
    return val >= 0 ? val : null;
  }
  const plain = parseFloat(s);
  return !isNaN(plain) && plain >= 0 ? plain : null;
}

const SOURCE_LANGS = [
  { code: "auto", label: "Auto detect" },
  { code: "hi",   label: "Hindi" },
  { code: "es",   label: "Spanish" },
  { code: "fr",   label: "French" },
  { code: "de",   label: "German" },
  { code: "pt",   label: "Portuguese" },
  { code: "ar",   label: "Arabic" },
  { code: "zh",   label: "Chinese" },
  { code: "ja",   label: "Japanese" },
  { code: "ko",   label: "Korean" },
  { code: "it",   label: "Italian" },
  { code: "ru",   label: "Russian" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ElevenLabsDashboard({ maxUploadMb }: { maxUploadMb: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Upload
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Clip splitting
  const [sourceLang, setSourceLang] = useState("auto");
  const [splitPoints, setSplitPoints] = useState<number[]>([]);
  const [splitInput, setSplitInput] = useState("");
  const [splitError, setSplitError] = useState("");

  // Dubbing
  const [submitting, setSubmitting] = useState(false);
  const [clipJobs, setClipJobs] = useState<ClipJob[]>([]);
  const [combining, setCombining] = useState(false);
  const [combinedUrl, setCombinedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived clip list from split points
  const clips = useMemo(() => {
    if (!videoDuration) return [];
    const boundaries = [
      0,
      ...splitPoints.filter(t => t > 0 && t < videoDuration).sort((a, b) => a - b),
      videoDuration
    ];
    return boundaries.slice(0, -1).map((start, i) => ({
      index: i, start, end: boundaries[i + 1]
    }));
  }, [splitPoints, videoDuration]);

  const allDone = clipJobs.length > 0 && clipJobs.every(j => j.status === "done");
  const anyFailed = clipJobs.some(j => j.status === "failed");
  const isBusy = uploading || submitting || combining;

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxUploadMb * 1024 * 1024) {
      setError(`File too large. Max ${maxUploadMb} MB.`);
      return;
    }

    // Reset everything
    if (pollRef.current) clearInterval(pollRef.current);
    setUploadedFile(null);
    setVideoDuration(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setSplitPoints([]);
    setSplitInput("");
    setSplitError("");
    setClipJobs([]);
    setCombinedUrl(null);
    setError("");

    // Get duration client-side before uploading
    const dur = await new Promise<number | null>(resolve => {
      const url = URL.createObjectURL(file);
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(isFinite(vid.duration) ? vid.duration : null); };
      vid.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      vid.src = url;
    });
    setVideoDuration(dur);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setUploadedFile({ fileId: data.fileId, originalName: data.originalName, mimeType: data.mimeType, fileType: data.fileType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // ── Split points ────────────────────────────────────────────────────────────

  function addSplitPoint() {
    const t = parseTimeSec(splitInput);
    if (t === null) { setSplitError("Use M:SS or seconds — e.g. 0:22 or 22"); return; }
    if (!videoDuration || t <= 0 || t >= videoDuration) {
      setSplitError(`Must be between 0:01 and ${fmtTimeShort(videoDuration ?? 0)}`);
      return;
    }
    if (splitPoints.some(p => Math.abs(p - t) < 0.5)) { setSplitError("Too close to an existing split point"); return; }
    setSplitPoints(prev => [...prev, t].sort((a, b) => a - b));
    setSplitInput("");
    setSplitError("");
  }

  function useCurrentTime() {
    const t = videoRef.current?.currentTime;
    if (t == null) return;
    setSplitInput(fmtTimeShort(t));
    setSplitError("");
  }

  function removeSplitPoint(t: number) {
    setSplitPoints(prev => prev.filter(p => p !== t));
  }

  // ── Player controls ───────────────────────────────────────────────────────────

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrentTime(t);
  }

  // ── Dub clips ───────────────────────────────────────────────────────────────

  async function startDubbing() {
    if (!uploadedFile || clips.length < 2) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/elevenlabs/dub-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: uploadedFile.fileId, clips, sourceLang, targetLang: "en" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed.");
      setClipJobs(data.clipJobs.map((j: any) => ({ ...j, status: "dubbing" })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Poll clip statuses ──────────────────────────────────────────────────────

  useEffect(() => {
    const dubbing = clipJobs.filter(j => j.status === "dubbing");
    if (dubbing.length === 0) return;

    pollRef.current = setInterval(async () => {
      const updates = await Promise.all(
        dubbing.map(async job => {
          try {
            const res = await fetch(`/api/elevenlabs/status/${job.dubbingId}`);
            const d = await res.json();
            if (d.status === "done")   return { dubbingId: job.dubbingId, status: "done"   as const, videoUrl: d.videoUrl };
            if (d.status === "failed") return { dubbingId: job.dubbingId, status: "failed" as const, error: d.error };
          } catch { /* blip */ }
          return {};
        })
      );

      setClipJobs(prev => {
        const next = prev.map(j => {
          const u = updates.find((u: any) => u.dubbingId === j.dubbingId);
          return u && (u as any).status ? { ...j, ...(u as any) } : j;
        });
        return next;
      });
    }, 6000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [clipJobs]);

  // ── Auto-combine when all done ──────────────────────────────────────────────

  useEffect(() => {
    if (allDone && !combinedUrl && !combining) combine();
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function combine() {
    setCombining(true);
    setError("");
    try {
      const res = await fetch("/api/elevenlabs/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipJobs: clipJobs.map(j => ({ index: j.index, dubbingId: j.dubbingId })) })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Combine failed.");
      setCombinedUrl(d.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Combine failed.");
    } finally {
      setCombining(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const showSplitter = !!uploadedFile && clipJobs.length === 0;
  const showProgress = clipJobs.length > 0;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm text-muted-foreground">
            <Music className="h-4 w-4" />
            ElevenLabs Dubbing API · Experiment
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">ElevenLabs Dubbing Studio</h1>
          <p className="mt-2 text-muted-foreground">
            Upload a video, split it into clips, dub each clip separately with ElevenLabs, then combine into a single dubbed video.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">

        {/* ── Step 1: Upload ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 1 — Upload video</CardTitle>
                <CardDescription>MP4, MOV, or WEBM · max {maxUploadMb} MB</CardDescription>
              </div>
              {uploadedFile && (
                <Button size="sm" variant="outline" disabled={isBusy}
                  onClick={() => {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setUploadedFile(null); setVideoDuration(null); setSplitPoints([]);
                    setClipJobs([]); setCombinedUrl(null); setError("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}>
                  Change file
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {uploading ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Uploading…</p>
              </div>
            ) : uploadedFile ? (
              <div className="space-y-3">
                {/* Video preview */}
                <video
                  ref={videoRef}
                  src={`/api/files/${uploadedFile.fileId}`}
                  className="w-full rounded-md bg-black"
                  style={{ maxHeight: 280 }}
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={e => { if (isFinite(e.currentTarget.duration)) setVideoDuration(e.currentTarget.duration); }}
                />

                {/* Custom controls: play/pause + seek slider */}
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={togglePlay}
                    title={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {fmtTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration ?? 0}
                    step={0.01}
                    value={Math.min(currentTime, videoDuration ?? 0)}
                    onChange={e => seekTo(parseFloat(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    aria-label="Seek video"
                  />
                  <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {fmtTime(videoDuration ?? 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>{uploadedFile.originalName}</span>
                  {videoDuration && <span>— {fmtTimeShort(videoDuration)}</span>}
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to choose a video file</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, WEBM</p>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* ── Step 2: Split clips ── */}
        {showSplitter && videoDuration && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Split into clips</CardTitle>
              <CardDescription>
                Add split points to divide the video into sub-clips.
                Play the video above, pause at the right moment, then click "Use current time".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Source language */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Source language</label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_LANGS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Split point input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add split point</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 0:22 or 22.5"
                    value={splitInput}
                    onChange={e => { setSplitInput(e.target.value); setSplitError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addSplitPoint(); }}
                  />
                  <Button variant="outline" onClick={useCurrentTime} title="Use video playhead time">
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={addSplitPoint} disabled={!splitInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {splitError && <p className="text-xs text-destructive">{splitError}</p>}
                <p className="text-xs text-muted-foreground">
                  Play the video, pause at a split point, then click <Clock className="inline h-3 w-3" /> to capture the time.
                </p>
              </div>

              {/* Visual timeline */}
              {clips.length >= 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeline</label>
                  <div className="relative h-9 w-full overflow-hidden rounded-md border bg-muted">
                    {clips.map((clip, i) => (
                      <div
                        key={i}
                        className={`absolute top-0 h-full ${i % 2 === 0 ? "bg-primary/25" : "bg-primary/40"} border-r border-background/60`}
                        style={{
                          left: `${(clip.start / videoDuration) * 100}%`,
                          width: `${((clip.end - clip.start) / videoDuration) * 100}%`
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-primary">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>0:00</span>
                    <span>{fmtTimeShort(videoDuration)}</span>
                  </div>
                </div>
              )}

              {/* Clip list */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Clips {clips.length > 0 && <span className="font-normal text-muted-foreground">({clips.length})</span>}
                </label>
                {clips.length >= 1 ? (
                  <div className="divide-y rounded-md border">
                    {clips.map((clip, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="font-medium text-muted-foreground w-14">Clip {i + 1}</span>
                        <span className="font-mono text-xs">
                          {fmtTime(clip.start)} → {fmtTime(clip.end)}
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {(clip.end - clip.start).toFixed(1)}s
                        </span>
                        {/* Remove split point after this clip (not shown for last clip) */}
                        {i < clips.length - 1 ? (
                          <Button size="icon" variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Remove split point"
                            onClick={() => removeSplitPoint(clip.end)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="h-6 w-6" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Add split points above to divide the video into clips.
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={startDubbing}
                disabled={clips.length < 2 || submitting}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Trimming and submitting clips…</>
                  : clips.length < 2
                  ? "Add at least one split point to continue"
                  : <><Scissors className="h-4 w-4" /> Dub {clips.length} Clips in English</>}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── Step 3: Progress ── */}
        {showProgress && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 — Dubbing in progress</CardTitle>
              <CardDescription>
                {combinedUrl ? "All done — clips dubbed and combined."
                 : combining   ? "Combining clips into final video…"
                 : allDone     ? "All clips dubbed — combining…"
                 : anyFailed   ? "Some clips failed to dub."
                 : `Dubbing ${clipJobs.filter(j => j.status === "dubbing").length} of ${clipJobs.length} clips…`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-md border">
                {[...clipJobs].sort((a, b) => a.index - b.index).map(job => (
                  <div key={job.dubbingId} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <span className="w-12 font-medium text-muted-foreground">Clip {job.index + 1}</span>
                    <span className="flex-1 font-mono text-xs text-muted-foreground">
                      {fmtTime(job.start)} → {fmtTime(job.end)}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                      job.status === "done"   ? "text-green-600"
                    : job.status === "failed" ? "text-destructive"
                    : "text-amber-600"}`}>
                      {job.status === "done"    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Done</>
                       : job.status === "failed" ? <><AlertCircle className="h-3.5 w-3.5" /> Failed</>
                       : <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Dubbing…</>}
                    </span>
                    {job.status === "done" && job.videoUrl ? (
                      <a
                        href={job.videoUrl}
                        download
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        title={`Download clip ${job.index + 1}`}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    ) : (
                      <div className="w-[92px]" />
                    )}
                  </div>
                ))}
              </div>

              {(combining || (allDone && !combinedUrl)) && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Combining {clipJobs.length} clips into one video…
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Result ── */}
        {combinedUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Result — English dubbed video</CardTitle>
              <CardDescription>
                {clipJobs.length} clips dubbed separately and joined in sequence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <video src={combinedUrl} controls className="w-full rounded-md bg-black" />
              <a
                href={combinedUrl}
                download
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Download MP4
              </a>
            </CardContent>
          </Card>
        )}

        {/* Global error */}
        {error && (
          <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>
    </main>
  );
}
