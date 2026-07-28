/**
 * Generates a clean 16-bit PCM WAV audio base64 data URL in memory.
 * Creates smooth vocal acoustic harmonic tones so native audio playback works
 * seamlessly in any browser or iframe without harsh distortion or network calls.
 */
export function generateSyntheticAudioDataUrl(durationSeconds: number = 30): string {
  const sampleRate = 16000;
  const numChannels = 1;
  const effectiveSecs = Math.min(durationSeconds, 20);
  const numSamples = sampleRate * effectiveSecs;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF header */
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  /* fmt chunk */
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  /* data chunk */
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  /* Generate soft, warm harmonic acoustic waves simulating natural dialogue pitch */
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Switch pitch gently every 3 seconds to simulate consultant & customer dialogue
    const isConsultant = Math.floor(t / 3) % 2 === 0;
    const baseFreq = isConsultant ? 140 : 190;
    
    // Soft envelope to simulate natural speech pauses between phrases
    const pauseFactor = Math.sin(t * Math.PI * 0.8) > 0 ? 1 : 0.2;
    const smoothEnvelope = Math.sin((t % 3) / 3 * Math.PI); // Attack and release

    const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
    const harmonic1 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.3;
    const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;

    const combinedWave = (fundamental + harmonic1 + harmonic2) * smoothEnvelope * pauseFactor * 0.2;
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(combinedWave * 12000)));
    view.setInt16(44 + i * 2, int16, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }

  return "data:audio/wav;base64," + btoa(binary);
}

