/**
 * "Salonun en sadık müşterisi kim biliyor musun? Hiç değişmeyenler." (~35 sn). Kullanıcının gönderdiği örnek videonun
 * aynı akışı, bizim kalem çizimi siyah saçlı gencimizle: salon girişi (turnike sayacı 186 → 187, resepsiyonda sessiz
 * görevli) → AYIN ÜYESİ panosu (6 ay aynı fotoğraf, HEP AYNI damgası) → üç eksik: 1 yük (1936 grafiği: zorlanınca
 * değişir, alışınca durur; 6 aydır hep 40 kg), 2 protein (2018: 49 deney; dolu tabak ↔ boş tabak, kas büyür),
 * 3 uyku (2010: aynı kişiler aynı diyet, 8,5 ↔ 5,5 saat uyku, −1,4 ↔ −0,6 kg yağ) → yükü artır, protein ye, erken uyu →
 * panoya 7. ay fotoğrafı "?" ile gelir ("cevabı sen olursun") → giriş sahnesine döner (döngü; son kare = ilk kare).
 * Sahneler satır başında kesilir (örnekteki gibi), her sahnede kamera yavaşça yaklaşır.
 * Metin `icerik/sadik-musteri.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HAND, SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { type Arm, LINE, type SketchExpr, type SketchLook, type SketchPose, SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import { Captions, type EkmekBirakProps, PAPER, RED, type TL, mix, st, voiceTimeline, wordTime } from "./EkmekBirak";

loadFonts();

export const SM_LINES: Line[] = [
  { text: "Salonun en sadık müşterisi kim biliyor musun?", hl: ["sadık", "müşterisi"], hold: 0.1 },
  { text: "Hiç değişmeyenler.", hl: ["değişmeyenler."], hold: 0.3 },
  { text: "Çünkü hep geri gelirler.", hl: ["geri"], hold: 0.1 },
  { text: "Ama bu senin suçun değil.", hl: ["suçun"], hold: 0.1 },
  { text: "Vücudun şekillenmiyorsa üç şey eksik.", hl: ["şekillenmiyorsa", "üç"], hold: 0.1 },
  { text: "Birincisi: yük.", hl: ["yük."] },
  { text: "1936'da bir doktor gördü: vücut zorlanınca değişir, alışınca durur.", hl: ["1936'da", "zorlanınca", "durur."], hold: 0.3 },
  { text: "Yani aylardır aynı ağırlıksa, vücudun çoktan alıştı.", hl: ["aynı", "alıştı."], hold: 0.2 },
  { text: "İkincisi: protein.", hl: ["protein."] },
  { text: "2018'de kırk dokuz deney incelendi: proteinini artıranlar daha çok kas kazandı.", hl: ["kırk", "dokuz", "kas"], hold: 0.3 },
  { text: "Üçüncüsü… ve en sevmediğin: uyku.", hl: ["uyku."] },
  { text: "2010'da aynı insanlar aynı diyeti iki kez yaptı.", hl: ["2010'da", "iki"] },
  { text: "Az uyudukları haftalarda verdikleri yağ yarıdan aza düştü. Yarıdan aza!", hl: ["Az", "yarıdan", "aza!"], hold: 0.3 },
  { text: "Yükü artır, protein ye, erken uyu.", hl: ["artır,", "protein", "erken"], hold: 0.1 },
  { text: "Yoksa şu sorunun cevabı sen olursun:", hl: ["sen"], hold: 0.2 },
];

export const SM_TAIL = 1.15;
export const SM_TL = timeline(SM_LINES, SM_TAIL);

const HERO = SKETCH_CAST.siyah.look;
const CLERK: SketchLook = { ...SKETCH_CAST.kiz.look, top: "#3f7a55", hair: "#4a2c1c" };
const INK = "#2d4a8a";
const BLUE = "#3d6fc4";
const GYM_GREEN = "#2f5a45";

const rad = (d: number) => (d * Math.PI) / 180;

/** SketchPerson ile aynı kol hesabı: el noktası (yerel 400x820 kutu) */
const handAt = (arm: Arm, side: -1 | 1): [number, number] => {
  const sx = side < 0 ? 150 : 250;
  const sy = 278;
  const a1 = rad(arm.a);
  const ex = sx + side * Math.sin(a1) * 100;
  const ey = sy + Math.cos(a1) * 100;
  const a2 = rad(arm.a + arm.e);
  return [ex + side * Math.sin(a2) * 88, ey + Math.cos(a2) * 88];
};

/** kişiyi ayak noktasına yerleştirir; çocuklar kişinin yerel kutusunda çizilir */
const Hero: React.FC<{
  x: number;
  foot: number;
  s?: number;
  flip?: boolean;
  t: number;
  look?: SketchLook;
  pose?: SketchPose;
  expr?: SketchExpr;
  seed?: number;
  children?: React.ReactNode;
  before?: React.ReactNode;
}> = ({ x, foot, s = 1, flip, t, look = HERO, pose, expr, seed = 0, children, before }) => (
  <g transform={`translate(${x},${foot}) scale(${flip ? -s : s},${s}) translate(-200,-800)`}>
    {before}
    <SketchPerson t={t} look={look} pose={pose} expr={expr} seed={seed} />
    {children}
  </g>
);

// ------------------------------------------------------------ küçük parçalar

/** el yazısı not kâğıdı */
const Note: React.FC<{ x: number; y: number; text: string; o: number; tilt?: number; color?: string; size?: number }> = ({
  x,
  y,
  text,
  o,
  tilt = -2,
  color = INK,
  size = 58,
}) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.42 + 90;
  const h = size * 1.6;
  return (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 12}) rotate(${tilt})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={14} fill="#5a3a26" opacity={0.15} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={PAPER} {...st} />
      <text x={0} y={size * 0.33} textAnchor="middle" fontFamily={HAND} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** numaralı bölüm rozeti: kırmızı daire + el yazısı */
const Badge: React.FC<{ n: number; text: string; o: number; x?: number; y?: number }> = ({ n, text, o, x = 540, y = 300 }) => {
  if (o <= 0) return null;
  return (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 12}) rotate(-2)`}>
      <rect x={-250 + 6} y={-66 + 8} width={500} height={132} rx={22} fill="#5a3a26" opacity={0.15} />
      <rect x={-250} y={-66} width={500} height={132} rx={22} fill={PAPER} {...st} />
      <circle cx={-170} cy={0} r={42} fill={RED} {...st} />
      <text x={-170} y={16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill="#fff">
        {n}
      </text>
      <text x={40} y={22} textAnchor="middle" fontFamily={HAND} fontSize={68} fill={LINE}>
        {text}
      </text>
    </g>
  );
};

const Tag: React.FC<{ x: number; y: number; text: string; o: number; tilt?: number; size?: number }> = ({ x, y, text, o, tilt = -3, size = 50 }) =>
  o <= 0 ? null : <Note x={x} y={y} text={text} o={o} tilt={tilt} color={LINE} size={size} />;

/** kas kesiti: koyu daire içinde lifler */
const MuscleDot: React.FC<{ x: number; y: number; r: number; o: number; glow: number; label?: boolean }> = ({ x, y, r, o, glow, label = true }) => {
  if (o <= 0) return null;
  const fiber = `rgb(${Math.round(mix(150, 240, glow))},${Math.round(mix(80, 120, glow))},${Math.round(mix(100, 105, glow))})`;
  return (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <clipPath id={`md-${Math.round(x)}-${Math.round(y)}`}>
        <circle r={r} />
      </clipPath>
      <circle r={r} fill="#3a2430" {...st} />
      <g clipPath={`url(#md-${Math.round(x)}-${Math.round(y)})`}>
        {[-0.6, -0.3, 0, 0.3, 0.6].map((k, i) => (
          <path
            key={i}
            d={`M${-r},${k * r} Q${-r / 2},${k * r - 6} 0,${k * r} T${r},${k * r}`}
            fill="none"
            stroke={fiber}
            strokeWidth={mix(6, 16, glow)}
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle r={r} fill="none" {...st} strokeWidth={4} />
      {label ? (
        <text x={0} y={-r - 22} textAnchor="middle" fontFamily={HAND} fontSize={58} fill={LINE}>
          kas
        </text>
      ) : null}
    </g>
  );
};

const UpArrow: React.FC<{ x: number; y: number; o: number; s?: number }> = ({ x, y, o, s = 1 }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y - (1 - o) * 20}) scale(${s})`} fill="none" stroke={BLUE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
      <path d="M0,60 L0,-60 M-30,-30 L0,-62 L30,-30" />
    </g>
  );

const Barbell: React.FC<{ l: [number, number]; r: [number, number]; kg?: string }> = ({ l, r, kg }) => {
  const y = (l[1] + r[1]) / 2 - 10;
  return (
    <g>
      <rect x={l[0] - 80} y={y - 6} width={r[0] - l[0] + 160} height={12} rx={4} fill="#9a9ba0" {...st} strokeWidth={3} />
      {[l[0] - 50, r[0] + 50].map((px, i) => (
        <g key={i}>
          <rect x={px - 14} y={y - 46} width={28} height={92} rx={8} fill="#36363c" {...st} />
          <rect x={px + (i ? 16 : -30)} y={y - 30} width={14} height={60} rx={5} fill="#36363c" {...st} strokeWidth={3} />
        </g>
      ))}
      {kg ? (
        <text x={(l[0] + r[0]) / 2} y={y - 74} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill={RED}>
          {kg}
        </text>
      ) : null}
    </g>
  );
};

/** dambıl / halter itişi: 0 aşağı (omuz hizası) … 1 yukarı */
const pressPose = (k: number): SketchPose => ({
  turn: 0,
  l: { a: mix(100, 160, k), e: mix(80, 18, k) },
  r: { a: mix(100, 160, k), e: mix(80, 18, k) },
});

const Calendar: React.FC<{ x: number; y: number; n: number; o: number }> = ({ x, y, n, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <rect x={-86} y={-80} width={172} height={180} rx={14} fill={PAPER} {...st} />
      <path d="M-86,-40 L-86,-66 Q-86,-80 -72,-80 L72,-80 Q86,-80 86,-66 L86,-40 Z" fill={RED} {...st} />
      <text x={0} y={58} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={100} fill={LINE}>
        {n}
      </text>
      <text x={0} y={90} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill={LINE}>
        AY
      </text>
    </g>
  );

/** ekranda kalem titremesi ile çizilmiş kırmızı kesikli halka */
const DashRing: React.FC<{ x: number; y: number; r: number; o: number }> = ({ x, y, r, o }) =>
  o <= 0 ? null : (
    <circle cx={x} cy={y} r={r} fill="none" stroke={RED} strokeWidth={7} strokeDasharray="26 16" opacity={o} />
  );

const QBox: React.FC<{ x: number; y: number; s: number; o: number; tilt: number }> = ({ x, y, s, o, tilt }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M-90,-70 L90,-70 L90,80 L-90,80 Z" fill="#c98a4a" {...st} />
      <path d="M-100,-90 L100,-90 L100,-62 L-100,-62 Z" fill="#b5773b" {...st} />
      <path d="M-12,-90 L-12,80 M12,-90 L12,80" stroke="#e8c48a" strokeWidth={6} opacity={0.6} />
      <text x={0} y={50} textAnchor="middle" fontFamily={HAND} fontSize={130} fill={LINE}>
        ?
      </text>
    </g>
  );

/** yarım kesitli tabak; full = dolu (yumurta, tavuk, süt) */
const Plate: React.FC<{ x: number; y: number; s?: number; full: number }> = ({ x, y, s = 1, full }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={8} rx={190} ry={40} fill="#5a3a26" opacity={0.12} />
    <ellipse cx={0} cy={0} rx={190} ry={40} fill="#fbfbf7" {...st} />
    <ellipse cx={0} cy={0} rx={140} ry={26} fill="none" stroke={LINE} strokeWidth={2} opacity={0.35} />
    {full > 0 ? (
      <g opacity={full} transform={`translate(0,${(1 - full) * -30})`}>
        <path d="M-150,-14 Q-160,-48 -120,-52 Q-96,-70 -70,-50 Q-46,-46 -56,-16 Q-100,0 -150,-14 Z" fill="#fff" {...st} />
        <circle cx={-104} cy={-32} r={18} fill="#f2b632" {...st} strokeWidth={2.6} />
        <path d="M-24,-20 Q-40,-70 0,-82 Q46,-86 52,-46 Q50,-18 10,-12 Q-14,-10 -24,-20 Z" fill="#b8692f" {...st} />
        <path d="M44,-40 L74,-56" stroke={LINE} strokeWidth={14} strokeLinecap="round" />
        <path d="M44,-40 L74,-56" stroke="#f3ead9" strokeWidth={8} strokeLinecap="round" />
        <path d="M84,-90 L150,-90 L142,-6 L92,-6 Z" fill="#cfe6f4" {...st} />
        <path d="M88,-60 L146,-60 L142,-6 L92,-6 Z" fill="#fbfbf7" opacity={0.9} />
      </g>
    ) : null}
  </g>
);

const Polaroid: React.FC<{ x: number; y: number; w: number; label: string; t: number; id: string; tilt?: number; q?: number }> = ({ x, y, w, label, t, id, tilt = 0, q = 0 }) => {
  const h = w * 1.12;
  const ph = w * 0.86;
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 6} width={w} height={h} fill="#5a3a26" opacity={0.18} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#fbfbf7" {...st} strokeWidth={2.6} />
      <clipPath id={`pol-${id}`}>
        <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={ph} />
      </clipPath>
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={ph} fill="#bfdcef" />
      {q < 1 ? (
        <g clipPath={`url(#pol-${id})`} opacity={1 - q}>
          <Hero x={0} foot={-h / 2 + 12 + ph + w * 0.62} s={w / 470} t={t} expr="flat" pose={{ turn: 0 }} />
        </g>
      ) : null}
      {q > 0 ? (
        <text x={0} y={-h / 2 + 12 + ph * 0.72} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={w * 0.62} fill={RED} opacity={q}>
          ?
        </text>
      ) : null}
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={ph} fill="none" stroke={LINE} strokeWidth={2} />
      <text x={w / 2 - 22} y={h / 2 - 14} textAnchor="end" fontFamily={HAND} fontSize={w * 0.13} fill={LINE}>
        {label}
      </text>
    </g>
  );
};

/** AYIN ÜYESİ panosu: 6 aylık aynı fotoğraf; seventh = 7. ay "?" kartının gelişi */
const Board: React.FC<{ x: number; y: number; s: number; t: number; seventh?: number }> = ({ x, y, s, t, seventh = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-400 + 10} y={-360 + 12} width={800} height={720} rx={10} fill="#5a3a26" opacity={0.18} />
    <rect x={-400} y={-360} width={800} height={720} rx={10} fill="#7a5640" {...st} strokeWidth={5} />
    <rect x={-376} y={-336} width={752} height={672} rx={6} fill="#c39a6b" stroke={LINE} strokeWidth={2.4} />
    {Array.from({ length: 40 }).map((_, i) => (
      <circle key={i} cx={-360 + ((i * 97) % 720)} cy={-320 + ((i * 61) % 640)} r={2.2} fill="#8f6a44" opacity={0.6} />
    ))}
    <g transform="rotate(-1)">
      <rect x={-220} y={-330} width={440} height={96} fill="#b3302a" {...st} />
      <text x={0} y={-264} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={56} fill="#fff">
        AYIN ÜYESİ
      </text>
    </g>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <Polaroid
        key={i}
        id={`b${i}`}
        x={-240 + (i % 3) * 240}
        y={-60 + Math.floor(i / 3) * 250}
        w={196}
        label={`${i + 1}. ay`}
        t={t + i * 0.7}
        tilt={[-2, 1.5, -1, 2, -1.5, 1][i]}
      />
    ))}
    {seventh > 0 ? (
      <g transform={`translate(0,${mix(700, 330, seventh)})`}>
        <Polaroid id="b7" x={0} y={0} w={210} label="7. ay" t={t} tilt={-3} q={sm(seventh, 0.6, 1)} />
      </g>
    ) : null}
  </g>
);

// ------------------------------------------------------------ arka planlar

const Specks: React.FC<{ y0: number; y1: number; c: string; n?: number }> = ({ y0, y1, c, n = 50 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => (
      <circle key={i} cx={(i * 211) % 1080} cy={y0 + ((i * 137) % Math.max(1, y1 - y0))} r={2 + (i % 3)} fill={c} opacity={0.35} />
    ))}
  </g>
);

const GymSign: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-140} y={-56} width={280} height={112} rx={10} fill={GYM_GREEN} {...st} strokeWidth={4} />
    <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill="#f4efe2" letterSpacing={4}>
      GYM
    </text>
  </g>
);

/** salon içi: cam duvar + koyu zemin */
const GymBg: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect width={1080} height={1920} fill="#e9dcc0" />
    <rect x={0} y={330} width={1080} height={880} fill="#cfe6ef" />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M${130 + i * 280 + Math.sin(t * 0.3) * 4},${420} l-70,170 M${170 + i * 280},${420} l-40,100`} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
    ))}
    {[270, 540, 810].map((x) => (
      <path key={x} d={`M${x},330 L${x},1210`} stroke={LINE} strokeWidth={3} opacity={0.5} />
    ))}
    <path d="M0,330 L1080,330" stroke={LINE} strokeWidth={4} />
    <rect x={0} y={1210} width={1080} height={70} fill="#b9b3a8" stroke={LINE} strokeWidth={3} />
    <rect x={0} y={1280} width={1080} height={640} fill="#3b3a3f" />
    <Specks y0={1300} y1={1900} c="#8d8a92" />
    <path d="M0,1280 L1080,1280" stroke={LINE} strokeWidth={4} />
    <GymSign x={190} y={170} />
  </g>
);

/** giriş: düz duvar, turnike (sayaç), resepsiyon */
const EntranceBg: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#e9dcc0" />
    <rect x={0} y={1280} width={1080} height={640} fill="#3b3a3f" />
    <Specks y0={1300} y1={1900} c="#8d8a92" />
    <path d="M0,1280 L1080,1280" stroke={LINE} strokeWidth={4} />
    <GymSign x={560} y={300} />
  </g>
);

const Turnstile: React.FC<{ x: number; count: number; flash: number; arm: number }> = ({ x, count, flash, arm }) => (
  <g>
    <rect x={x - 46} y={1000} width={92} height={420} fill="#9fb2c4" {...st} />
    <path d={`M${x - 30},1020 L${x - 30},1400`} stroke="#fff" strokeWidth={6} opacity={0.4} />
    {/* kol */}
    <g transform={`translate(${x + 40},1180) rotate(${mix(-28, 40, arm)})`}>
      <rect x={0} y={-9} width={260} height={18} rx={8} fill="#5d5d63" {...st} strokeWidth={3} />
    </g>
    {/* ekran */}
    <rect x={x - 90} y={760} width={180} height={220} rx={16} fill="#24242a" {...st} />
    <rect x={x - 70} y={780} width={140} height={150} rx={10} fill={`rgb(${Math.round(mix(76, 140, flash))},${Math.round(mix(160, 230, flash))},${Math.round(mix(76, 120, flash))})`} />
    <text x={x} y={826} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill="#e8ffd8">
      GİRİŞ
    </text>
    <text x={x} y={900} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill="#fff">
      {count}
    </text>
    <rect x={x - 54} y={980} width={108} height={22} fill="#24242a" {...st} strokeWidth={3} />
  </g>
);

const Desk: React.FC<{ x: number; w: number; y: number }> = ({ x, w, y }) => (
  <g>
    <rect x={x} y={y} width={w} height={1440 - y} fill="#8a5a36" {...st} />
    <rect x={x - 16} y={y - 30} width={w + 32} height={34} fill="#a36d42" {...st} />
    {[0.33, 0.66].map((k) => (
      <path key={k} d={`M${x + w * k},${y + 10} L${x + w * k},1430`} stroke={LINE} strokeWidth={2} opacity={0.35} />
    ))}
  </g>
);

const KitchenBg: React.FC<{ w?: number }> = ({ w = 1080 }) => {
  const n = Math.round(w / 180);
  return (
    <g>
      <rect width={w} height={1920} fill="#efe6d2" />
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={20 + i * (w / n)} y={120} width={w / n - 40} height={330} rx={6} fill="#86b8a0" {...st} />
      ))}
      <rect x={0} y={1160} width={w} height={760} fill="#86b8a0" />
      {Array.from({ length: n + 1 }).map((_, i) => (
        <path key={i} d={`M${i * (w / n)},1200 L${i * (w / n)},1920`} stroke={LINE} strokeWidth={3} opacity={0.7} />
      ))}
      <rect x={-10} y={1130} width={w + 20} height={60} fill="#f5f1e8" {...st} />
    </g>
  );
};

const NightBg: React.FC<{ t: number; w?: number; moonX?: number }> = ({ t, w = 1080, moonX = 860 }) => (
  <g>
    <rect width={w} height={1920} fill="#23243f" />
    {Array.from({ length: 46 }).map((_, i) => (
      <circle key={i} cx={(i * 173) % w} cy={(i * 293) % 1800} r={1.5 + (i % 3)} fill="#f4ecd0" opacity={0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2 + i))} />
    ))}
    <g transform={`translate(${moonX},300)`}>
      <rect x={-130} y={-150} width={260} height={300} fill="#2c3a63" {...st} stroke="#1a1a2c" />
      <circle cx={10} cy={-20} r={56} fill="#f3df8e" />
      <path d="M0,-150 L0,150 M-130,0 L130,0" stroke="#1a1a2c" strokeWidth={10} />
      <rect x={-130} y={-150} width={260} height={300} fill="none" stroke="#1a1a2c" strokeWidth={6} />
    </g>
  </g>
);

/** yatakta yatan genç (başı solda), phone = telefona bakıyor */
const Bed: React.FC<{ x: number; y: number; s?: number; t: number; phone: number; sleep: number }> = ({ x, y, s = 1, t, phone, sleep }) => {
  const shut = sleep > 0.5;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-330} y={-170} width={40} height={300} rx={8} fill="#7a4a2c" {...st} />
      <rect x={-330} y={40} width={680} height={60} fill="#8a5a36" {...st} />
      <rect x={330} y={-40} width={30} height={170} rx={6} fill="#7a4a2c" {...st} />
      <ellipse cx={-210} cy={-14} rx={90} ry={40} fill="#f6f2ea" {...st} />
      {/* baş */}
      <g transform={`translate(-200,-58) rotate(${Math.sin(t * 1.2) * 1.5})`}>
        <ellipse cx={0} cy={0} rx={62} ry={58} fill={HERO.skin} {...st} />
        <path d="M-60,-6 Q-66,-60 -10,-62 Q52,-62 58,-14 Q30,-36 0,-34 Q-30,-40 -60,-6 Z" fill={HERO.hair} {...st} strokeWidth={3} />
        {shut ? (
          <path d="M-6,4 q8,6 16,0 M24,4 q8,6 16,0" fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
        ) : (
          <g fill="#1f1714">
            <ellipse cx={4} cy={0} rx={5} ry={6} />
            <ellipse cx={34} cy={0} rx={5} ry={6} />
          </g>
        )}
        <path d={shut ? "M10,30 q8,4 14,0" : "M8,32 q10,-4 20,2"} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* yorgan */}
      <path d="M-160,-70 Q-140,-120 40,-110 L320,-100 Q350,-60 340,40 L-170,40 Q-190,-20 -160,-70 Z" fill="#4f7cc4" {...st} />
      <path d="M-120,-60 Q60,-80 300,-60" fill="none" stroke="#3b62a3" strokeWidth={6} opacity={0.6} />
      {sleep > 0 ? (
        <g opacity={sleep} fontFamily={HAND} fill="#cfd6f3">
          {[0, 1, 2].map((i) => {
            const k = (t * 0.5 + i / 3) % 1;
            return (
              <text key={i} x={-120 + k * 80} y={-150 - k * 120} fontSize={40 + k * 20} opacity={Math.sin(k * Math.PI)}>
                z
              </text>
            );
          })}
        </g>
      ) : null}
      {phone > 0 ? (
        <g opacity={phone}>
          <ellipse cx={-150} cy={-120} rx={150} ry={110} fill="#bcd8ff" opacity={0.28} />
          <g transform="translate(-130,-170) rotate(18)">
            <rect x={-26} y={-46} width={52} height={92} rx={10} fill="#2b2b33" {...st} strokeWidth={3} />
            <rect x={-20} y={-38} width={40} height={74} rx={5} fill="#9fd3e8" />
          </g>
        </g>
      ) : null}
    </g>
  );
};

const Clock: React.FC<{ x: number; y: number; text: string; color: string; o: number }> = ({ x, y, text, color, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <rect x={-130} y={-60} width={260} height={120} rx={14} fill="#18181f" {...st} strokeWidth={4} />
      <text x={0} y={26} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} fill={color}>
        {text}
      </text>
    </g>
  );

// ------------------------------------------------------------ sahneler

type S = { t: number; u: number; W: (k: number) => number; d: number };
const wu = (s: S, k: number) => s.W(k);

/** 0 / 2: giriş — genç telefonla turnikeden geçer, sayaç artar */
const Entrance: React.FC<S & { from: number; tick: number; note?: number }> = ({ t, u, from, tick, note = 0 }) => {
  const walk = sm(u, -0.4, 0.6);
  const reach = sm(u, 0.1, 0.6);
  const tk = sm(u, tick, tick + 0.12);
  const flash = win(u, tick, tick + 0.6, 0.12);
  return (
    <g>
      <EntranceBg />
      <Hero x={830} foot={1430} s={0.95} t={t} look={CLERK} seed={3} expr="smile" pose={{ turn: -0.3, r: { a: 150, e: 25 + Math.sin(t * 7) * 18 }, l: { a: 10, e: 10 } }} />
      <Desk x={640} w={380} y={1170} />
      <Turnstile x={230} count={from + (tk > 0.5 ? 1 : 0)} flash={flash} arm={sm(u, tick + 0.1, tick + 0.6)} />
      <Hero x={mix(600, 470, walk)} foot={1560} t={t} flip pose={{ turn: 0.35, itemR: "phone", r: { a: mix(15, 72, reach), e: mix(8, 4, reach) }, l: { a: 10, e: 8 } }} expr="smile" />
      <Note x={720} y={560} text="hep geri gelir" o={note} color={RED} tilt={-3} size={60} />
    </g>
  );
};

/** 1: AYIN ÜYESİ — 6 ay aynı fotoğraf, HEP AYNI damgası */
const MemberBoard: React.FC<S> = (s) => {
  const { t } = s;
  const at = wu(s, 1) - 0.1;
  const k = sm(t, at, at + 0.14);
  return (
    <g>
      <rect width={1080} height={1920} fill="#e9dcc0" />
      <Board x={540} y={900} s={1.12} t={t} />
      {k > 0 ? (
        <g opacity={k} transform={`translate(540,920) rotate(-16) scale(${mix(1.25, 1, k)})`}>
          <rect x={-300} y={-80} width={600} height={160} rx={16} fill="none" stroke="#c0332b" strokeWidth={12} />
          <text x={0} y={36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={104} fill="#c0332b" letterSpacing={4}>
            HEP AYNI
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** 3-4-5: salon içi — üzgün genç, eksik halkalar + kutular, halter */
const GymScene: React.FC<S & { mode: "sad" | "rings" | "lift" }> = (s) => {
  const { t, u, mode } = s;
  if (mode === "lift") {
    const k = 0.5 - 0.5 * Math.cos(Math.max(0, u - 0.2) * 3.4);
    const pose = pressPose(k);
    return (
      <g>
        <GymBg t={t} />
        <Hero x={540} foot={1600} s={1.08} t={t} pose={pose} expr="grin">
          <Barbell l={handAt(pose.l!, -1)} r={handAt(pose.r!, 1)} />
        </Hero>
        <Badge n={1} text="yük" o={sm(u, 0.1, 0.4)} y={470} />
      </g>
    );
  }
  const rings = mode === "rings";
  const R = (i: number) => (rings ? sm(u, 0.15 + i * 0.25, 0.45 + i * 0.25) : 0);
  const boxes = rings ? sm(t, wu(s, 3) - 0.3, wu(s, 3) + 0.35) : 0;
  return (
    <g>
      <GymBg t={t} />
      <Hero x={540} foot={1600} s={1.08} t={t} expr={rings ? "think" : "worry"} pose={{ turn: 0, l: { a: 14, e: 4 }, r: { a: 14, e: 4 } }}>
        <DashRing x={258} y={300} r={46} o={R(0)} />
        <DashRing x={200} y={410} r={52} o={R(1)} />
        <DashRing x={176} y={660} r={44} o={R(2)} />
      </Hero>
      {!rings ? <Note x={500} y={520} text="senin suçun değil" o={sm(u, 0.4, 0.75)} tilt={-2} /> : null}
      <QBox x={330} y={mix(-200, 560, boxes)} s={1.1} o={boxes} tilt={-8} />
      <QBox x={760} y={mix(-300, 600, sm(t, wu(s, 3) - 0.15, wu(s, 3) + 0.5))} s={0.8} o={sm(t, wu(s, 3) - 0.15, wu(s, 3) + 0.2)} tilt={6} />
    </g>
  );
};

/** 6: 1936 — kâğıda grafik çizilir: zorlanınca değişir (mavi), alışınca durur (kırmızı düzleşme) */
const Graph: React.FC<S> = (s) => {
  const { t, u } = s;
  const up = sm(t, wu(s, 4) - 0.1, wu(s, 7) - 0.1);
  const flat = sm(t, wu(s, 7) - 0.05, wu(s, 8) + 0.5);
  const ox = 230;
  const oy = 1360;
  const P1 = [ox + 420, oy - 640];
  const P2 = [ox + 680, oy - 680];
  // kalem ucu
  const tip = flat > 0 ? [mix(P1[0], P2[0], flat), P1[1] - Math.sin(flat * Math.PI * 0.5) * 30 - (P1[1] - P2[1]) * flat * 0.3] : [mix(ox, P1[0], up), mix(oy, P1[1], up)];
  return (
    <g>
      <rect width={1080} height={1920} fill="#4e3626" />
      <Specks y0={0} y1={1920} c="#7a5a40" n={30} />
      <g transform="rotate(-1.5,540,960)">
        <rect x={90 + 10} y={330 + 12} width={900} height={1260} fill="#2e2018" opacity={0.4} />
        <rect x={90} y={330} width={900} height={1260} fill="#e2cfa6" {...st} />
        {Array.from({ length: 20 }).map((_, i) => (
          <path key={i} d={`M110,${420 + i * 58} L970,${420 + i * 58}`} stroke="#9a8460" strokeWidth={2} opacity={0.5} />
        ))}
        <path d={`M${ox},${oy - 760} L${ox},${oy} L${ox + 720},${oy}`} fill="none" stroke={LINE} strokeWidth={6} strokeLinecap="round" />
        <text x={ox - 20} y={oy - 780} fontFamily={HAND} fontSize={44} fill={LINE}>
          değişim
        </text>
        <text x={ox + 620} y={oy + 60} fontFamily={HAND} fontSize={44} fill={LINE}>
          zaman
        </text>
        <path d={`M${ox},${oy} L${P1[0]},${P1[1]}`} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - up} />
        <path d={`M${P1[0]},${P1[1]} Q${P1[0] + 120},${P2[1] - 20} ${P2[0]},${P2[1]}`} fill="none" stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - flat} />
        <text x={ox + 60} y={oy - 420} fontFamily={HAND} fontSize={52} fill={BLUE} opacity={sm(t, wu(s, 5), wu(s, 5) + 0.3)} transform={`rotate(-48,${ox + 60},${oy - 420})`}>
          zorlanınca değişir
        </text>
        <text x={P1[0] - 10} y={P2[1] - 70} fontFamily={HAND} fontSize={52} fill={RED} opacity={sm(t, wu(s, 8), wu(s, 8) + 0.3)}>
          alışınca durur
        </text>
        {/* kalem */}
        <g transform={`translate(${tip[0]},${tip[1]}) rotate(28)`} opacity={u < 0.1 ? 0 : 1}>
          <path d="M0,0 L-14,-40 L14,-40 Z" fill="#e8c48a" {...st} strokeWidth={2.6} />
          <path d="M0,0 L-5,-14 L5,-14 Z" fill={LINE} />
          <rect x={-14} y={-260} width={28} height={220} fill="#2d2a28" {...st} strokeWidth={2.6} />
          <rect x={-14} y={-280} width={28} height={22} fill="#c9a24a" {...st} strokeWidth={2.4} />
        </g>
      </g>
      <Tag x={290} y={300} text="1936" o={sm(u, 0.05, 0.35)} />
      <Tag x={620} y={300} text="bir doktor" o={sm(t, wu(s, 1) - 0.1, wu(s, 1) + 0.25)} tilt={2} />
    </g>
  );
};

/** 7: aylardır aynı ağırlık — takvim 1 → 6 ay, hep 40 kg, kas soluk */
const SameWeight: React.FC<S> = (s) => {
  const { t, u } = s;
  const k = 0.5 - 0.5 * Math.cos(u * 4.2);
  const pose = pressPose(k);
  const month = 1 + Math.min(5, Math.floor(sm(u, 0.1, wu(s, 4) - wu(s, 0)) * 5.99));
  const kas = sm(t, wu(s, 5) - 0.1, wu(s, 5) + 0.3);
  return (
    <g>
      <GymBg t={t} />
      <Calendar x={900} y={200} n={month} o={sm(u, 0, 0.25)} />
      <Note x={560} y={200} text="hep 40 kg" o={sm(t, wu(s, 2), wu(s, 2) + 0.3)} color={RED} tilt={-2} />
      <Hero x={mix(540, 400, kas)} foot={1600} s={1.08} t={t} pose={pose} expr={month >= 5 ? "worry" : "flat"}>
        <Barbell l={handAt(pose.l!, -1)} r={handAt(pose.r!, 1)} kg="40 kg" />
      </Hero>
      <MuscleDot x={850} y={760} r={130} o={kas} glow={0} />
      <Note x={860} y={980} text="alıştı" o={sm(t, wu(s, 7), wu(s, 7) + 0.3)} color={RED} tilt={3} size={50} />
    </g>
  );
};

/** 8: mutfak — boş tabak */
const KitchenSad: React.FC<S> = ({ t, u }) => (
  <g>
    <KitchenBg />
    <Hero x={540} foot={1640} s={1.0} t={t} expr="worry" pose={{ turn: 0, l: { a: 10, e: 30 }, r: { a: 10, e: 30 } }} />
    <rect x={-10} y={1130} width={1100} height={60} fill="#f5f1e8" {...st} />
    <rect x={0} y={1190} width={1080} height={730} fill="#86b8a0" />
    {[0, 216, 432, 648, 864, 1080].map((x) => (
      <path key={x} d={`M${x},1200 L${x},1920`} stroke={LINE} strokeWidth={3} opacity={0.7} />
    ))}
    <Plate x={540} y={1150} full={0} />
    <Badge n={2} text="protein" o={sm(u, 0.1, 0.4)} y={620} />
  </g>
);

/** 9a: 2018 — kâğıtlar yağar, sayaç 3 → 49 deney */
const Papers: React.FC<S> = (s) => {
  const { u } = s;
  const p = sm(u, 0.1, wu(s, 3) - wu(s, 0) + 0.2);
  const n = Math.round(mix(3, 49, p));
  return (
    <g>
      <rect width={1080} height={1920} fill="#efe6d2" />
      <rect x={0} y={1180} width={1080} height={740} fill="#a87c52" />
      <path d="M0,1180 L1080,1180" stroke={LINE} strokeWidth={4} />
      <Tag x={190} y={420} text="2018" o={sm(u, 0, 0.3)} />
      <text x={540} y={760} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={230} fill={LINE}>
        {n}
      </text>
      <text x={560} y={850} textAnchor="middle" fontFamily={HAND} fontSize={72} fill={LINE}>
        deney
      </text>
      {/* yığın */}
      {Array.from({ length: Math.round(p * 16) }).map((_, i) => (
        <g key={i} transform={`translate(${540 + ((i * 37) % 30) - 15},${1150 - i * 10}) rotate(${((i * 53) % 16) - 8})`}>
          <rect x={-110} y={-70} width={220} height={140} fill="#fbf6ea" {...st} strokeWidth={2.4} />
        </g>
      ))}
      {/* düşenler */}
      {Array.from({ length: 9 }).map((_, i) => {
        const ph = (u * 0.8 + i / 9) % 1;
        const x = 120 + ((i * 271) % 840);
        return (
          <g key={`f${i}`} transform={`translate(${x + Math.sin(ph * 6 + i) * 40},${mix(-150, 1300, ph)}) rotate(${Math.sin(ph * 5 + i) * 30 + i * 20})`} opacity={Math.min(1, u * 3)}>
            <rect x={-60} y={-80} width={120} height={160} fill="#fbf6ea" {...st} strokeWidth={2.4} />
            {[0, 1, 2, 3].map((r) => (
              <path key={r} d={`M-40,${-50 + r * 28} L40,${-50 + r * 28}`} stroke={LINE} strokeWidth={2} opacity={0.5} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** 9b: ikiye bölünmüş mutfak — dolu tabak (kas büyür) / boş tabak */
const ProteinSplit: React.FC<S & { from: number }> = (s) => {
  const { t, from } = s;
  const v = t - from;
  const grow = sm(v, 0.3, 1.6);
  const half = (x0: number, full: boolean, key: string) => (
    <g transform={`translate(${x0},0)`}>
      <clipPath id={`ps-${key}`}>
        <rect width={540} height={1920} />
      </clipPath>
      <g clipPath={`url(#ps-${key})`}>
        <KitchenBg w={540} />
        <Hero x={270} foot={1660} s={0.78} t={t} seed={full ? 0 : 2} expr={full ? "grin" : "worry"} pose={{ turn: 0, l: { a: 10, e: 30 }, r: { a: 10, e: 30 } }} />
        <rect x={-10} y={1130} width={560} height={60} fill="#f5f1e8" {...st} />
        <rect x={0} y={1190} width={540} height={730} fill="#86b8a0" />
        <Plate x={270} y={1160} s={0.85} full={full ? 1 : 0} />
        <MuscleDot x={250} y={680} r={full ? mix(110, 140, grow) : 110} o={1} glow={full ? grow : 0} />
        {full ? <UpArrow x={440} y={690} o={grow} /> : null}
      </g>
    </g>
  );
  return (
    <g>
      {half(0, true, "a")}
      {half(540, false, "b")}
      <path d="M540,0 L540,1920" stroke={LINE} strokeWidth={6} />
      <Note x={300} y={300} text="daha çok kas" o={sm(t, wu(s, 8) - 0.1, wu(s, 8) + 0.25)} tilt={-2} />
    </g>
  );
};

/** 10: gece üç, telefon */
const Night: React.FC<S> = ({ t, u }) => (
  <g>
    <NightBg t={t} />
    <Bed x={520} y={1300} s={1.25} t={t} phone={1} sleep={0} />
    <Clock x={820} y={880} text="03:00" color="#ff5a4a" o={1} />
    <Badge n={3} text="uyku" o={sm(u, 0.1, 0.4)} y={520} x={460} />
  </g>
);

/** 11-12: aynı kişiler, iki dönem: 8,5 saat ↔ 5,5 saat; verilen yağ */
const SleepSplit: React.FC<S & { line: 11 | 12; W11: (k: number) => number; W12: (k: number) => number }> = ({ t, line, W11, W12 }) => {
  const diet = sm(t, W11(3) - 0.1, W11(3) + 0.3);
  const bars = line === 12 ? sm(t, W12(3) - 0.1, W12(5) + 0.2) : 0;
  const half = (x0: number, good: boolean, key: string) => (
    <g transform={`translate(${x0},0)`}>
      <clipPath id={`ss-${key}`}>
        <rect width={540} height={1920} />
      </clipPath>
      <g clipPath={`url(#ss-${key})`}>
        <NightBg t={t + (good ? 0 : 3)} w={540} moonX={good ? 380 : 160} />
        <Bed x={300} y={1240} s={0.72} t={t} phone={good ? 0 : 1} sleep={good ? 1 : 0} />
        <text x={270} y={1420} textAnchor="middle" fontFamily={HAND} fontSize={54} fill="#e9e4d4">
          {good ? "8,5 saat" : "5,5 saat"}
        </text>
        <g opacity={diet} transform={`translate(270,${1560 - (1 - diet) * 20})`}>
          <ellipse cx={0} cy={0} rx={110} ry={28} fill="#fbfbf7" {...st} />
          <path d="M-70,-6 Q-60,-44 0,-46 Q60,-44 70,-6 Z" fill="#e2a85a" {...st} strokeWidth={2.6} />
          <circle cx={-24} cy={-22} r={10} fill="#6bb36a" />
          <circle cx={22} cy={-26} r={10} fill="#d9534f" />
        </g>
        {bars > 0 ? (
          <g>
            <rect x={200} y={mix(900, good ? 360 : 690, bars)} width={140} height={mix(0, good ? 540 : 210, bars)} fill={good ? "#efbf3a" : "#b3302a"} {...st} />
            <text x={270} y={mix(900, good ? 360 : 690, bars) - 30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#fff" opacity={bars}>
              {good ? "−1,4 kg yağ" : "−0,6 kg yağ"}
            </text>
          </g>
        ) : null}
      </g>
    </g>
  );
  return (
    <g>
      {half(0, true, "a")}
      {half(540, false, "b")}
      <path d="M540,0 L540,1920" stroke="#e9e4d4" strokeWidth={5} />
      {line === 11 ? (
        <g>
          <Tag x={200} y={230} text="2010" o={sm(t, W11(0) - 0.2, W11(0) + 0.2)} />
          <Tag x={600} y={240} text="aynı kişiler" o={sm(t, W11(1) - 0.1, W11(1) + 0.25)} tilt={2} />
          <Tag x={560} y={380} text="aynı diyet" o={diet} tilt={-3} />
        </g>
      ) : (
        <Note x={810} y={250} text="yarıdan az" o={sm(t, W12(6) - 0.1, W12(6) + 0.25)} color={RED} tilt={3} />
      )}
    </g>
  );
};

/** 13: çözüm — üç hızlı çekim */
const Fix: React.FC<S & { part: 0 | 1 | 2; from: number }> = ({ t, part, from }) => {
  const v = t - from;
  if (part === 0) {
    const k = 0.5 - 0.5 * Math.cos(v * 4.5);
    const pose = pressPose(k);
    return (
      <g>
        <GymBg t={t} />
        <Hero x={480} foot={1600} s={1.08} t={t} pose={pose} expr="grin">
          <Barbell l={handAt(pose.l!, -1)} r={handAt(pose.r!, 1)} kg="50 kg" />
        </Hero>
        <UpArrow x={900} y={700} o={sm(v, 0.1, 0.4)} s={1.3} />
      </g>
    );
  }
  if (part === 1)
    return (
      <g>
        <KitchenBg />
        <Hero x={540} foot={1640} s={1.0} t={t} expr="grin" pose={{ turn: 0, l: { a: 10, e: 30 }, r: { a: 10, e: 30 } }} />
        <rect x={-10} y={1130} width={1100} height={60} fill="#f5f1e8" {...st} />
        <rect x={0} y={1190} width={1080} height={730} fill="#86b8a0" />
        {[0, 216, 432, 648, 864, 1080].map((x) => (
          <path key={x} d={`M${x},1200 L${x},1920`} stroke={LINE} strokeWidth={3} opacity={0.7} />
        ))}
        <Plate x={540} y={1150} full={sm(v, 0, 0.3)} />
      </g>
    );
  return (
    <g>
      <NightBg t={t} />
      <Bed x={520} y={1300} s={1.25} t={t} phone={0} sleep={1} />
      <Clock x={820} y={880} text="23:00" color="#7fe08a" o={1} />
    </g>
  );
};

/** 14: pano + soru kartı, 7. ay "?" gelir */
const Final: React.FC<S & { T: number }> = (s) => {
  const { t, u } = s;
  const seventh = sm(t, wu(s, 3) - 0.2, wu(s, 4) + 0.2);
  return (
    <g>
      <rect width={1080} height={1920} fill="#e9dcc0" />
      <g opacity={sm(u, 0, 0.3)} transform="rotate(-1,540,300)">
        <rect x={150 + 8} y={190 + 10} width={780} height={220} rx={20} fill="#5a3a26" opacity={0.15} />
        <rect x={150} y={190} width={780} height={220} rx={20} fill={PAPER} {...st} />
        <text x={540} y={282} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={60} fill={LINE}>
          SENDE HANGİSİ EKSİK?
        </text>
        <text x={540} y={364} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill={RED}>
          1 · 2 · 3 YORUMLARA YAZ
        </text>
      </g>
      <Board x={540} y={930} s={1.0} t={t} seventh={seventh} />
    </g>
  );
};

// ------------------------------------------------------------ kompozisyon

export const SadikMusteri: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, SM_LINES) : SM_TL;
  const T = data ? data.durationInSeconds + SM_TAIL : SM_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const Wt = (line: number, k: number) => wordTime(tl, line, k, SM_LINES);

  const scene = (tt: number, i: number): React.ReactNode => {
    const u = tt - L(i);
    const s: S = { t: tt, u, W: (k) => Wt(i, k), d: L(i + 1) - L(i) };
    switch (i) {
      case 0:
        return <Entrance {...s} from={185} tick={0.65} />;
      case 1:
        return <MemberBoard {...s} />;
      case 2:
        return <Entrance {...s} u={u + 0.6} from={186} tick={0.75} note={sm(tt, Wt(2, 2) - 0.1, Wt(2, 2) + 0.25)} />;
      case 3:
        return <GymScene {...s} mode="sad" />;
      case 4:
        return <GymScene {...s} mode="rings" />;
      case 5:
        return <GymScene {...s} mode="lift" />;
      case 6:
        return <Graph {...s} />;
      case 7:
        return <SameWeight {...s} />;
      case 8:
        return <KitchenSad {...s} />;
      case 9:
        return tt < Wt(9, 5) - 0.08 ? <Papers {...s} /> : <ProteinSplit {...s} from={Wt(9, 5) - 0.08} />;
      case 10:
        return <Night {...s} />;
      case 11:
      case 12:
        return <SleepSplit {...s} line={i} W11={(k) => Wt(11, k)} W12={(k) => Wt(12, k)} />;
      case 13: {
        const a = Wt(13, 2) - 0.08;
        const b = Wt(13, 4) - 0.08;
        return tt < a ? <Fix {...s} part={0} from={L(13)} /> : tt < b ? <Fix {...s} part={1} from={a} /> : <Fix {...s} part={2} from={b} />;
      }
      default:
        return <Final {...s} T={T} />;
    }
  };

  const i = Math.max(0, tl.idx(t));
  // 11-12 tek sahne: kamera yaklaşması iki satır boyunca sürer
  const segA = i === 12 ? L(11) : i === 9 && t >= Wt(9, 5) - 0.08 ? Wt(9, 5) - 0.08 : L(i);
  const segB = i === 11 ? L(13) : i === 9 && t < Wt(9, 5) - 0.08 ? Wt(9, 5) - 0.08 : L(i + 1);
  const push = 1 + 0.05 * sm(t, segA, Math.max(segA + 0.5, segB));
  // döngü: son 0.35 sn'de ilk kareye geçilir (son kare = ilk kare)
  const loopIn = sm(t, T - 0.4, T - 0.03);
  const t0 = t - T;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.2, lead: 0.05 },
    { at: L(0) + 0.65, id: 2568, v: 0.16 },
    { at: Wt(1, 1) - 0.1, id: 2182, v: 0.2 },
    { at: L(2) + 0.15, id: 2568, v: 0.16 },
    { at: L(5) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(8) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(10) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: Wt(14, 3) - 0.2, id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 },
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: "#e9dcc0", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g filter="url(#pencil)">
          <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>{scene(t, i)}</g>
          {loopIn > 0 ? <g opacity={loopIn}>{scene(t0, 0)}</g> : null}
        </g>
      </svg>
      <Captions t={t} tl={tl} lines={SM_LINES} end={T - SM_TAIL + 0.5} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {music ? (
        <Audio
          src={staticFile("audio/sadik-orijinal.mp3")}
          volume={(f) => {
            const mt = f / fps;
            // örnek videonun kendi müziği; konuşma varken altta kalır
            const b = data ? 0.13 : 0.6;
            return b * interpolate(mt, [0, 0.3, T - 0.9, T - 0.1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          }}
        />
      ) : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q) => (f.dur && f.fade ? f.v * interpolate(q / fps, [0, 0.001, f.dur - f.fade, f.dur], [1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
