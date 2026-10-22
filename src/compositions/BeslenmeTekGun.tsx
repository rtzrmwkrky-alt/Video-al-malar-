/**
 * "Tek gün, iki son" (~30 sn) — beslenme ve spor videosu sıfırdan (kullanıcı: "basit, akıcı, herkes anlasın, izleyen kendini görsün").
 * Aynı genç aynı günü iki kez yaşar. Önce SENİN GÜNÜN: 08:00 sadece kahve ✕, 13:00 tek poğaça ✕, 18:00 salonda kendini paralar ✓,
 * 03:00 telefon ✕ → aynada kol 32 cm, AYNI. Sonra gün geri sarılır, AYNI GÜN · DOĞRU HALİ: kahvaltı ✓, dolu tabak ✓, aynı antrenman ✓,
 * 23:00 uyku ✓ → kısa bir an kolun içi (yırtıklar yemek ve uykuyla onarılır, kas kalınlaşır) → 3 ay sonra 36 cm → gönder → döngü.
 * Ekranda yazı az: üstte bölüm etiketi + saat, yanda ✓/✕. Metin `icerik/tek-gun.seslendirme.txt` (kelime sayıları satır satır aynı).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { Clock, Moon, PhoneItem } from "./GeceYemek";
import { DB, GymSign, HeroAt, Plates, Rack, Sweat } from "./BeslenmeSpor";
import { EmptyPlate, Mirror, Pogaca } from "./BeslenmeSpor3";
import { Breakfast, Bulge, Lunch } from "./BeslenmeSpor4";
import { ArmCut, Chip, FLEX, Tape, curl } from "./BeslenmeSpor5";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#2fbf62";
const FLOOR = 1400;

export const TG_LINES: Line[] = [
  { text: "Spor yapıp kas yapamıyorsan… sorun salonda değil.", hl: ["sorun", "değil."], hold: 0.4 },
  { text: "Senin günün şöyle: kahvaltı yok, öğlen bir poğaça…", hl: ["yok,", "poğaça…"], hold: 0.2 },
  { text: "Akşam salonda kendini paralıyorsun… gece üçe kadar telefon.", hl: ["paralıyorsun…", "üçe"], hold: 0.2 },
  { text: "Ve aynada yine aynı kol.", hl: ["aynı"], hold: 0.5 },
  { text: "Şimdi aynı günü bir de böyle yaşa.", hl: ["böyle"], hold: 0.2 },
  { text: "Kahvaltını yap, öğlen doyur kendini, aynı antrenman… ve erken yat.", hl: ["Kahvaltını", "doyur", "erken"], hold: 0.3 },
  { text: "Çünkü kas, salonda değil… sen yerken ve uyurken büyür.", hl: ["yerken", "uyurken", "büyür."], hold: 0.4 },
  { text: "Üç ay sonra:", hl: ["Üç", "ay"], hold: 1.0 },
  { text: "Bunu hâlâ aynı kolla gezen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

export const TG_TAIL = 0.6;
export const TG_TL = timeline(TG_LINES, TG_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of TG_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + TG_TAIL;
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

const wordTime = (tl: TL, line: number, k: number) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = words(TG_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (TG_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar, kalın kontur)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = TG_LINES[i];
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
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center", opacity: out }}>
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
              fontSize: 88,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
              transform: `translateY(${(1 - p) * 12}px)`,
              opacity: p,
            }}
          >
            {w.replace(/[“”…]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ sahne parçaları

/** üstte bölüm etiketi */
const Part: React.FC<{ text: string; color: string; o: number }> = ({ text, color, o }) => <Chip x={540} y={170} text={text} o={o} bg={color} fg={color === "#ffffff" ? INK : "#ffffff"} size={44} />;

/** saat rozeti: kadran + büyük saat */
const TimeBadge: React.FC<{ h: number; m?: number; label: string; o: number; dark?: boolean }> = ({ h, m = 0, label, o, dark = false }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <rect x={330} y={232} width={420} height={128} rx={64} fill={dark ? "#ffffff" : INK} fillOpacity={dark ? 0.12 : 0.88} />
      <g transform="translate(400,296) scale(0.62)">
        <Clock x={0} y={0} r={74} h={h} m={m} />
      </g>
      <text x={600} y={322} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} fill="#ffffff" letterSpacing={2}>
        {label}
      </text>
    </g>
  );

/** büyük ✓ / ✕ rozeti */
const Verdict: React.FC<{ ok: boolean; p: number }> = ({ ok, p }) =>
  p <= 0 ? null : (
    <g opacity={Math.min(1, p * 2)}>
      <circle cx={880} cy={560} r={78} fill={ok ? GREEN : RED} stroke={INK} strokeWidth={7} />
      {ok ? (
        <path d="M842,562 L870,592 L922,532" fill="none" stroke="#ffffff" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      ) : (
        <g stroke="#ffffff" strokeWidth={18} strokeLinecap="round">
          <line x1={850} y1={530} x2={850 + 60 * Math.min(1, p * 2)} y2={530 + 60 * Math.min(1, p * 2)} />
          {p > 0.5 ? <line x1={910} y1={530} x2={910 - 60 * (p * 2 - 1)} y2={530 + 60 * (p * 2 - 1)} /> : null}
        </g>
      )}
    </g>
  );

/** kahve bardağı (elde) */
const Cup: React.FC = () => (
  <g transform="translate(0,-40)">
    <path d="M-22,-30 L22,-30 L17,28 L-17,28 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-24} y={-40} width={48} height={12} rx={5} fill="#7a4a2a" stroke={INK} strokeWidth={4} />
    <rect x={-20} y={-6} width={40} height={14} fill="#b77a4a" />
  </g>
);

/** masa (sağda) */
const Table: React.FC = () => (
  <g>
    <rect x={600} y={1110} width={440} height={34} rx={12} fill="#c98b5a" stroke={INK} strokeWidth={7} />
    <rect x={640} y={1144} width={26} height={256} fill="#a86e44" stroke={INK} strokeWidth={6} />
    <rect x={976} y={1144} width={26} height={256} fill="#a86e44" stroke={INK} strokeWidth={6} />
  </g>
);

/** pencere (gündüz güneş / gece ay) */
const Win: React.FC<{ night?: boolean; t: number }> = ({ night = false, t }) => (
  <g>
    <rect x={90} y={460} width={260} height={230} rx={14} fill={night ? "#2b3a6b" : "#a8dcff"} stroke={INK} strokeWidth={8} />
    {night ? (
      <g>
        <Moon x={260} y={540} r={36} />
        {[
          [140, 510],
          [190, 640],
          [310, 650],
        ].map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r={4} fill="#fff4c2" opacity={0.6 + 0.4 * Math.sin(t * 3 + k * 2)} />
        ))}
      </g>
    ) : (
      <circle cx={270} cy={540} r={38} fill={Y} stroke={INK} strokeWidth={6} />
    )}
    <line x1={220} y1={460} x2={220} y2={690} stroke={INK} strokeWidth={7} />
    <line x1={90} y1={575} x2={350} y2={575} stroke={INK} strokeWidth={7} />
  </g>
);

const Ground: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <g>
    <rect x={0} y={FLOOR} width={1080} height={520} fill={dark ? "#000000" : "#2a2a3a"} opacity={dark ? 0.35 : 0.18} />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.5} />
  </g>
);

// ------------------------------------------------------------ ana kompozisyon

export type BeslenmeTekGunProps = { audioName: string; data: VoiceoverData | null };

type Shot = { from: number; to: number; bg: [string, string]; draw: (o: number) => React.ReactNode };

export const BeslenmeTekGun: React.FC<BeslenmeTekGunProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : TG_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const tc = t > L(8) ? t - T : t;
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);
  const v = (at: number) => sm(t, at, at + 0.4); // ✓/✕ çizimi

  const MORNING: [string, string] = ["#fff1d6", "#ffd9a8"];
  const NOON: [string, string] = ["#dff1ff", "#b8dcf7"];
  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const NIGHT: [string, string] = ["#26305c", "#141a38"];
  const INSIDE: [string, string] = ["#1b2a4e", "#0e1630"];
  const BAD = "SENİN GÜNÜN";
  const GOOD = "AYNI GÜN · DOĞRU HALİ";

  const gymScene = (o: number, label: string | null, ok: boolean | null, vAt: number, color: string) => (
    <g opacity={o}>
      <Ground />
      <GymSign x={90} y={460} />
      <Rack x={600} y={620} />
      <Plates x={150} />
      {label ? <Part text={label} color={color} o={1} /> : null}
      {label ? <TimeBadge h={6} label="18:00" o={1} dark /> : null}
      <HeroAt uid={label === null ? "tg-gym0" : label === BAD ? "tg-gym1" : "tg-gym2"} x={440} s={1} t={t} pose={curl(rep)} item={DB} expr={rep > 0.55 ? "ouch" : "neutral"} />
      <Sweat t={t} pts={[[370, 700], [510, 690]]} />
      {ok !== null ? <Verdict ok={ok} p={v(vAt)} /> : null}
    </g>
  );

  const mirrorScene = (o: number, after: boolean) => {
    const k = after ? sm(t, L(7) + 0.2, L(7) + 1.0) : 0;
    const cm = after ? Math.round(32 + 4 * k) : 32;
    return (
      <g opacity={o}>
        <Ground />
        <Win t={t} />
        <Part text={after ? "3 AY SONRA" : "ERTESİ SABAH"} color={after ? GREEN : RED} o={1} />
        <Mirror x={600} y={400} w={400} h={980} uid={after ? "tg-m2" : "tg-m1"}>
          <HeroAt uid={after ? "tg-mr2" : "tg-mr1"} x={800} y={1430} s={0.92} t={t} pose={{ l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 }} expr={after ? "laugh" : "ouch"} />
          <Bulge x={800} y={1430} s={0.92} side="l" k={k} />
          <rect x={600} y={400} width={400} height={980} fill="#bcd3e8" opacity={0.25} />
        </Mirror>
        <HeroAt uid={after ? "tg-mh2" : "tg-mh1"} x={300} s={1.02} t={t} pose={FLEX} expr={after ? "laugh" : "ouch"} />
        <Bulge x={300} s={1.02} side="r" k={k} />
        <Tape x={300} s={1.02} k={k} o={1} />
        <Chip x={300} y={330} text={`${cm} CM`} o={1} bg={after ? (k > 0.6 ? GREEN : Y) : Y} fg={after && k > 0.6 ? "#ffffff" : INK} size={70} />
        {!after ? <Chip x={800} y={330} text="AYNI" o={sm(t, W(3, 3) - 0.1, W(3, 3) + 0.2)} bg={RED} size={60} /> : null}
        {after ? <Chip x={800} y={330} text="+4 CM" o={sm(t, L(7) + 0.9, L(7) + 1.2)} bg={GREEN} size={60} /> : null}
      </g>
    );
  };

  // çekimler: her biri bir kelimede başlar, bir öncekinin bitişiyle değişir
  const S: Shot[] = [
    {
      from: -1,
      to: L(1),
      bg: GYM,
      draw: (o) => (
        <g opacity={o}>
          {gymScene(1, null, null, 0, RED)}
          <g opacity={1 - sm(t, W(0, 4) - 0.15, W(0, 4) + 0.1) * (t > L(8) ? 0 : 1)}>
            <text x={540} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
              SPOR VAR,
            </text>
            <text x={540} y={410} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
              KAS YOK?
            </text>
          </g>
          <g opacity={sm(t, W(0, 4) - 0.05, W(0, 4) + 0.2) * (t > L(8) ? 0 : 1)}>
            <text x={540} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
              SORUN
            </text>
            <text x={540} y={410} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={104} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
              SALONDA DEĞİL.
            </text>
          </g>
        </g>
      ),
    },
    {
      from: L(1),
      to: W(1, 5),
      bg: MORNING,
      draw: (o) => (
        <g opacity={o}>
          <Ground />
          <Win t={t} />
          <Table />
          <EmptyPlate x={820} y={1092} />
          <Part text={BAD} color={RED} o={1} />
          <TimeBadge h={8} label="08:00" o={1} />
          <HeroAt uid="tg-b1" x={420} s={1} t={t} pose={{ r: { el: [300, 540], wr: [262, 440] }, head: -6 }} expr="yawn" item={<Cup />} />
          <Verdict ok={false} p={v(W(1, 4))} />
        </g>
      ),
    },
    {
      from: W(1, 5),
      to: L(2),
      bg: NOON,
      draw: (o) => (
        <g opacity={o}>
          <Ground />
          <Win t={t} />
          <Table />
          <Part text={BAD} color={RED} o={1} />
          <TimeBadge h={1} label="13:00" o={1} />
          <HeroAt uid="tg-b2" x={420} s={1} t={t} pose={{ r: { el: [300, 560], wr: [262, 420] } }} expr="chew" item={<g transform="translate(0,-30) scale(0.55)"><Pogaca x={0} y={0} /></g>} />
          <Verdict ok={false} p={v(W(1, 7))} />
        </g>
      ),
    },
    { from: L(2), to: W(2, 4), bg: GYM, draw: (o) => gymScene(o, BAD, true, W(2, 3), RED) },
    {
      from: W(2, 4),
      to: L(3),
      bg: NIGHT,
      draw: (o) => (
        <g opacity={o}>
          <Ground dark />
          <Win night t={t} />
          <Part text={BAD} color={RED} o={1} />
          <TimeBadge h={3} label="03:00" o={1} dark />
          <circle cx={460} cy={720} r={170} fill="#9fd8ff" opacity={0.12 + 0.03 * Math.sin(t * 7)} />
          <HeroAt uid="tg-b4" x={420} s={1} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="yawn" item={<PhoneItem />} />
          <Verdict ok={false} p={v(W(2, 7))} />
        </g>
      ),
    },
    { from: L(3), to: L(4), bg: MORNING, draw: (o) => mirrorScene(o, false) },
    {
      // geri sar: saat geriye döner
      from: L(4),
      to: L(5),
      bg: ["#3a3550", "#211d33"],
      draw: (o) => {
        const p = sm(t, L(4) + 0.1, L(5) - 0.2);
        const hh = 8 + 24 - 24 * p; // ertesi sabah 08:00 → önceki gün 08:00
        return (
          <g opacity={o}>
            <g transform="translate(540,820)">
              <circle r={250} fill="#ffffff" fillOpacity={0.06} />
              <g transform="scale(2.6)">
                <Clock x={0} y={0} r={80} h={hh % 12} m={(hh % 1) * 60} />
              </g>
            </g>
            {[0, 1].map((k) => (
              <path key={k} d={`M${470 - k * 70},1180 L${430 - k * 70},1220 L${470 - k * 70},1260 Z`} fill="#ffffff" opacity={0.85} />
            ))}
            <text x={600} y={1238} fontFamily={SANS} fontWeight={800} fontSize={60} fill="#ffffff">
              GERİ SAR
            </text>
            <Part text="AYNI GÜN, BİR DE BÖYLE" color={GREEN} o={sm(t, W(4, 4) - 0.1, W(4, 4) + 0.2)} />
          </g>
        );
      },
    },
    {
      from: L(5),
      to: W(5, 2),
      bg: MORNING,
      draw: (o) => (
        <g opacity={o}>
          <Ground />
          <Win t={t} />
          <Table />
          <g transform="translate(820,1080) scale(1.15) translate(-820,-1080)">
            <Breakfast x={820} y={1080} />
          </g>
          <Part text={GOOD} color={GREEN} o={1} />
          <TimeBadge h={8} label="08:00" o={1} />
          <HeroAt uid="tg-g1" x={420} s={1} t={t} pose={{ r: { el: [310, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
          <Verdict ok p={v(W(5, 1))} />
        </g>
      ),
    },
    {
      from: W(5, 2),
      to: W(5, 5),
      bg: NOON,
      draw: (o) => (
        <g opacity={o}>
          <Ground />
          <Win t={t} />
          <Table />
          <g transform="translate(820,1080) scale(1.15) translate(-820,-1080)">
            <Lunch x={820} y={1080} />
          </g>
          <Part text={GOOD} color={GREEN} o={1} />
          <TimeBadge h={1} label="13:00" o={1} />
          <HeroAt uid="tg-g2" x={420} s={1} t={t} pose={{ r: { el: [300, 560], wr: [262, 420] } }} expr="chew" />
          <Verdict ok p={v(W(5, 3))} />
        </g>
      ),
    },
    { from: W(5, 5), to: W(5, 7), bg: GYM, draw: (o) => gymScene(o, GOOD, true, W(5, 6), GREEN) },
    {
      from: W(5, 7),
      to: L(6),
      bg: NIGHT,
      draw: (o) => (
        <g opacity={o}>
          <Ground dark />
          <Win night t={t} />
          <Part text={GOOD} color={GREEN} o={1} />
          <TimeBadge h={11} label="23:00" o={1} dark />
          {/* yatak: başlık solda, yastıkta uyuyan genç, üstü battaniye */}
          <rect x={150} y={980} width={50} height={420} rx={16} fill="#8c5a3c" stroke={INK} strokeWidth={7} />
          <rect x={980} y={1150} width={40} height={250} rx={14} fill="#8c5a3c" stroke={INK} strokeWidth={7} />
          <rect x={190} y={1190} width={820} height={110} rx={24} fill="#ffffff" stroke={INK} strokeWidth={7} />
          <rect x={215} y={1105} width={200} height={80} rx={36} fill="#ffffff" stroke={INK} strokeWidth={7} />
          <g transform="translate(905,1160) rotate(-90) scale(0.74) translate(-200,-880)">
            <HeroAt uid="tg-g4" x={200} y={880} s={1} t={0} pose={{}} expr="happy" />
          </g>
          <path d="M430,1100 Q700,1070 1000,1110 L1010,1230 Q700,1250 430,1235 Z" fill="#7fa8ff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M460,1130 Q700,1105 980,1140" fill="none" stroke="#ffffff" strokeWidth={8} opacity={0.4} strokeLinecap="round" />
          <text x={330} y={1010} fontFamily={SANS} fontWeight={800} fontSize={60} fill="#ffffff" opacity={0.5 + 0.5 * Math.sin(t * 3)}>
            z z
          </text>
          <Verdict ok p={v(W(5, 9))} />
        </g>
      ),
    },
    {
      // kısa bir an kolun içi: yırtıklar yemek ve uykuyla onarılır
      from: L(6),
      to: L(7),
      bg: INSIDE,
      draw: (o) => {
        const heal = sm(t, W(6, 4), W(6, 7) + 0.2);
        const grow = sm(t, W(6, 8) - 0.1, W(6, 8) + 0.5);
        return (
          <g opacity={o}>
            <Part text="KOLUNUN İÇİ" color="#ffffff" o={1} />
            <g transform="translate(0,-40)">
              <ArmCut t={t} cut={1} dmg={1} heal={heal} grow={grow} pulse={0} labels={0} />
            </g>
            <Chip x={250} y={420} text="YEMEK" o={sm(t, W(6, 5) - 0.1, W(6, 5) + 0.2)} bg={Y} fg={INK} size={52} />
            <Chip x={250} y={530} text="UYKU" o={sm(t, W(6, 7) - 0.1, W(6, 7) + 0.2)} bg="#9a7cf0" size={52} />
            <Chip x={540} y={1340} text="KAS BÜYÜYOR" o={sm(t, W(6, 8) - 0.1, W(6, 8) + 0.2)} bg={GREEN} size={56} />
          </g>
        );
      },
    },
    { from: L(7), to: L(8), bg: MORNING, draw: (o) => mirrorScene(o, true) },
    {
      from: L(8),
      to: T - 0.25,
      bg: GYM,
      draw: (o) => (
        <g opacity={o}>
          <Ground />
          <GymSign x={90} y={460} />
          <HeroAt uid="tg-send" x={480} s={0.95} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
          <g opacity={sm(t, L(8) + 0.15, L(8) + 0.45)}>
            <text x={540} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={96} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
              BUNU ONA
            </text>
            <text x={540} y={410} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={116} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
              GÖNDER
            </text>
          </g>
        </g>
      ),
    },
  ];

  // önceki çekim sönerken yenisi gelir (kısa yumuşak geçiş); son kare = ilk kare
  const shotO = (s: Shot, k: number) => (k === 0 ? Math.max(win(t, -1, s.to + 0.02, 0.18), loopIn) : win(t, s.from - 0.02, s.to + 0.02, 0.18));
  let bgTop = S[0].bg[0];
  let bgBot = S[0].bg[1];
  for (let k = 1; k < S.length; k++) {
    bgTop = interpolateColors(t, [S[k].from - 0.12, S[k].from + 0.12], [bgTop, S[k].bg[0]]);
    bgBot = interpolateColors(t, [S[k].from - 0.12, S[k].from + 0.12], [bgBot, S[k].bg[1]]);
  }
  bgTop = interpolateColors(loopIn, [0, 1], [bgTop, S[0].bg[0]]);
  bgBot = interpolateColors(loopIn, [0, 1], [bgBot, S[0].bg[1]]);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.28, lead: 0.05 }, // kanca
    { at: W(1, 4), id: 2568, v: 0.16 }, // ✕ kahvaltı
    { at: W(1, 7), id: 2568, v: 0.16 }, // ✕ poğaça
    { at: W(2, 3), id: 1120, v: 0.18, lead: 0.1 }, // ✓ salon
    { at: W(2, 7), id: 2568, v: 0.16 }, // ✕ gece
    { at: W(3, 3) - 0.05, id: 2299, v: 0.18, lead: 0.05 }, // AYNI
    { at: L(4) + 0.05, id: 790, v: 0.16, lead: 0.61, dur: 1.1, fade: 0.3 }, // geri sar
    { at: W(5, 1), id: 1120, v: 0.18, lead: 0.1 }, // ✓
    { at: W(5, 3), id: 1120, v: 0.18, lead: 0.1 },
    { at: W(5, 6), id: 1120, v: 0.18, lead: 0.1 },
    { at: W(5, 9), id: 1120, v: 0.18, lead: 0.1 },
    { at: L(6) + 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.4, fade: 0.7 }, // kolun içi
    { at: L(7) + 0.9, id: 1120, v: 0.3, lead: 0.1 }, // +4 cm
  ];
  const duck = (mt: number) => 1 - 0.35 * win(mt, W(3, 2), L(4) + 0.3, 0.3);

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="tg-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="tg-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#tg-bg)" />
        {S.map((s, k) => {
          const o = shotO(s, k);
          return o > 0.001 ? <g key={k}>{s.draw(o)}</g> : null;
        })}
        <rect width={1080} height={1920} fill="url(#tg-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q) => (f.dur && f.fade ? f.v * interpolate(q / fps, [0, 0.001, f.dur - f.fade, f.dur], [1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
          />
        </Sequence>
      ))}
      <Audio
        src={staticFile("music/623.mp3")}
        volume={(f) => {
          const mt = f / fps;
          const base = interpolate(mt, [0, 0.4], [0.015, 0.03], { extrapolateRight: "clamp" });
          return base * duck(mt) * interpolate(mt, [T - 0.6, T], [1, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }}
      />
    </AbsoluteFill>
  );
};
