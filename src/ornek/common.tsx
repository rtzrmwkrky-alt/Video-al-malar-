/**
 * Sessiz örnek videolar için ortak parçalar.
 *
 * Seslendirme yokken zamanlama metin satırlarından hesaplanır (okuma hızına göre).
 * Satırlar ileride seslendirme metni olarak da kullanılacak; sahneler satır sırasına
 * (`at(i)`) bağlı olduğu için sonra ses eklenince sadece zamanlar değişir.
 */
import { Easing, interpolate, spring } from "remotion";
import { SANS } from "../fonts";

export const FPS = 30;

/** hl: vurgulanacak kelimeler (altyazıda renkli) */
export type Line = { text: string; hl?: string[]; hold?: number };

const lineDur = (l: Line) => {
  const n = l.text.split(/\s+/).filter(Boolean).length;
  return Math.max(1.7, 0.29 * n + 0.6) + (l.hold ?? 0);
};

export const timeline = (lines: Line[], tail = 0) => {
  const starts: number[] = [];
  let acc = 0.4;
  for (const l of lines) {
    starts.push(acc);
    acc += lineDur(l);
  }
  const total = acc + tail;
  return {
    starts,
    total,
    frames: Math.ceil(total * FPS),
    at: (i: number) => (i >= starts.length ? acc : starts[i]),
    /** şu an hangi satır */
    idx: (t: number) => {
      let i = -1;
      while (i + 1 < starts.length && t >= starts[i + 1]) i++;
      return i;
    },
  };
};

export const smooth = Easing.bezier(0.45, 0, 0.25, 1);
/** a→b arasında 0→1 yumuşak geçiş */
export const sm = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: smooth, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
/** a'da açılır, b'de kapanır (fade süresi f) */
export const win = (t: number, a: number, b: number, f = 0.25) => sm(t, a, a + f) * (1 - sm(t, b - f, b));

export const pop = (t: number, at: number, fps = FPS, damping = 12) =>
  t < at ? 0 : spring({ frame: Math.round((t - at) * fps), fps, config: { damping, mass: 0.5 } });

/** Türkçe büyük harf */
export const up = (s: string) => s.toLocaleUpperCase("tr-TR");

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"'’]/g, "");

/** Satır içindeki vurgulu kelimeleri renklendirir. */
export const HlText: React.FC<{ line: Line; color: string; base?: string; reveal?: number }> = ({
  line,
  color,
  base = "white",
  reveal = 1,
}) => {
  const words = line.text.split(/\s+/);
  const hl = (line.hl ?? []).map(norm);
  const shown = Math.ceil(words.length * reveal);
  return (
    <>
      {words.map((w, i) => (
        <span key={i} style={{ color: hl.includes(norm(w)) ? color : base, opacity: i < shown ? 1 : 0 }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
};

/**
 * Alt yazı: satır satır, kelimeler hızlıca belirir (sessiz izleyen okusun diye
 * her satır okuma süresince ekranda kalır).
 */
export const Subtitle: React.FC<{
  lines: Line[];
  tl: ReturnType<typeof timeline>;
  t: number;
  color: string;
  top?: number;
  size?: number;
  font?: string;
  weight?: number;
  base?: string;
  box?: boolean;
  stroke?: string;
  hidden?: (i: number) => boolean;
}> = ({ lines, tl, t, color, top = 1380, size = 64, font = SANS, weight = 800, base = "white", box, stroke, hidden }) => {
  const i = tl.idx(t);
  if (i < 0 || hidden?.(i)) return null;
  const l = lines[i];
  const s = tl.at(i);
  const e = tl.at(i + 1);
  const reveal = interpolate(t, [s, s + Math.min(0.9, (e - s) * 0.45)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = sm(t, s, s + 0.12) * (1 - sm(t, e - 0.12, e));
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top,
        textAlign: "center",
        opacity: o,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.18,
        letterSpacing: -0.5,
        textWrap: "balance",
        ...(stroke ? { WebkitTextStroke: `8px ${stroke}`, paintOrder: "stroke" } : {}),
        ...(box ? {} : { textShadow: "0 4px 18px rgba(0,0,0,0.55)" }),
      }}
    >
      <span
        style={
          box
            ? {
                background: "rgba(0,0,0,0.55)",
                padding: "10px 22px",
                borderRadius: 18,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }
            : undefined
        }
      >
        <HlText line={l} color={color} base={base} reveal={reveal} />
      </span>
    </div>
  );
};
