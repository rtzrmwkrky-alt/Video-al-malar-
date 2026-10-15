/**
 * Örnek 4 — "Doğru mu, yanlış mı?" (4 soruluk spor efsaneleri testi, izleyiciyi oyuna sokar).
 * Sessiz örnek: zaman satırlardan hesaplanır, ses yok.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, SERIF, loadFonts } from "../fonts";
import { HlText, type Line, Subtitle, pop, sm, timeline, up, win } from "../ornek/common";

loadFonts();

const C = { bg: "#FFE14D", ink: "#111", card: "#FFFDF6", red: "#FF4B3E", green: "#22C55E", blue: "#3B82F6" };

export const DY_LINES: Line[] = [
  { text: "Spor hakkında herkesin bildiği 4 şey. Sence hangisi doğru?", hl: ["doğru?"] },
  { text: "Mekik çekersen göbek yağın erir.", hold: 1.2 },
  { text: "Yanlış. Yağ bölgesel yakılmaz, vücut enerjiyi her yerden kullanır.", hl: ["yanlış."] },
  { text: "Ne kadar çok terlersen, o kadar çok yağ yakarsın.", hold: 1.2 },
  { text: "Yanlış. Ter vücudu serinletir, tartıda giden kilo sadece su.", hl: ["yanlış."] },
  { text: "Spora ara verince kaslar yağa dönüşür.", hold: 1.2 },
  { text: "Yanlış. Kas ve yağ farklı dokular, biri diğerine dönüşmez.", hl: ["yanlış."] },
  { text: "Günde 10 dakika yürümek bile fark yaratır.", hold: 1.2 },
  { text: "Doğru! Hiç hareket etmemektense her hareket kazançtır.", hl: ["doğru!"] },
  { text: "Kaç tanesini bildin? Yorumlara yaz.", hl: ["kaç"], hold: 1.4 },
];

export const DY_TL = timeline(DY_LINES, 0.3);

const Q = [
  { q: 1, a: 2, ok: false, icon: "crunch" },
  { q: 3, a: 4, ok: false, icon: "sweat" },
  { q: 5, a: 6, ok: false, icon: "muscle" },
  { q: 7, a: 8, ok: true, icon: "walk" },
] as const;

// ------------------------------------------------------------ simgeler

const Icon: React.FC<{ kind: string; t: number }> = ({ kind, t }) => {
  const st = { stroke: C.ink, strokeWidth: 12, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  if (kind === "crunch") {
    const k = (Math.sin(t * 5) + 1) / 2;
    const a = -0.2 - k * 0.7;
    const hip = { x: 0, y: 40 };
    const sh = { x: hip.x - Math.cos(a) * 110, y: hip.y + Math.sin(a) * 110 };
    return (
      <g>
        <line x1={-170} y1={60} x2={170} y2={60} {...st} strokeWidth={8} />
        <path d={`M${hip.x},${hip.y} L60,-20 L120,50`} {...st} />
        <path d={`M${hip.x},${hip.y} L${sh.x},${sh.y}`} {...st} />
        <circle cx={sh.x - Math.cos(a) * 40} cy={sh.y + Math.sin(a) * 40} r={30} {...st} fill={C.card} />
      </g>
    );
  }
  if (kind === "sweat") {
    return (
      <g>
        {[-90, 0, 90].map((x, i) => {
          const y = ((t * 120 + i * 50) % 150) - 60;
          return <path key={i} transform={`translate(${x},${y})`} d="M0,-45 C30,0 35,20 0,40 C-35,20 -30,0 0,-45 Z" fill={C.blue} stroke={C.ink} strokeWidth={8} />;
        })}
      </g>
    );
  }
  if (kind === "muscle") {
    return (
      <g>
        <path d="M-170,30 C-160,-50 -90,-80 -60,-30 C-40,-60 -10,-20 -40,30 Z" fill="#ff8a7a" stroke={C.ink} strokeWidth={9} />
        <path d="M-15,0 L30,0 M15,-18 L35,0 L15,18" {...st} strokeWidth={9} />
        <ellipse cx={120} cy={0} rx={70} ry={50} fill="#ffe6a8" stroke={C.ink} strokeWidth={9} />
        <path d="M-40,-60 L40,60 M40,-60 L-40,60" stroke={C.red} strokeWidth={14} strokeLinecap="round" />
      </g>
    );
  }
  // walk
  const ph = t * 6;
  const leg = (s: number) => `M0,20 L${Math.sin(Math.sin(ph) * 0.5 * s) * 80},${20 + Math.cos(Math.sin(ph) * 0.5 * s) * 80}`;
  const arm = (s: number) => `M0,-70 L${Math.sin(-Math.sin(ph) * 0.45 * s) * 65},${-70 + Math.cos(-Math.sin(ph) * 0.45 * s) * 65}`;
  return (
    <g transform="translate(0,-10)">
      <path d={leg(1)} {...st} />
      <path d={leg(-1)} {...st} />
      <path d="M0,20 L0,-90" {...st} />
      <path d={arm(1)} {...st} />
      <path d={arm(-1)} {...st} />
      <circle cx={0} cy={-120} r={28} {...st} fill={C.card} />
      <text x={110} y={-60} fontFamily={SANS} fontWeight={800} fontSize={48} fill={C.ink}>
        10'
      </text>
    </g>
  );
};

// ------------------------------------------------------------ parçalar

const Header: React.FC<{ t: number; step: number }> = ({ t, step }) => (
  <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center" }}>
    <div style={{ display: "inline-flex", gap: 18, alignItems: "center", transform: `rotate(-2deg)` }}>
      <span style={{ background: C.green, color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 64, padding: "8px 26px", border: `6px solid ${C.ink}`, borderRadius: 18, boxShadow: `8px 8px 0 ${C.ink}` }}>
        DOĞRU MU
      </span>
      <span style={{ background: C.red, color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 64, padding: "8px 26px", border: `6px solid ${C.ink}`, borderRadius: 18, boxShadow: `8px 8px 0 ${C.ink}` }}>
        YANLIŞ MI?
      </span>
    </div>
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 40 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 110,
            height: 18,
            borderRadius: 9,
            border: `4px solid ${C.ink}`,
            background: i < step ? C.ink : i === step ? `linear-gradient(90deg, ${C.ink} ${50 + 50 * Math.sin(t * 4)}%, transparent 0)` : "transparent",
          }}
        />
      ))}
    </div>
  </div>
);

const Ring: React.FC<{ k: number; n: number }> = ({ k, n }) => (
  <svg width={150} height={150} viewBox="-75 -75 150 150">
    <circle r={60} fill={C.card} stroke={C.ink} strokeWidth={8} />
    <circle r={60} fill="none" stroke={C.red} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={k} transform="rotate(-90)" />
    <text y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill={C.ink}>
      {n}
    </text>
  </svg>
);

const QuestionCard: React.FC<{ t: number; L: (i: number) => number; n: number }> = ({ t, L, n }) => {
  const q = Q[n];
  const s = L(q.q);
  const a = L(q.a);
  const e = L(q.a + 1);
  const inK = pop(t, s, 30, 14);
  const outK = sm(t, e - 0.3, e);
  const verdict = pop(t, a, 30, 9);
  // son 1.2 sn: geri sayım
  const cd = interpolate(t, [a - 1.5, a - 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cdN = 3 - Math.min(2, Math.floor(cd * 3));
  const reveal = interpolate(t, [s, s + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const explain = DY_LINES[q.a];
  const exReveal = interpolate(t, [a + 0.3, a + 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = q.ok ? C.green : C.red;
  const pick = (ok: boolean) => (t >= a ? (ok === q.ok ? 1 : 0.35) : 1);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 420,
        transform: `translateX(${(1 - inK) * 900 - outK * 1100}px) rotate(${(1 - inK) * 8 - outK * 6}deg)`,
      }}
    >
      <div style={{ background: C.card, border: `7px solid ${C.ink}`, borderRadius: 40, boxShadow: `14px 14px 0 ${C.ink}`, padding: "40px 50px 50px", position: "relative", minHeight: 860 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: "#666" }}>SORU {n + 1} / 4</div>
        <svg width={820} height={300} viewBox="-410 -150 820 300" style={{ display: "block", margin: "10px auto 0" }}>
          <Icon kind={q.icon} t={t} />
        </svg>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1.1, letterSpacing: -1.5, color: C.ink, textWrap: "balance", marginTop: 10 }}>
          <HlText line={DY_LINES[q.q]} color={C.ink} base={C.ink} reveal={reveal} />
        </div>
        {t >= a ? (
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 46, lineHeight: 1.22, color: "#333", marginTop: 30, textWrap: "balance" }}>
            <HlText line={{ text: explain.text.replace(/^(Yanlış\.|Doğru!)\s*/, "") }} color={color} base="#333" reveal={exReveal} />
          </div>
        ) : null}
        {verdict > 0 ? (
          <div
            style={{
              position: "absolute",
              right: 30,
              top: 40,
              transform: `rotate(${-12}deg) scale(${2.2 - 1.2 * verdict})`,
              opacity: Math.min(1, verdict * 2),
              border: `10px solid ${color}`,
              color,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 84,
              padding: "4px 26px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.85)",
            }}
          >
            {q.ok ? "DOĞRU" : "YANLIŞ"}
          </div>
        ) : null}
        {cd > 0 && t < a ? (
          <div style={{ position: "absolute", right: 40, top: 30 }}>
            <Ring k={(cd * 3) % 1} n={cdN} />
          </div>
        ) : null}
      </div>
      {/* oylama düğmeleri */}
      <div style={{ display: "flex", gap: 30, marginTop: 50 }}>
        {[true, false].map((ok) => (
          <div
            key={String(ok)}
            style={{
              flex: 1,
              textAlign: "center",
              background: ok ? C.green : C.red,
              color: "white",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 60,
              padding: "26px 0",
              border: `6px solid ${C.ink}`,
              borderRadius: 26,
              boxShadow: `8px 8px 0 ${C.ink}`,
              opacity: pick(ok),
              transform: t >= a && ok === q.ok ? `scale(${1 + 0.06 * verdict})` : undefined,
            }}
          >
            {ok ? "DOĞRU" : "YANLIŞ"}
          </div>
        ))}
      </div>
    </div>
  );
};

const Intro: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const o = 1 - sm(t, L(1) - 0.3, L(1));
  const p = pop(t, L(0) + 0.1, 30, 10);
  return (
    <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", opacity: o, transform: `scale(${p})` }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 380, lineHeight: 1, color: C.ink, letterSpacing: -10 }}>4</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 110, color: C.ink, marginTop: -10 }}>spor efsanesi</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 48, color: C.ink, marginTop: 30, opacity: 0.75 }}>Kaçını bileceksin?</div>
    </div>
  );
};

const Outro: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const p = pop(t, L(9), 30, 11);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 210, lineHeight: 1, color: C.ink, letterSpacing: -6 }}>
        ? <span style={{ color: "#555" }}>/</span> 4
      </div>
      <div style={{ display: "inline-block", marginTop: 60, background: C.card, border: `6px solid ${C.ink}`, boxShadow: `10px 10px 0 ${C.ink}`, borderRadius: 30, padding: "24px 40px", fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.ink }}>
        Skorunu yorumlara yaz
      </div>
    </div>
  );
};

// ------------------------------------------------------------ ana video

export const OrnekDogruYanlis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = DY_TL;
  const L = tl.at;
  const i = tl.idx(t);
  const step = i < 1 ? 0 : Math.min(4, Math.floor((i - 1) / 2) + (i >= 9 ? 1 : 0));
  return (
    <AbsoluteFill lang="tr" style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.ink}22 3px, transparent 3px)`, backgroundSize: "44px 44px", backgroundPosition: `${(t * 20) % 44}px ${(t * 20) % 44}px` }} />
      <Header t={t} step={step} />
      {t < L(1) ? <Intro t={t} L={L} /> : null}
      {Q.map((q, n) => (t >= L(q.q) - 0.05 && t < L(q.a + 1) ? <QuestionCard key={n} t={t} L={L} n={n} /> : null))}
      <Outro t={t} L={L} />
      <Subtitle lines={DY_LINES} tl={tl} t={t} color={C.red} top={1560} size={58} base={C.ink} hidden={(n) => n >= 1 && n <= 8} />
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, color: C.ink, opacity: 0.55 * win(t, L(1), L(9)) }}>
        {up("cevabı görmeden karar ver")}
      </div>
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.3, tl.total - 0.4, tl.total], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
