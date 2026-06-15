"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Result = {
  jobId: string;
  transcript: string;
  audioUrl?: string;
  videoUrl?: string;
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

export function ResultPreview({ result }: { result: Result | null }) {
  if (!result) return null;
  const transcriptBlob = new Blob([result.transcript], { type: "text/plain" });
  const transcriptUrl = URL.createObjectURL(transcriptBlob);
  const capabilities = result.usage?.capabilities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>Preview and download the generated assets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {capabilities ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <Capability label="Voice clone" active={capabilities.voiceCloning} />
            <Capability label="Background retained" active={capabilities.backgroundAudio} />
            <Capability label="Timing aligned" active={capabilities.timingAlignment} />
            <Capability label="Lip sync render" active={capabilities.lipSync} />
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Translated transcript</h3>
            <Button asChild size="sm" variant="outline">
              <a href={transcriptUrl} download={`${result.jobId}-transcript.txt`}>
                <Download className="h-4 w-4" />
                TXT
              </a>
            </Button>
          </div>
          <Textarea value={result.transcript} readOnly className="min-h-48 resize-y" />
        </div>
        {result.audioUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Dubbed audio</h3>
              <Button asChild size="sm" variant="outline">
                <a href={result.audioUrl} download>
                  <Download className="h-4 w-4" />
                  WAV
                </a>
              </Button>
            </div>
            <audio src={result.audioUrl} controls className="w-full" />
          </div>
        ) : null}
        {result.videoUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Dubbed video</h3>
              <Button asChild size="sm" variant="outline">
                <a href={result.videoUrl} download>
                  <Download className="h-4 w-4" />
                  MP4
                </a>
              </Button>
            </div>
            <video src={result.videoUrl} controls className="aspect-video w-full rounded-md bg-black" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Capability({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 ${active ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
      {active ? "On" : "Check"}: {label}
    </span>
  );
}
