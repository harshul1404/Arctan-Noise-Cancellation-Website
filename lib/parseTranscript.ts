import type { TranscriptPhrase } from "@/lib/alignedDubbing";

/**
 * Parse a pasted transcript in the format produced by the dubbing studio:
 *   [MM:SS.mmm - MM:SS.mmm] Speaker N | Phrase N: text
 *
 * Lines that don't match are silently skipped. The "Phrase N" part is optional.
 */
export function parseTranscriptText(raw: string): TranscriptPhrase[] {
  const phrases: TranscriptPhrase[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(
      /^\[(\d+):(\d+(?:\.\d+)?)\s*-\s*(\d+):(\d+(?:\.\d+)?)\]\s*Speaker\s+(\S+?)\s*\|(?:\s*Phrase\s+\d+:)?\s*(.+)$/i
    );
    if (!match) continue;

    const start = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
    const end = parseInt(match[3], 10) * 60 + parseFloat(match[4]);
    const speakerId = match[5].replace(/[^\w]/g, "");
    const translatedText = match[6].trim();

    if (end > start && translatedText) {
      phrases.push({ index: phrases.length, start, end, speakerId, translatedText });
    }
  }

  return phrases;
}
