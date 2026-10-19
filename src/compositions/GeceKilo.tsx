/**
 * "Gece yemek yemek gerçekten kilo aldırır mı?" (~40 sn) — kullanıcının metni, 40 sn'ye sığsın diye sıkılaştırıldı.
 * Bora (kıvırcık, `CurlyGuy`), tek anlatıcı (Chris). Kanca ilk karede ekranda; fon rengi sahneye göre yumuşakça değişir.
 * Sahneler: kanca → gece mutfak (saat 12, buzdolabı açılır) → kapıdan "Gece yersen kilo alırsın!" → öğlen/gece aynı sandviç →
 * saat 12'yi vurur, "yağ depola?" → EFSANE → uyurken bile kalori yakar → terazi (alınan > ihtiyaç) → ağır yemek uykuyu bozar →
 * özet (ne kadar yediğin + ne kadar tok yattığın) → "gece yeme" diyene gönder.
 * Metin `icerik/gece-kilo.seslendirme.txt` (kelime sayıları satır satır aynı olmalı). Ses yoksa zamanlar okuma hızından (sessiz taslak).
 */
import { AbsoluteFill, Audio, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, type CurlyExpr, type CurlyPose } from "../avatar/CurlyGuy";
import { Bed, Bubble, Burger, Check, Clock, Cross, Flame, Floor, Fridge, Moon, PhoneItem, Pill, Pizza, Sandwich, Scale, SleepBar, Txt, Window } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#3ccf7a";
const FLOOR = 1400;

export const GK_LINES: Line[] = [
  { text: "Gece yemek yemek gerçekten kilo aldırır mı?", hl: ["kilo", "aldırır"], hold: 0.3 },
  { text: "Saat gece on iki. Buzdolabını açtın.", hl: ["on", "iki."], hold: 0.2 },
  { text: "Tam yiyecekken aklına o cümle geldi: “Gece yersen kilo alırsın!”", hl: ["kilo", "alırsın!”"], hold: 0.3 },
  { text: "Aynı sandviç öğlen sorun değil de, gece neden olsun?", hl: ["öğlen", "gece"], hold: 0.3 },
  { text: "Saat on ikide vücudun yağ depolamaya mı başlıyor? Tabii ki hayır!", hl: ["yağ", "hayır!"], hold: 0.4 },
  { text: "Sen uyurken bile vücudun kalori yakmaya devam eder.", hl: ["uyurken", "yakmaya"], hold: 0.3 },
  { text: "Kilo aldıran saat değil, gün boyu ihtiyacından fazla kalori almak.", hl: ["saat", "değil,", "fazla"], hold: 0.4 },
  { text: "Ama yatmadan hemen önce ağır yemek, uykunu bozabilir.", hl: ["ağır", "uykunu"], hold: 0.3 },
  { text: "Yani mesele ne kadar yediğin ve yatağa ne kadar tok girdiğin.", hl: ["yediğin", "tok"], hold: 0.5 },
  { text: "Bunu hâlâ “gece yeme” diyen arkadaşına gönder!", hl: ["gönder!"], hold: 0.8 },
];

/** ekrandaki büyük yazıyla aynı olduğu için altyazısı gösterilmeyen satır (kanca) */
const NO_CAPTION = [0];

export const GK_TAIL = 1.4;
export const GK_TL = timeline(GK_LINES, GK_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of GK_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + GK_TAIL;
  return {
    starts,
    total,
    frames: Math.ceil(total * 30),
    at: (i: number) => (i >= starts.length ? total : starts[i]),
    idx: (t: number) => {
      let i = -1;
      while (i + 1 < starts.length && t >= starts[i + 1]) i++;
      return i;
    },
    wordAt: (line: number, k: number) => ws(offs[line] + k),
  };
};

/** satır içindeki k. kelimenin zamanı (ses yoksa satıra eşit yayılır) */
const wordTime = (tl: TL, line: number, k: number) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = words(GK_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (GK_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0 || NO_CAPTION.includes(i)) return null;
  const line = GK_LINES[i];
  const ws = words(line);
  const chunks: number[] = [];
  for (let k = 0; k < ws.length; ) {
    chunks.push(k);
    k += ws.length - k === 4 ? 2 : Math.min(3, ws.length - k);
  }
  let c = 0;
  while (c + 1 < chunks.length && t >= wordTime(tl, i, chunks[c + 1]) - 0.04) c++;
  const from = chunks[c];
  const to = c + 1 < chunks.length ? chunks[c + 1] : ws.length;
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center" }}>
      {ws.slice(from, to).map((w, k) => {
        const wt = tl.wordAt ? wordTime(tl, i, from + k) - 0.06 : wordTime(tl, i, from) + k * 0.05;
        const p = sm(t, wt, wt + 0.16);
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 90,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
              transform: `translateY(${(1 - p) * 14}px)`,
              opacity: p,
            }}
          >
            {w.replace(/[“”]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ Bora

type P = [number, number];
const mixP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

/** Bora: ayak ortası (x, y), s ölçek (~880 birim boy) */
const BoraAt: React.FC<{ x: number; y?: number; s: number; pose?: CurlyPose; expr?: CurlyExpr; t: number; uid: string; item?: React.ReactNode }> = ({ x, y = FLOOR, s, pose, expr, t, uid, item }) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} />
  </g>
);
const boraPt = (x: number, s: number, p: P): P => [x + (p[0] - 200) * s, FLOOR + (p[1] - 880) * s];

// ------------------------------------------------------------ küçük çizimler

const Sun: React.FC<{ x: number; y: number; r: number; t: number }> = ({ x, y, r, t }) => (
  <g transform={`translate(${x},${y}) rotate(${t * 12})`}>
    {Array.from({ length: 10 }).map((_, k) => (
      <line key={k} x1={0} y1={-r - 14} x2={0} y2={-r - 40} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${k * 36})`} />
    ))}
    <circle r={r} fill={Y} stroke={INK} strokeWidth={7} />
  </g>
);

/** kapalı buzdolabı (açılınca `Fridge` ile değişir) */
const FridgeClosed: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <rect x={x} y={560} width={300} height={FLOOR - 560} rx={22} fill="#e8eef6" stroke={INK} strokeWidth={8} />
    <line x1={x} y1={820} x2={x + 300} y2={820} stroke={INK} strokeWidth={6} />
    <line x1={x + 260} y1={620} x2={x + 260} y2={760} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    <line x1={x + 260} y1={880} x2={x + 260} y2={1060} stroke={INK} strokeWidth={10} strokeLinecap="round" />
  </g>
);

/** panel kartı (öğlen / gece) */
const Panel: React.FC<{ x: number; fill: string; o: number; children: React.ReactNode }> = ({ x, fill, o, children }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0,${(1 - o) * 16})`}>
      <rect x={x} y={260} width={420} height={520} rx={40} fill={fill} stroke={INK} strokeWidth={8} />
      {children}
    </g>
  );

// ------------------------------------------------------------ ana kompozisyon

export type GeceKiloProps = { audioName: string; data: VoiceoverData | null };

export const GeceKilo: React.FC<GeceKiloProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : GK_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  // önceki sahne tamamen sönünce yenisi gelir (üst üste binen hayalet görüntü olmasın)
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);

  // ===== 0: kanca
  const s0 = scene(0, 1);
  // ===== 1-2: gece mutfak
  const s1 = scene(1, 3);
  const opened = sm(t, W(1, 4) - 0.1, W(1, 4) + 0.3); // "Buzdolabını açtın"
  const reach = sm(t, W(2, 0) - 0.1, W(2, 1) + 0.1); // sandviçi ağzına götürür
  const freeze = sm(t, W(2, 2) - 0.1, W(2, 2) + 0.25); // "aklına…" → donar
  const shout = W(2, 5); // "Gece yersen kilo alırsın!"
  // ===== 3: öğlen / gece
  const s3 = scene(3, 4);
  // ===== 4: saat 12 → yağ depola? → hayır
  const s4 = scene(4, 5);
  const spin = interpolate(t, [L(4) - 0.1, W(4, 2) + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spinE = 1 - (1 - spin) ** 3;
  const no4 = W(4, 8); // "Tabii ki hayır!"
  const shake = t > no4 ? Math.sin((t - no4) * 14) * 6 * Math.exp(-(t - no4) * 1.6) : 0;
  // ===== 5: uyurken bile yakar
  const s5 = scene(5, 6);
  const burn = interpolate(t, [W(5, 3), L(6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ===== 6: terazi
  const s6 = scene(6, 7);
  const more = W(6, 7); // "fazla kalori"
  const tilt = interpolate(t, [more - 0.1, more + 0.7], [0, -14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ===== 7: ağır yemek → uyku bozulur
  const s7 = scene(7, 8);
  const sleep7 = W(7, 6); // "uykunu bozabilir"
  // ===== 8: özet
  const s8 = scene(8, 9);
  // ===== 9: kapanış
  const s9 = scene(9, 10);

  // fon rengi sahneye göre değişir; geçişte yumuşak renk kayması
  const SCENE_BG: [number, string, string][] = [
    [0, "#4f5f8c", "#3a4772"], // kanca: gece mavisi
    [1, "#5f6f96", "#46557a"], // mutfak, gece: akşam mavisi
    [3, "#cfe1f3", "#b3cbe6"], // öğlen/gece: açık gök mavisi
    [4, "#e6dcf5", "#cfc0ea"], // saat: açık lila
    [5, "#8c84b6", "#6d6699"], // uyku: lavanta
    [6, "#d4ebe0", "#b9dccb"], // terazi: mint
    [7, "#7d76a8", "#5f5a8a"], // yatak odası: koyu lavanta
    [8, "#f1e6d2", "#e2d2b6"], // özet: krem
    [9, "#f7cdb0", "#eeb08a"], // kapanış: şeftali
  ];
  let bgTop = SCENE_BG[0][1];
  let bgBot = SCENE_BG[0][2];
  for (let k = 1; k < SCENE_BG.length; k++) {
    const at = L(SCENE_BG[k][0]);
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, SCENE_BG[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, SCENE_BG[k][2]]);
  }
  const tint = "#2a2a3a";
  const fade = interpolate(t, [tl.total - 0.3, tl.total], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="gk-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="gk-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gk-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#gk-bg)" />
        <rect width={1080} height={1920} fill="url(#gk-glow)" />
        <Floor tint={tint} />

        {/* ===== 0: kanca (ilk karede ekranda: kapak görseli de olur) ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Moon x={860} y={200} r={80} />
            {[
              [140, 180],
              [300, 300],
              [640, 150],
              [980, 420],
            ].map(([a, b], k) => (
              <circle key={k} cx={a} cy={b} r={6} fill="#fff4c2" opacity={0.6 + 0.4 * Math.sin(t * 3 + k * 2)} />
            ))}
            <Txt x={540} y={440} size={104} fill="#ffffff" sw={16}>
              GECE YEMEK
            </Txt>
            <Txt x={540} y={560} size={104} fill={Y} sw={16}>
              KİLO ALDIRIR MI?
            </Txt>
            <BoraAt
              uid="gk0"
              x={540}
              s={0.95}
              t={t}
              pose={{ r: { el: [300, 500], wr: [300, 400] }, head: -4 + Math.sin(t * 2) * 2 }}
              expr="think"
              item={<Sandwich x={0} y={-12} s={0.5} rot={8} />}
            />
            <g transform={`translate(800,${880 + Math.sin(t * 3) * 10})`}>
              <Txt x={0} y={0} size={180} fill={Y} sw={14}>
                ?
              </Txt>
            </g>
          </g>
        ) : null}

        {/* ===== 1-2: gece mutfak ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            <Window x={140} y={150} w={250} h={210} t={t} />
            <g opacity={sm(t, W(1, 0) - 0.1, W(1, 0) + 0.25)}>
              <Clock x={600} y={250} r={90} h={12} m={0} />
              <Pill x={600} y={400} text="00:00" o={sm(t, W(1, 2), W(1, 2) + 0.3)} size={40} />
            </g>
            <g opacity={1 - opened}>
              <FridgeClosed x={110} />
            </g>
            <g opacity={opened}>
              <Fridge x={110} t={t} />
            </g>
            <BoraAt
              uid="gk1"
              x={600}
              s={1.12}
              t={t}
              pose={
                opened < 0.5
                  ? { l: { el: [108, 520], wr: [60, 440], hand: "open" }, head: -6 }
                  : { r: { el: mixP([300, 520], [300, 480], reach), wr: mixP([300, 430], [238, 300], reach * (1 - freeze * 0.6)) }, head: -3 * freeze }
              }
              expr={freeze > 0.5 ? "surprise" : reach > 0.3 ? "grin" : "smile"}
              item={opened > 0.5 ? <g opacity={sm(t, W(1, 5), W(1, 5) + 0.3)}><Sandwich x={0} y={-12} s={0.5} rot={-10 + 20 * freeze} /></g> : undefined}
            />
            {/* aralık kapı: ses buradan gelir */}
            <rect x={930} y={420} width={170} height={FLOOR - 420} fill={tint} opacity={0.55} />
            <rect x={930} y={420} width={170} height={FLOOR - 420} fill="none" stroke={INK} strokeWidth={8} opacity={0.6} />
            <path d={`M930,${FLOOR} L860,${FLOOR + 160} L1080,${FLOOR + 160} L1080,${FLOOR} Z`} fill="#fff4c2" opacity={0.18} />
            <Bubble x={420} y={430} w={600} h={210} tx={985} ty={700} o={sm(t, shout - 0.25, shout)} lines={["GECE YERSEN", "KİLO ALIRSIN!"]} size={56} />
            {freeze > 0 ? (
              <g opacity={freeze * (1 - sm(t, shout - 0.3, shout))} transform={`translate(800,${600 + Math.sin(t * 3) * 10})`}>
                <Txt x={0} y={0} size={160} fill={Y} sw={14}>
                  !
                </Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 3: aynı sandviç, öğlen / gece ===== */}
        {s3 > 0 ? (
          <g opacity={s3}>
            <Panel x={70} fill="#fff6d8" o={sm(t, W(3, 2) - 0.2, W(3, 2) + 0.1)}>
              <Sun x={280} y={390} r={62} t={t} />
              <Sandwich x={280} y={600} s={1.1} />
              <Txt x={280} y={740} size={58} fill={INK} sw={0}>
                ÖĞLEN
              </Txt>
              <Check x={420} y={300} s={40} p={sm(t, W(3, 3), W(3, 3) + 0.4)} />
            </Panel>
            <Panel x={590} fill="#2b3a6b" o={sm(t, W(3, 6) - 0.2, W(3, 6) + 0.1)}>
              <Moon x={800} y={390} r={62} />
              <Sandwich x={800} y={600} s={1.1} />
              <Txt x={800} y={740} size={58} fill="#ffffff" sw={0}>
                GECE
              </Txt>
            </Panel>
            <g opacity={sm(t, W(3, 6), W(3, 6) + 0.3)}>
              <circle cx={540} cy={560} r={52} fill="#ffffff" stroke={INK} strokeWidth={7} />
              <Txt x={540} y={586} size={80} fill={INK} sw={0}>
                =
              </Txt>
            </g>
            <BoraAt
              uid="gk3"
              x={540}
              s={0.62}
              t={t}
              pose={t < W(3, 7) - 0.2 ? { r: { el: [290, 500], wr: [228, 300] } } : { r: { el: [300, 470], wr: [252, 300], hand: "open" }, l: { el: [100, 470], wr: [148, 300], hand: "open" } }}
              expr={t < W(3, 7) - 0.2 ? "think" : "surprise"}
            />
            <g opacity={sm(t, W(3, 7), W(3, 7) + 0.3)} transform={`translate(760,${1020 + Math.sin(t * 3) * 10})`}>
              <Txt x={0} y={0} size={150} fill={Y} sw={14}>
                ?
              </Txt>
            </g>
          </g>
        ) : null}

        {/* ===== 4: saat 12 → yağ depola? → hayır ===== */}
        {s4 > 0 ? (
          <g opacity={s4}>
            <Clock x={540} y={400} r={170} h={9 + 3 * spinE} m={60 * 6 * spinE} />
            <Pill x={540} y={640} text="00:00" o={sm(t, W(4, 2), W(4, 2) + 0.3)} size={46} />
            {(() => {
              const o = sm(t, W(4, 4) - 0.1, W(4, 4) + 0.25);
              const x = sm(t, no4, no4 + 0.4);
              return o > 0 ? (
                <g opacity={o}>
                  <Pill x={380} y={800} text="YAĞ DEPOLA?" o={1} color={Y} size={60} />
                  <Cross x={380} y={790} s={56} p={x} />
                </g>
              ) : null;
            })()}
            {(() => {
              const p = sm(t, no4 - 0.05, no4 + 0.3);
              return p > 0 ? (
                <g opacity={p} transform={`translate(270,1180) rotate(-12) scale(${1.12 - 0.12 * p})`}>
                  <rect x={-210} y={-70} width={420} height={140} rx={22} fill="none" stroke={RED} strokeWidth={14} />
                  <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={88} fill={RED} letterSpacing={4}>
                    EFSANE
                  </text>
                </g>
              ) : null;
            })()}
            <BoraAt
              uid="gk4"
              x={740}
              s={0.78}
              t={t}
              pose={t < no4 - 0.2 ? { r: { el: [300, 470], wr: [252, 300], hand: "open" }, head: 3 } : { r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: 10 }, head: shake }}
              expr={t < no4 - 0.2 ? "surprise" : "grin"}
            />
          </g>
        ) : null}

        {/* ===== 5: uyurken bile kalori yakar ===== */}
        {s5 > 0 ? (
          <g opacity={s5}>
            <Window x={90} y={220} w={260} h={220} t={t} />
            <Bed />
            <BoraAt uid="gk5" x={430} s={1.12} t={t} pose={{ r: { el: [300, 470], wr: [252, 300], hand: "open" }, head: 6 + Math.sin(t * 1.5) * 2 }} expr="yawn" />
            {/* uykudaki Z'ler */}
            {["Z", "z", "z"].map((z, k) => {
              const p = ((t * 0.5 + k / 3) % 1 + 1) % 1;
              return (
                <g key={k} opacity={sm(t, L(5), L(5) + 0.3) * Math.sin(p * Math.PI)} transform={`translate(${600 + p * 120},${560 - p * 220})`}>
                  <Txt x={0} y={0} size={86 - k * 14} fill="#ffffff">
                    {z}
                  </Txt>
                </g>
              );
            })}
            {/* vücuttan yükselen küçük alevler: yakmaya devam */}
            {burn > 0
              ? [0, 1, 2, 3].map((k) => {
                  const b = boraPt(430, 1.12, [200, 520]);
                  const p = ((t * 0.6 + k / 4) % 1 + 1) % 1;
                  return (
                    <g key={k} opacity={sm(t, W(5, 3), W(5, 3) + 0.3) * Math.sin(p * Math.PI)}>
                      <Flame x={b[0] + (k % 2 ? 180 : -180) + Math.sin(k * 3) * 30} y={b[1] - p * 300} s={0.62} t={t + k} />
                    </g>
                  );
                })
              : null}
            <g opacity={sm(t, W(5, 4) - 0.1, W(5, 4) + 0.3)}>
              <rect x={600} y={760} width={420} height={170} rx={34} fill="#ffffff" stroke={INK} strokeWidth={7} />
              <Flame x={680} y={845} s={0.6} t={t} />
              <Txt x={850} y={830} size={62} fill={INK} sw={0}>
                {`+${Math.round(burn * 65)}`}
              </Txt>
              <Txt x={850} y={895} size={40} fill={INK} sw={0}>
                kcal
              </Txt>
            </g>
          </g>
        ) : null}

        {/* ===== 6: terazi — saat değil, toplam ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <Scale
              a={tilt}
              left={
                <g>
                  <Burger x={-70} y={-60} s={0.8} />
                  <Pizza x={50} y={-60} s={0.7} rot={-20} />
                  {sm(t, more - 0.1, more + 0.3) > 0 ? <Sandwich x={0} y={-150 - (1 - sm(t, more - 0.1, more + 0.3)) * 500} s={0.6} /> : null}
                </g>
              }
              right={
                <g>
                  <Flame x={-30} y={-52} s={0.8} t={t} />
                </g>
              }
            />
            <Pill x={190} y={1110 - 180 * Math.sin((tilt * Math.PI) / 180)} text="ALINAN" o={sm(t, W(6, 4), W(6, 4) + 0.3)} color={Y} size={44} />
            <Pill x={890} y={1110 + 180 * Math.sin((tilt * Math.PI) / 180)} text="İHTİYAÇ" o={sm(t, W(6, 6), W(6, 6) + 0.3)} color={Y} size={44} />
            <g opacity={sm(t, L(6) + 0.1, L(6) + 0.4)}>
              <Clock x={540} y={300} r={100} h={12} m={0} />
              <Cross x={540} y={300} s={70} p={sm(t, W(6, 3), W(6, 3) + 0.4)} />
            </g>
            <Pill x={540} y={1395} text="FAZLA KALORİ = KİLO" o={sm(t, more + 0.4, more + 0.7)} color={RED} ink="#fff" size={52} />
          </g>
        ) : null}

        {/* ===== 7: yatmadan önce ağır yemek → uyku bozulur ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            <Window x={90} y={220} w={260} h={220} t={t} />
            <Bed />
            <BoraAt
              uid="gk7"
              x={430}
              s={1.12}
              t={t}
              pose={
                t > sleep7 - 0.1
                  ? { r: { el: [300, 470], wr: [252, 300], hand: "open" }, head: 4 }
                  : { r: { el: [292, 560], wr: [236, 560], hand: "open" }, l: { el: [108, 560], wr: [164, 560], hand: "open" }, head: 4 }
              }
              expr={t > sleep7 - 0.1 ? "yawn" : t > W(7, 5) ? "ouch" : "think"}
            />
            {(() => {
              const d = sm(t, W(7, 4) - 0.1, W(7, 5) + 0.4); // "ağır yemek" mideye iner
              const belly = boraPt(430, 1.12, [200, 560]);
              const o = sm(t, L(7) + 0.1, L(7) + 0.4) * (1 - d * 0.9);
              return (
                <g opacity={o}>
                  <g transform={`translate(${mixP([720, 560], belly, d).join(",")}) scale(${1 - 0.6 * d})`}>
                    <Burger x={0} y={0} s={1.1} />
                  </g>
                  <g transform={`translate(${mixP([900, 760], belly, d).join(",")}) scale(${1 - 0.6 * d})`}>
                    <Pizza x={0} y={0} s={1.1} rot={-15} />
                  </g>
                  <Pill x={810} y={1000} text="YATMADAN ÖNCE" o={1 - d} color={RED} ink="#fff" size={44} />
                </g>
              );
            })()}
            <SleepBar x={640} y={300} v={interpolate(t, [sleep7, sleep7 + 1.2], [0.95, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} o={sm(t, W(7, 5), W(7, 5) + 0.3)} />
            {["Z", "z", "z"].map((z, k) => {
              const broken = sm(t, sleep7 + k * 0.15, sleep7 + 0.4 + k * 0.15);
              return (
                <g key={k} opacity={sm(t, W(7, 5), W(7, 5) + 0.3) * (1 - broken * 0.8)} transform={`translate(${760 + k * 70},${620 - k * 70 + broken * 160}) rotate(${broken * (k % 2 ? 40 : -40)})`}>
                  <Txt x={0} y={0} size={90 - k * 16} fill="#ffffff">
                    {z}
                  </Txt>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ===== 8: özet ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <rect x={90} y={200} width={900} height={620} rx={44} fill="#ffffff" stroke={INK} strokeWidth={9} />
            <g opacity={sm(t, L(8) + 0.1, L(8) + 0.4)}>
              <Clock x={210} y={320} r={62} h={12} m={0} />
              <Txt x={310} y={345} size={70} fill={INK} sw={0} anchor="start">
                SAAT
              </Txt>
              <Cross x={870} y={320} s={44} p={sm(t, W(8, 1), W(8, 1) + 0.4)} />
            </g>
            <line x1={140} y1={420} x2={940} y2={420} stroke={INK} strokeWidth={4} opacity={0.2} />
            <g opacity={sm(t, W(8, 2) - 0.1, W(8, 2) + 0.2)}>
              <Burger x={200} y={540} s={0.7} />
              <Txt x={290} y={555} size={56} fill={INK} sw={0} anchor="start">
                NE KADAR YEDİN
              </Txt>
              <Check x={890} y={530} s={40} p={sm(t, W(8, 4), W(8, 4) + 0.4)} />
            </g>
            <g opacity={sm(t, W(8, 6) - 0.1, W(8, 6) + 0.2)}>
              <Moon x={200} y={700} r={44} />
              <Txt x={290} y={720} size={56} fill={INK} sw={0} anchor="start">
                NE KADAR TOK YATTIN
              </Txt>
              <Check x={890} y={695} s={40} p={sm(t, W(8, 10), W(8, 10) + 0.4)} />
            </g>
            <BoraAt uid="gk8" x={540} s={0.6} t={t} pose={{ r: { el: [300, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
          </g>
        ) : null}

        {/* ===== 9: kapanış ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <BoraAt uid="gk9" x={500} s={1.0} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="laugh" item={<PhoneItem />} />
            <g opacity={sm(t, L(9) + 0.2, L(9) + 0.5)}>
              <Txt x={540} y={330} size={84} fill="#ffffff" sw={14}>
                “GECE YEME”
              </Txt>
              <Txt x={540} y={430} size={84} fill={Y} sw={14}>
                DİYENE GÖNDER!
              </Txt>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#gk-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {/* konuşmanın altında kısık müzik; kapanışta biraz yükselir */}
          <Audio
            src={staticFile("music/623.mp3")}
            volume={(f) => {
              const mt = f / fps;
              const end = data.durationInSeconds;
              const base = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.04, 0.04, 0.09], { extrapolateRight: "clamp" });
              return base * interpolate(mt, [tl.total - 1.0, tl.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
