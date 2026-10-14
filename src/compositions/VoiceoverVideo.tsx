import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VoiceoverData, Word } from "../types";

export type VoiceoverVideoProps = {
  /** public/audio/<audioName>.mp3 ve .json dosyalarının adı */
  audioName: string;
  title: string;
  /** calculateMetadata tarafından doldurulur */
  data: VoiceoverData | null;
};

const WORDS_PER_PAGE = 3;

/** Kelimeleri kısa, okunabilir altyazı sayfalarına böler. */
const toPages = (words: Word[]): Word[][] => {
  const pages: Word[][] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
    pages.push(words.slice(i, i + WORDS_PER_PAGE));
  }
  return pages;
};

const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pages = toPages(words);
  const page = pages.find(
    (p, i) => t >= p[0].start && t < (pages[i + 1]?.[0].start ?? Infinity),
  );
  if (!page) return null;

  const pageStartFrame = Math.round(page[0].start * fps);
  const pop = spring({ frame: frame - pageStartFrame, fps, durationInFrames: 8 });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 520,
        width: "100%",
        textAlign: "center",
        padding: "0 80px",
        transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`,
      }}
    >
      {page.map((w, i) => {
        const active = t >= w.start && t < w.end;
        return (
          <span
            key={i}
            style={{
              fontSize: 96,
              fontWeight: 900,
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
              textTransform: "uppercase",
              color: active ? "#FFD60A" : "white",
              WebkitTextStroke: "4px black",
              paintOrder: "stroke",
              marginRight: 24,
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

export const VoiceoverVideo: React.FC<VoiceoverVideoProps> = ({
  audioName,
  title,
  data,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, durationInFrames: 20 });

  return (
    <AbsoluteFill
      lang="tr"
      style={{
        background: "linear-gradient(160deg, #1e1b4b 0%, #7c3aed 55%, #db2777 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 260,
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: 72,
          fontWeight: 800,
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
        }}
      >
        {title}
      </div>

      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Captions words={data.words} />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            bottom: 520,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.8)",
            fontSize: 44,
            fontFamily: "Inter, Helvetica, Arial, sans-serif",
            padding: "0 80px",
          }}
        >
          Seslendirme yok. Önce: npm run voice -- --name {audioName} "Metin"
        </div>
      )}
    </AbsoluteFill>
  );
};
