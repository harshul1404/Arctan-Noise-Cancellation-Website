"use client";

import type { TranscriptPhrase } from "@/lib/alignedDubbing";

export type ClipSegment = TranscriptPhrase & { clipUrl: string };

function fmtTs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${String(m).padStart(2, "0")}:${sec.padStart(4, "0")}`;
}

interface Props {
  clips: ClipSegment[];
  isVideo: boolean;
}

export function ClipPreview({ clips, isVideo }: Props) {
  return (
    <div className="space-y-3">
      {clips.map((clip, i) => (
        <div key={clip.index} className="rounded-lg border bg-card p-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground">#{i + 1}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              Speaker {clip.speakerId}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {fmtTs(clip.start)} → {fmtTs(clip.end)}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{clip.translatedText}</p>
          {isVideo ? (
            <video
              src={clip.clipUrl}
              controls
              className="w-full rounded-md bg-black"
              style={{ maxHeight: "200px" }}
            />
          ) : (
            <audio src={clip.clipUrl} controls className="w-full" />
          )}
        </div>
      ))}
    </div>
  );
}
