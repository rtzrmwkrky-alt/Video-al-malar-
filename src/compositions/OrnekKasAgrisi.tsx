/**
 * Örnek 1 — "Spordan 2 gün sonra neden ağrır?" (koyu, teknik çizimli bilgi videosu).
 * Sessiz örnek: zaman satırlardan hesaplanır, ses yok.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, loadFonts } from "../fonts";
import { type Line, Subtitle, pop, sm, timeline, up, win } from "../ornek/common";

loadFonts();

const C = { bg: "#0a0c12", panel: "#121622", line: "#2a3145", orange: "#FF7A2F", cyan: "#4FD1FF", green: "#5BE38B", muscle: "#d9505c" };

export const KAS_LINES: Line[] = [
  { text: "Spordan iki gün sonra neden her yerin ağrır?", hl: ["ağrır?"] },
  { text: "Antrenman günü hiçbir şey yok… asıl ağrı iki gün sonra geliyor.", hl: ["iki", "gün", "sonra"] },
  { text: "Çoğu kişi bunun sebebini laktik asit sanıyor.", hl: ["laktik", "asit"] },
  { text: "Ama laktik asit, spordan sonraki bir saat içinde temizleniyor.", hl: ["bir", "saat"] },
  { text: "Asıl sebep: kas liflerindeki mikroskobik hasarlar.", hl: ["mikroskobik", "hasarlar."] },
  { text: "En çok da ağırlığı yavaşça indirirken oluşuyor.", hl: ["indirirken"] },
  { text: "Vücut hemen bölgeye bir onarım ekibi gönderiyor.", hl: ["onarım", "ekibi"] },
  { text: "Bölge hassaslaşıyor ve ağrı 24 ila 72 saatte zirve yapıyor.", hl: ["24", "72", "saatte"] },
  { text: "Onarılan lif, eskisinden biraz daha dayanıklı hale geliyor.", hl: ["dayanıklı"] },
  { text: "İyi haber: aynı hareketi tekrarladıkça ağrı her seferinde azalıyor.", hl: ["azalıyor."] },
  { text: "Ağrırken tamamen hareketsiz kalma, hafif bir yürüyüş iyi gelir.", hl: ["hafif", "yürüyüş"] },
  { text: "Sen en son ne zaman böyle ağrıdın?", hl: ["ağrıdın?"], hold: 0.8 },
];

export const KAS_TL = timeline(KAS_LINES, 0.3);

const HEADS: [string, string, string][] = [
  ["01 · SORU", "NEDEN 2 GÜN", "SONRA?"],
  ["01 · SORU", "ASIL AĞRI", "SONRA"],
  ["02 · EFSANE", "LAKTİK", "ASİT?"],
  ["02 · EFSANE", "1 SAATTE", "GİDER"],
  ["03 · SEBEP", "MİKRO", "HASAR"],
  ["03 · SEBEP", "İNERKEN", "YIRTILIR"],
  ["04 · ONARIM", "ONARIM", "EKİBİ"],
  ["05 · SÜRE", "24–72", "SAAT"],
  ["04 · ONARIM", "DAHA", "DAYANIKLI"],
  ["06 · SONUÇ", "SONRAKİ SEFER", "DAHA AZ"],
  ["06 · SONUÇ", "HAFİF", "HAREKET"],
  ["SORU", "SEN EN SON", "NE ZAMAN?"],
];

// ------------------------------------------------------------ parçalar

const Grid: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <pattern id="g" width={60} height={60} patternUnits="userSpaceOnUse">
        <path d="M60 0H0V60" fill="none" stroke="#ffffff" strokeOpacity={0.035} />
      </pattern>
      <radialGradient id="vg" cx="50%" cy="45%" r="70%">
        <stop offset="0.5" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.7} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#g)" />
    {Array.from({ length: 14 }).map((_, i) => {
      const x = (i * 263) % 1080;
      const y = 300 + ((i * 397) % 1300) - ((t * (8 + (i % 4) * 4)) % 200);
      return <circle key={i} cx={x} cy={y} r={20 + (i % 5) * 14} fill={i % 3 ? "#ffb070" : "#6fb8ff"} opacity={0.05} />;
    })}
    <rect width={1080} height={1920} fill="url(#vg)" />
  </svg>
);

const Heading: React.FC<{ t: number; i: number; s: number }> = ({ t, i, s }) => {
  const [chip, a, b] = HEADS[i];
  const k = sm(t, s, s + 0.35);
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: MONO,
          fontSize: 26,
          color: C.orange,
          border: `2px solid ${C.orange}55`,
          background: `${C.orange}18`,
          padding: "6px 18px",
          borderRadius: 30,
          letterSpacing: 3,
          opacity: k,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 92,
          letterSpacing: -2,
          lineHeight: 1,
          color: "white",
          opacity: k,
          transform: `translateY(${(1 - k) * 30}px)`,
        }}
      >
        {a} <span style={{ color: C.orange }}>{b}</span>
      </div>
    </div>
  );
};

/** Gün kartları: ağrı ölçeri gün gün dolar */
const Days: React.FC<{ t: number; s: number; s2: number }> = ({ t, s, s2 }) => {
  const levels = [0.08, 0.55, 0.92];
  return (
    <g>
      {[0, 1, 2].map((d) => {
        const x = 110 + d * 300;
        const show = pop(t, s + d * 0.35);
        const fill = levels[d] * sm(t, s2 - 0.2 + d * 0.4, s2 + 0.6 + d * 0.4);
        const hot = d === 2 && t > s2 + 0.8;
        return (
          <g key={d} opacity={show} transform={`translate(${x + 130},860) scale(${0.7 + show * 0.3}) translate(${-x - 130},-860)`}>
            <rect x={x} y={560} width={260} height={600} rx={28} fill={C.panel} stroke={hot ? C.orange : C.line} strokeWidth={hot ? 5 : 3} />
            <text x={x + 130} y={630} fill="#8b93a7" fontFamily={MONO} fontSize={28} textAnchor="middle" letterSpacing={2}>
              GÜN {d + 1}
            </text>
            <text x={x + 130} y={690} fill="white" fontFamily={SANS} fontWeight={700} fontSize={34} textAnchor="middle">
              {d === 0 ? "antrenman" : d === 1 ? "sızlama" : "AĞRI!"}
            </text>
            <rect x={x + 95} y={740} width={70} height={360} rx={35} fill="#0b0e16" stroke={C.line} strokeWidth={3} />
            <rect
              x={x + 101}
              y={1094 - 348 * fill}
              width={58}
              height={348 * fill}
              rx={29}
              fill={d === 2 ? C.orange : d === 1 ? "#ffb34d" : C.green}
            />
          </g>
        );
      })}
    </g>
  );
};

/** küçük grafik iskeleti */
const Axes: React.FC<{ x0: number; y0: number; w: number; h: number; xl: string[]; yl: string }> = ({ x0, y0, w, h, xl, yl }) => (
  <g>
    <rect x={x0 - 60} y={y0 - h - 70} width={w + 120} height={h + 170} rx={28} fill={C.panel} stroke={C.line} strokeWidth={3} />
    <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke="#56607a" strokeWidth={3} />
    <line x1={x0} y1={y0} x2={x0} y2={y0 - h} stroke="#56607a" strokeWidth={3} />
    {xl.map((l, i) => (
      <text key={i} x={x0 + (w * i) / (xl.length - 1)} y={y0 + 48} fill="#8b93a7" fontFamily={MONO} fontSize={26} textAnchor="middle">
        {l}
      </text>
    ))}
    <text x={x0 + 14} y={y0 - h + 8} fill="#8b93a7" fontFamily={MONO} fontSize={26}>
      {yl}
    </text>
  </g>
);

const curvePath = (f: (u: number) => number, x0: number, y0: number, w: number, h: number, upTo = 1) => {
  let d = "";
  const n = 80;
  for (let i = 0; i <= n * upTo; i++) {
    const u = i / n;
    d += `${i === 0 ? "M" : "L"}${x0 + u * w},${y0 - f(u) * h} `;
  }
  return d;
};

const Lactate: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const k = sm(t, s + 0.2, s + 1.8);
  const x0 = 200, y0 = 1130, w = 700, h = 440;
  const f = (u: number) => 0.08 + 0.85 * Math.exp(-u * 4.2);
  return (
    <g opacity={sm(t, s, s + 0.3)}>
      <Axes x0={x0} y0={y0} w={w} h={h} xl={["0 dk", "30 dk", "60 dk"]} yl="LAKTAT" />
      <path d={curvePath(f, x0, y0, w, h, k)} fill="none" stroke={C.cyan} strokeWidth={8} strokeLinecap="round" />
      <line x1={x0} y1={y0 - 0.08 * h} x2={x0 + w} y2={y0 - 0.08 * h} stroke={C.green} strokeDasharray="10 12" strokeWidth={3} opacity={k} />
      <text x={x0 + w - 10} y={y0 - 0.08 * h - 18} fill={C.green} fontFamily={MONO} fontSize={26} textAnchor="end" opacity={k}>
        normal seviye
      </text>
    </g>
  );
};

/** "laktik asit" rozeti, üstü çizilir */
const LacticBadge: React.FC<{ t: number; s: number; cross: number }> = ({ t, s, cross }) => {
  const p = pop(t, s);
  return (
    <g transform={`translate(540,860) scale(${p})`}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + t * 0.6;
        return <circle key={i} cx={Math.cos(a) * 190} cy={Math.sin(a) * 190} r={26} fill={i % 2 ? "#ff5b6e" : "#f2f4f8"} />;
      })}
      <circle r={150} fill={C.panel} stroke={C.cyan} strokeWidth={6} />
      <text y={-10} fill="white" fontFamily={SANS} fontWeight={800} fontSize={50} textAnchor="middle">
        LAKTİK
      </text>
      <text y={50} fill="white" fontFamily={SANS} fontWeight={800} fontSize={50} textAnchor="middle">
        ASİT
      </text>
      <line x1={-170} y1={-170} x2={-170 + 340 * cross} y2={-170 + 340 * cross} stroke="#ff4458" strokeWidth={22} strokeLinecap="round" />
      <line x1={170} y1={-170} x2={170 - 340 * cross} y2={-170 + 340 * cross} stroke="#ff4458" strokeWidth={22} strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
    </g>
  );
};

const TEARS = [
  { x: 330, row: 1, at: 0.2 },
  { x: 690, row: 2, at: 0.6 },
  { x: 480, row: 3, at: 1.0 },
  { x: 800, row: 4, at: 1.4 },
  { x: 260, row: 4, at: 1.8 },
];

/** kas lifleri + mikro yırtıklar + onarım hücreleri */
const Fibers: React.FC<{ t: number; s: number; L: (i: number) => number }> = ({ t, s, L }) => {
  const zoom = 1 + 0.06 * sm(t, s, L(8));
  const stretch = 0.05 * Math.sin(Math.max(0, t - L(5)) * 3) * win(t, L(5), L(6));
  const repair = sm(t, L(8), L(8) + 1.4);
  const thick = 1 + 0.18 * repair;
  const rows = 6;
  return (
    <g opacity={sm(t, s, s + 0.4)} transform={`translate(540,860) scale(${zoom * (1 + stretch)},${zoom}) translate(-540,-860)`}>
      <defs>
        <linearGradient id="fib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f07a84" />
          <stop offset="0.5" stopColor={C.muscle} />
          <stop offset="1" stopColor="#9d2b37" />
        </linearGradient>
        <pattern id="stri" width={18} height={10} patternUnits="userSpaceOnUse">
          <rect width={4} height={10} fill="#000" opacity={0.13} />
        </pattern>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <rect x={90} y={530} width={900} height={660} rx={34} fill={C.panel} stroke={C.line} strokeWidth={3} />
      <text x={120} y={575} fill="#8b93a7" fontFamily={MONO} fontSize={24} letterSpacing={2}>
        KAS LİFİ · BÜYÜTÜLMÜŞ
      </text>
      {Array.from({ length: rows }).map((_, r) => {
        const cy = 640 + r * 82;
        const hgt = 62 * thick;
        return (
          <g key={r}>
            <rect x={130} y={cy - hgt / 2} width={820} height={hgt} rx={hgt / 2} fill="url(#fib)" />
            <rect x={130} y={cy - hgt / 2} width={820} height={hgt} rx={hgt / 2} fill="url(#stri)" />
          </g>
        );
      })}
      {/* yırtıklar */}
      {TEARS.map((tr, i) => {
        const a = pop(t, L(4) + tr.at * 0.8, 30, 9);
        const extra = i >= 3 ? sm(t, L(5) + 0.3, L(5) + 0.8) : 1;
        const vis = a * extra * (1 - repair);
        const cy = 640 + tr.row * 82;
        const zig = `M${tr.x},${cy - 30} l10,12 l-12,10 l12,12 l-10,12`;
        return (
          <g key={i} opacity={vis}>
            <path d={zig} stroke={C.orange} strokeWidth={14} fill="none" filter="url(#glow)" />
            <path d={zig} stroke="#1a0b0d" strokeWidth={9} fill="none" strokeLinejoin="round" />
            <path d={zig} stroke="#ffd2a8" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* damar + onarım hücreleri */}
      <rect x={130} y={1132} width={820} height={30} rx={15} fill="#7d1d2a" opacity={sm(t, L(6) - 0.2, L(6) + 0.3)} />
      {TEARS.flatMap((tr, i) =>
        [0, 1, 2].map((j) => {
          const st = L(6) + 0.2 + i * 0.18 + j * 0.25;
          const k = sm(t, st, st + 1.0);
          const cy = 640 + tr.row * 82;
          const x = tr.x + (j - 1) * 26;
          const y = 1147 + (cy - 1147) * k;
          const o = sm(t, st, st + 0.15) * (1 - repair);
          return <circle key={`${i}-${j}`} cx={x} cy={y} r={11} fill={C.cyan} stroke="white" strokeWidth={2} opacity={o} />;
        }),
      )}
      {/* güçlenme parıltısı */}
      <rect x={130} y={600} width={820} height={500} rx={30} fill={C.green} opacity={0.12 * repair * (0.6 + 0.4 * Math.sin(t * 5))} />
      {repair > 0 ? (
        <text x={540} y={1150} fill={C.green} fontFamily={MONO} fontSize={30} textAnchor="middle" opacity={repair}>
          + kalınlaşan lif
        </text>
      ) : null}
      {/* yavaş indirme etiketi */}
      <g opacity={win(t, L(5) + 0.2, L(6))}>
        <rect x={250} y={1110} width={580} height={60} rx={30} fill="#1d2230" stroke={C.orange} strokeWidth={3} />
        <text x={540} y={1150} fill="white" fontFamily={MONO} fontSize={28} textAnchor="middle">
          ← uzarken kasılma →
        </text>
      </g>
    </g>
  );
};

const PainCurve: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const x0 = 190, y0 = 1130, w = 720, h = 440;
  const k = sm(t, s + 0.2, s + 1.8);
  const f = (u: number) => {
    const hrs = u * 96;
    return Math.max(0.03, Math.exp(-Math.pow((hrs - 44) / 24, 2)) * 0.92);
  };
  const band = sm(t, s + 1.2, s + 1.8);
  return (
    <g opacity={sm(t, s, s + 0.3)}>
      <Axes x0={x0} y0={y0} w={w} h={h} xl={["0", "24", "48", "72", "96 sa"]} yl="AĞRI" />
      <rect x={x0 + w * 0.25} y={y0 - h} width={w * 0.5 * band} height={h} fill={C.orange} opacity={0.14} />
      <path d={curvePath(f, x0, y0, w, h, k)} fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" />
      <text x={x0 + w * 0.5} y={y0 - h - 22} fill={C.orange} fontFamily={MONO} fontSize={28} textAnchor="middle" opacity={band}>
        ZİRVE
      </text>
    </g>
  );
};

const Bars: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const v = [0.9, 0.45, 0.2];
  return (
    <g opacity={sm(t, s, s + 0.3)}>
      <rect x={130} y={530} width={820} height={680} rx={28} fill={C.panel} stroke={C.line} strokeWidth={3} />
      <text x={170} y={590} fill="#8b93a7" fontFamily={MONO} fontSize={26}>
        AYNI HAREKET · ERTESİ GÜN AĞRI
      </text>
      {v.map((h, i) => {
        const k = sm(t, s + 0.3 + i * 0.4, s + 0.9 + i * 0.4);
        const x = 230 + i * 230;
        return (
          <g key={i}>
            <rect x={x} y={1080 - 400 * h * k} width={150} height={400 * h * k} rx={18} fill={i === 0 ? C.orange : i === 1 ? "#ffb34d" : C.green} />
            <text x={x + 75} y={1140} fill="white" fontFamily={SANS} fontWeight={700} fontSize={34} textAnchor="middle">
              {i + 1}. sefer
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** yürüyen çöp adam */
const Walker: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const o = sm(t, s, s + 0.3);
  const ph = t * 6;
  const leg = (sgn: number) => {
    const a = Math.sin(ph) * 0.5 * sgn;
    return `M0,0 L${Math.sin(a) * 120},${Math.cos(a) * 120}`;
  };
  const arm = (sgn: number) => {
    const a = -Math.sin(ph) * 0.45 * sgn;
    return `M0,-150 L${Math.sin(a) * 100},${-150 + Math.cos(a) * 100}`;
  };
  return (
    <g opacity={o}>
      <defs>
        <clipPath id="wclip">
          <rect x={130} y={530} width={820} height={680} rx={28} />
        </clipPath>
      </defs>
      <rect x={130} y={530} width={820} height={680} rx={28} fill={C.panel} stroke={C.line} strokeWidth={3} />
      <g clipPath="url(#wclip)">
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={((i * 120 - t * 160) % 1440 + 1440) % 1440 - 180} y={1078} width={60} height={8} rx={4} fill="#3a4258" />
      ))}
      </g>
      <g transform={`translate(540,${955 + Math.abs(Math.sin(ph)) * -8})`} stroke={C.green} strokeWidth={16} strokeLinecap="round" fill="none">
        <path d={leg(1)} />
        <path d={leg(-1)} />
        <path d="M0,0 L0,-170" />
        <path d={arm(1)} />
        <path d={arm(-1)} />
        <circle cx={0} cy={-215} r={40} fill={C.panel} />
      </g>
      <text x={540} y={640} fill="white" fontFamily={SANS} fontWeight={800} fontSize={64} textAnchor="middle">
        10–15 dk
      </text>
    </g>
  );
};

const Question: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const p = pop(t, s, 30, 10);
  return (
    <g transform={`translate(540,860) scale(${p})`}>
      <circle r={230} fill={`${C.orange}22`} stroke={C.orange} strokeWidth={6} />
      <text y={90} fill={C.orange} fontFamily={SANS} fontWeight={800} fontSize={300} textAnchor="middle">
        ?
      </text>
    </g>
  );
};

// ------------------------------------------------------------ ana video

export const OrnekKasAgrisi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = KAS_TL;
  const L = tl.at;
  const i = Math.max(0, tl.idx(t));
  const headStart = (n: number) => {
    // aynı başlık tekrar ediyorsa yeniden animasyon yapma
    let k = n;
    while (k > 0 && HEADS[k - 1][1] === HEADS[n][1]) k--;
    return L(k);
  };
  const shake = t > L(1) + 1.6 && t < L(1) + 2.0 ? Math.sin(t * 90) * 6 : 0;

  return (
    <AbsoluteFill lang="tr" style={{ background: C.bg, overflow: "hidden" }}>
      <Grid t={t} />
      <div style={{ position: "absolute", top: 110, left: 70, right: 70, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, color: "#5d667d", letterSpacing: 2 }}>
        <span>● SPOR · BİLİM</span>
        <span>KAS AĞRISI</span>
      </div>
      <Heading t={t} i={i} s={headStart(i)} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        {t < L(2) ? <g opacity={1 - sm(t, L(2) - 0.25, L(2))}><Days t={t} s={L(0)} s2={L(1)} /></g> : null}
        {t >= L(2) - 0.05 && t < L(4) ? (
          <g opacity={1 - sm(t, L(4) - 0.25, L(4))}>
            {t < L(3) ? <LacticBadge t={t} s={L(2)} cross={0} /> : null}
            {t >= L(3) ? (
              <g>
                <Lactate t={t} s={L(3)} />
                <g transform="translate(560,330) scale(0.42)" opacity={sm(t, L(3), L(3) + 0.3)}>
                  <LacticBadge t={t} s={L(2)} cross={sm(t, L(3) + 1.6, L(3) + 2.1)} />
                </g>
              </g>
            ) : null}
          </g>
        ) : null}
        {t >= L(4) - 0.05 && t < L(7) ? <g opacity={1 - sm(t, L(7) - 0.25, L(7))}><Fibers t={t} s={L(4)} L={L} /></g> : null}
        {t >= L(7) - 0.05 && t < L(8) ? <g opacity={1 - sm(t, L(8) - 0.25, L(8))}><PainCurve t={t} s={L(7)} /></g> : null}
        {t >= L(8) - 0.05 && t < L(9) ? <g opacity={1 - sm(t, L(9) - 0.25, L(9))}><Fibers t={t} s={L(8) - 0.4} L={L} /></g> : null}
        {t >= L(9) - 0.05 && t < L(10) ? <g opacity={1 - sm(t, L(10) - 0.25, L(10))}><Bars t={t} s={L(9)} /></g> : null}
        {t >= L(10) - 0.05 && t < L(11) ? <g opacity={1 - sm(t, L(11) - 0.25, L(11))}><Walker t={t} s={L(10)} /></g> : null}
        {t >= L(11) - 0.05 ? <Question t={t} s={L(11)} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 1340, width: 8, height: 170, background: C.orange, borderRadius: 4, opacity: 0.9 }} />
      <Subtitle lines={KAS_LINES} tl={tl} t={t} color={C.orange} top={1340} size={60} />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.3, tl.total - 0.4, tl.total], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
