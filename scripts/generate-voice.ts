/**
 * ElevenLabs ile metinden seslendirme üretir.
 *
 * Kullanım:
 *   npm run voice -- --name ornek "Seslendirilecek metin"
 *   npm run voice -- --name ornek --file metin.txt
 *   npm run voice -- --name ornek --voice <voiceId> "Metin"
 *
 * Çıktılar:
 *   public/audio/<name>.mp3   -> ses
 *   public/audio/<name>.json  -> kelime zamanlamaları (altyazı için)
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { VoiceoverData, Word } from "../src/types";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: "string", default: "ornek" },
    file: { type: "string" },
    voice: { type: "string" },
    model: { type: "string" },
  },
});

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY eksik. .env.example dosyasını .env olarak kopyalayıp doldurun.");
  process.exit(1);
}

const text = values.file
  ? (await readFile(values.file, "utf8")).trim()
  : positionals.join(" ").trim();
if (!text) {
  console.error('Metin verilmedi. Örnek: npm run voice -- --name ornek "Merhaba!"');
  process.exit(1);
}

const voiceId = values.voice ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
const modelId = values.model ?? process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

const client = new ElevenLabsClient({ apiKey });

console.log(`Seslendiriliyor (voice=${voiceId}, model=${modelId})...`);
const res = await client.textToSpeech.convertWithTimestamps(voiceId, {
  text,
  modelId,
  outputFormat: "mp3_44100_128",
});

/** Karakter zamanlamalarını kelime zamanlamalarına çevirir. */
const toWords = (chars: string[], starts: number[], ends: number[]): Word[] => {
  const words: Word[] = [];
  let current: Word | null = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (current) words.push(current);
      current = null;
      return;
    }
    if (!current) current = { text: "", start: starts[i], end: ends[i] };
    current.text += c;
    current.end = ends[i];
  });
  if (current) words.push(current);
  return words;
};

const alignment = res.alignment ?? res.normalizedAlignment;
const words = alignment
  ? toWords(
      alignment.characters,
      alignment.characterStartTimesSeconds,
      alignment.characterEndTimesSeconds,
    )
  : [];

const data: VoiceoverData = {
  text,
  durationInSeconds: words.at(-1)?.end ?? 0,
  words,
};

const outDir = path.join("public", "audio");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, `${values.name}.mp3`), Buffer.from(res.audioBase64, "base64"));
await writeFile(path.join(outDir, `${values.name}.json`), JSON.stringify(data, null, 2));

console.log(`Hazır: public/audio/${values.name}.mp3 (${data.durationInSeconds.toFixed(1)} sn, ${words.length} kelime)`);
console.log(`Studio: npm run dev  |  Render: npx remotion render VoiceoverVideo out/${values.name}.mp4 --props='{"audioName":"${values.name}","title":"...","data":null}'`);
