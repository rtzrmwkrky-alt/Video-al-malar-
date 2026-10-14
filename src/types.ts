export type Word = {
  text: string;
  start: number; // saniye
  end: number; // saniye
};

/** scripts/generate-voice.ts tarafından public/audio/<ad>.json olarak yazılır. */
export type VoiceoverData = {
  text: string;
  durationInSeconds: number;
  words: Word[];
};
