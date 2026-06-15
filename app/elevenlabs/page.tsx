import { ElevenLabsDashboard } from "@/components/elevenlabs/ElevenLabsDashboard";
import { getMaxUploadBytes } from "@/lib/validation";

export const metadata = { title: "ElevenLabs Dubbing — Experiment" };

export default function ElevenLabsPage() {
  const maxMb = Math.round(getMaxUploadBytes() / 1024 / 1024);
  return <ElevenLabsDashboard maxUploadMb={maxMb} />;
}
