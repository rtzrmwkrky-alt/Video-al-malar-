/**
 * BoyUzama için yeni görünüm önerileri: her biri 5 sn'lik sessiz deneme sahnesi, arka arkaya.
 * 1 Piksel oyun · 2 Telefon mesajlaşma · 3 Anime aksiyon · 4 İzometrik 3B mini dünya · 5 Kil (hamur) görünümü
 */
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { MONO, ROUND, SANS, loadFonts } from "../fonts";
import { pop as rawPop, sm } from "../ornek/common";

loadFonts();

const SEG = 150; // her stil 5 sn
export const STIL_FRAMES = SEG * 5;
const pop = (t: number, at: number) => rawPop(t, at, 30, 16);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** sahne başında stil adı */
const Label: React.FC<{ n: number; name: string; desc: string }> = ({ n, name, desc }) => {
  const t = useCurrentFrame() / 30;
  const o = interpolate(t, [0, 0.25, 4.6, 5], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1690, textAlign: "center", opacity: o }}>
      <div
        style={{
          display: "inline-block",
          background: "rgba(10,12,20,0.82)",
          color: "#fff",
          borderRadius: 60,
          padding: "18px 44px 22px",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 62,
          letterSpacing: -1,
        }}
      >
        <span style={{ color: "#ffd23f" }}>{n}</span> · {name}
        <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.85, marginTop: 4 }}>{desc}</div>
      </div>
    </div>
  );
};

// =================================================================== 1 · PİKSEL OYUN

const PAL: Record<string, string> = {
  k: "#1a1c2c",
  h: "#4a2a1c",
  s: "#ffcd75",
  e: "#1a1c2c",
  w: "#f4f4f4",
  b: "#41a6f6",
  B: "#3b5dc9",
  p: "#333c57",
  r: "#b13e53",
  m: "#a7f070",
  g: "#38b764",
  v: "#7b3fa0",
  V: "#b55dd6",
  y: "#ffcd75",
};

const HERO = [
  "......kkkk......",
  "....kkhhhhkk....",
  "...khhhhhhhhk...",
  "..khhhhhhhhhhk..",
  "..khhssssssshk..",
  "..kssekssseksk..",
  "..ksssssssssk...",
  "...ksssrrsssk...",
  "....kssssssk....",
  "...kkbbbbbbkk...",
  "..kbbbbwwbbbbk..",
  ".kbbbbbbbbbbbbk.",
  ".ksbbbbbbbbbbsk.",
  ".ksbBBBBBBBBbsk.",
  ".kskbbbbbbbbksk.",
  "..k.kbbbbbbk.k..",
  "....kppppppk....",
  "....kppkkppk....",
  "....kppk.kppk...",
  "....kppk.kppk...",
  "...kwwwk.kwwwk..",
  "...kkkkk.kkkkk..",
];

const BOSS = [
  "....kkkkkkkk....",
  "..kkVVVVVVVVkk..",
  ".kVVVVVVVVVVVVk.",
  "kVVVVVVVVVVVVVVk",
  "kVVwwkVVVVkwwVVk",
  "kVVwkkVVVVkkwVVk",
  "kVVVVVVVVVVVVVVk",
  "kVVVkwkwkwkwVVVk",
  "kVVVVkkkkkkVVVVk",
  "kvVVVVVVVVVVVVvk",
  "kvvVVVVVVVVVVvvk",
  "kvkvvkvvvvkvvkvk",
  ".k.kk.kkkk.kk.k.",
];

const Sprite: React.FC<{ map: string[]; x: number; y: number; px: number; flash?: boolean }> = ({ map, x, y, px, flash }) => (
  <g>
    {map.flatMap((row, j) =>
      row.split("").map((c, i) =>
        c === "." ? null : <rect key={`${i}-${j}`} x={x + i * px} y={y + j * px} width={px} height={px} fill={flash ? "#ffffff" : PAL[c]} />,
      ),
    )}
  </g>
);

const PixelGame: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const step = Math.floor(f / 4); // piksel oyun gibi kesik hareket
  const typed = (s: string, a: number, cps = 26) => s.slice(0, Math.max(0, Math.floor((t - a) * cps)));
  const hit = t > 3.0 && t < 3.25;
  const hp = interpolate(t, [3.0, 3.5], [1, 0.45], clamp);
  const boy = interpolate(t, [3.3, 4.0], [0.55, 0.7], clamp);
  const starU = interpolate(t, [2.4, 3.0], [0, 1], clamp);
  const curl = step % 6 < 3 ? 0 : -6;
  return (
    <AbsoluteFill style={{ background: "#1a1c2c" }}>
      <svg viewBox="0 0 180 320" width={1080} height={1920} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        {/* gökyüzü bantları */}
        {["#29366f", "#3b5dc9", "#41a6f6", "#73eff7"].map((c, i) => (
          <rect key={c} x={0} y={i * 55} width={180} height={55} fill={c} />
        ))}
        {/* bulutlar */}
        {[0, 1, 2].map((k) => {
          const x = ((k * 70 - step) % 230 + 230) % 230 - 40;
          return (
            <g key={k} fill="#f4f4f4">
              <rect x={x} y={40 + k * 30} width={30} height={6} />
              <rect x={x + 6} y={34 + k * 30} width={16} height={6} />
            </g>
          );
        })}
        {/* zemin */}
        <rect x={0} y={200} width={180} height={8} fill="#a7f070" />
        <rect x={0} y={208} width={180} height={120} fill="#257179" />
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 4 }).map((__, j) => (
            <rect key={`${i}-${j}`} x={i * 16 + (j % 2) * 8} y={212 + j * 8} width={14} height={6} fill="#38b764" opacity={0.5} />
          )),
        )}
        {/* üst bilgi çubuğu */}
        <rect x={4} y={6} width={172} height={30} fill="#1a1c2c" />
        <rect x={5} y={7} width={170} height={28} fill="none" stroke="#f4f4f4" strokeWidth={1} />
        <text x={10} y={18} fontFamily={MONO} fontWeight={500} fontSize={8} fill="#ffcd75">
          LV 14
        </text>
        <text x={10} y={30} fontFamily={MONO} fontWeight={500} fontSize={8} fill="#f4f4f4">
          BOY
        </text>
        <rect x={30} y={24} width={60} height={7} fill="#333c57" />
        <rect x={30} y={24} width={Math.round(60 * boy)} height={7} fill="#a7f070" />
        <text x={100} y={18} fontFamily={MONO} fontWeight={500} fontSize={7} fill="#f4f4f4">
          EFSANE
        </text>
        <rect x={100} y={24} width={70} height={7} fill="#333c57" />
        <rect x={100} y={24} width={Math.round(70 * hp)} height={7} fill="#b13e53" />
        {/* kahraman */}
        <Sprite map={HERO} x={30} y={156 + (step % 2)} px={2} />
        <g transform={`translate(0,${curl})`}>
          <rect x={22} y={180} width={4} height={8} fill="#333c57" />
          <rect x={26} y={183} width={8} height={2} fill="#94b0c2" />
          <rect x={34} y={180} width={4} height={8} fill="#333c57" />
        </g>
        {/* efsane canavarı */}
        <g transform={`translate(${hit ? 3 : 0},${step % 4 < 2 ? 0 : 2})`}>
          <Sprite map={BOSS} x={112} y={150} px={3.5} flash={hit && step % 2 === 0} />
        </g>
        {/* bilgi yıldızı */}
        {starU > 0 && starU < 1 ? (
          <g transform={`translate(${Math.round(64 + starU * 66)},${Math.round(170 - Math.sin(starU * Math.PI) * 30)})`} fill="#ffcd75">
            <rect x={-2} y={-6} width={4} height={12} />
            <rect x={-6} y={-2} width={12} height={4} />
          </g>
        ) : null}
        {t > 3.05 && t < 4.2 ? (
          <text x={140} y={Math.round(140 - (t - 3.05) * 14)} fontFamily={MONO} fontWeight={500} fontSize={10} fill="#ffffff" stroke="#1a1c2c" strokeWidth={2} paintOrder="stroke">
            -50
          </text>
        ) : null}
        {t > 3.6 ? (
          <text x={90} y={120} textAnchor="middle" fontFamily={MONO} fontWeight={500} fontSize={14} fill="#ffcd75" stroke="#1a1c2c" strokeWidth={3} paintOrder="stroke" opacity={step % 2 ? 1 : 0.7}>
            BOY +1!
          </text>
        ) : null}
        {/* diyalog kutusu */}
        <rect x={6} y={232} width={168} height={46} fill="#1a1c2c" />
        <rect x={8} y={234} width={164} height={42} fill="none" stroke="#f4f4f4" strokeWidth={1.5} />
        <text x={14} y={248} fontFamily={MONO} fontWeight={500} fontSize={7.5} fill={t < 2.3 ? "#ff8fb6" : "#a7f070"}>
          {t < 2.3 ? "ANNE:" : "BİLGİ +1:"}
        </text>
        <text x={14} y={260} fontFamily={MONO} fontWeight={500} fontSize={7.5} fill="#f4f4f4">
          {t < 2.3 ? typed("Ağırlık kaldırma,", 0.2) : typed("Boy, büyüme", 2.4)}
        </text>
        <text x={14} y={271} fontFamily={MONO} fontWeight={500} fontSize={7.5} fill="#f4f4f4">
          {t < 2.3 ? typed("boyun kısa kalır!", 0.85) : typed("plağından uzar!", 2.9)}
        </text>
      </svg>
      <Label n={1} name="PİKSEL OYUN" desc="Efsane = bölüm sonu canavarı, bilgi = güç" />
    </AbsoluteFill>
  );
};

// =================================================================== 2 · TELEFON MESAJLAŞMA

type Msg = { at: number; me?: boolean; who?: string; whoC?: string; text?: string; card?: boolean };
const MSGS: Msg[] = [
  { at: 0.3, who: "Annem", whoC: "#e0559b", text: "Ağırlık kaldırma, boyun kısa kalır!! 😤" },
  { at: 1.3, me: true, text: "Bu doğru mu ya? 🤔" },
  { at: 2.6, who: "Koç Emre", whoC: "#2f8f5b", card: true },
  { at: 3.8, me: true, text: "Anne bak 👇😎" },
];

const XrayMini: React.FC = () => (
  <svg width={560} height={306} viewBox="0 0 420 230">
    <rect width={420} height={230} rx={18} fill="#10141f" />
    {[0, 1].map((k) => (
      <g key={k} transform={`translate(${105 + k * 210},115)`} fill="#d9e1ee">
        <rect x={-26} y={-115} width={52} height={78} />
        <path d="M-26,-40 C-30,-18 -52,-12 -48,6 Q-24,16 0,8 Q24,16 48,6 C52,-12 30,-18 26,-40 Z" />
        <path d="M-44,30 Q0,22 44,30 L40,52 C30,58 28,66 26,115 L-26,115 C-28,66 -30,58 -40,52 Z" />
        {k === 0 ? <path d="M-44,-8 Q0,0 44,-8 L44,-1 Q0,7 -44,-1 Z" fill="#10141f" /> : null}
        <text y={100} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={22} fill="#ffd23f" stroke="#10141f" strokeWidth={5} paintOrder="stroke">
          {k === 0 ? "12 yaş" : "18 yaş"}
        </text>
      </g>
    ))}
  </svg>
);

const Phone: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const shown = MSGS.filter((m) => t >= m.at);
  const typing = t > 2.0 && t < 2.6;
  // yeni mesaj geldikçe liste yukarı kayar
  const shift = interpolate(t, [3.75, 4.1], [0, 150], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#2b2140,#120f1c)" }}>
      <div style={{ position: "absolute", left: 90, top: 110, width: 900, height: 1540, borderRadius: 90, background: "#0b0b10", boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, borderRadius: 72, overflow: "hidden", background: "#efe7de" }}>
          {/* üst bar */}
          <div style={{ position: "relative", zIndex: 2, height: 210, background: "#1f2c34", color: "#fff", display: "flex", alignItems: "flex-end", padding: "0 36px 26px", gap: 24, fontFamily: SANS }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, background: "#6c5ce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>👨‍👩‍👦</div>
            <div>
              <div style={{ fontSize: 44, fontWeight: 800 }}>Aile Grubu</div>
              <div style={{ fontSize: 30, opacity: 0.7 }}>{typing ? "Koç Emre yazıyor…" : "Annem, Babam, Koç Emre, Sen"}</div>
            </div>
          </div>
          {/* mesajlar */}
          <div style={{ position: "absolute", left: 30, right: 30, top: 250, transform: `translateY(${-shift}px)` }}>
            {shown.map((m, i) => {
              const p = sm(t, m.at, m.at + 0.25);
              return (
                <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", marginBottom: 26, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                  <div
                    style={{
                      position: "relative",
                      maxWidth: 680,
                      background: m.me ? "#d9fdd3" : "#ffffff",
                      borderRadius: 34,
                      padding: m.card ? 16 : "22px 30px",
                      fontFamily: SANS,
                      fontSize: 50,
                      lineHeight: 1.25,
                      color: "#111b21",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.12)",
                    }}
                  >
                    {m.who ? <div style={{ color: m.whoC, fontWeight: 800, fontSize: 32, marginBottom: 6, padding: m.card ? "6px 14px 0" : 0 }}>{m.who}</div> : null}
                    {m.card ? (
                      <>
                        {t > 3.3 ? (
                          <div style={{ position: "absolute", right: -20, bottom: -34, background: "#fff", borderRadius: 30, padding: "4px 14px", fontSize: 44, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", transform: `scale(${pop(t, 3.3)})` }}>❤️🔥</div>
                        ) : null}
                        <XrayMini />
                        <div style={{ padding: "14px 14px 6px", fontSize: 40 }}>
                          Boyu <b>büyüme plağı</b> belirler, dambıl değil 💪
                        </div>
                      </>
                    ) : (
                      m.text
                    )}
                    <div style={{ textAlign: "right", fontSize: 26, color: "#667781", marginTop: 4 }}>
                      21:0{i + 2} {m.me ? <span style={{ color: i === 3 && t > 4.3 ? "#53bdeb" : "#8696a0" }}>✓✓</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing ? (
              <div style={{ display: "inline-flex", gap: 12, background: "#fff", borderRadius: 34, padding: "26px 32px" }}>
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{ width: 18, height: 18, borderRadius: 9, background: "#8696a0", opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + k)) }} />
                ))}
              </div>
            ) : null}
          </div>
          {/* tepki */}
          {/* yazma alanı */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140, background: "#f0f2f5", display: "flex", alignItems: "center", padding: "0 30px", gap: 20 }}>
            <div style={{ flex: 1, height: 84, borderRadius: 42, background: "#fff", fontFamily: SANS, fontSize: 36, color: "#8696a0", display: "flex", alignItems: "center", paddingLeft: 34 }}>Mesaj yaz</div>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: "#00a884" }} />
          </div>
        </div>
      </div>
      <Label n={2} name="TELEFON MESAJLAŞMA" desc="Hikâye aile grubunda geçer" />
    </AbsoluteFill>
  );
};

// =================================================================== 3 · ANİME AKSİYON

const Anime: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const flash = interpolate(t, [2.55, 2.62, 2.9], [0, 1, 0], clamp);
  const shake = t > 2.6 && t < 3.1 ? Math.sin(f * 2.3) * 14 : 0;
  const push = 1 + 0.08 * sm(t, 0, 2.5);
  const eyeTw = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
  const rays = Array.from({ length: 64 }, (_, i) => i);
  const SKIN = "#ffe0c7";
  const SKIN_D = "#f2b99a";
  const Eye: React.FC<{ x: number; flip?: boolean }> = ({ x, flip }) => (
    <g transform={`translate(${x},905) scale(${flip ? -1 : 1},1)`}>
      <path d="M-62,-6 Q-20,-46 58,-26 L62,-14 Q-10,-30 -58,4 Z" fill="#14121c" />
      <ellipse cx={4} cy={22} rx={36} ry={46} fill="url(#iris)" stroke="#14121c" strokeWidth={4} />
      <ellipse cx={6} cy={28} rx={16} ry={22} fill="#0b0b18" />
      <ellipse cx={-10} cy={4} rx={11} ry={14} fill="#fff" opacity={eyeTw} />
      <circle cx={18} cy={44} r={6} fill="#fff" opacity={0.85} />
      <path d="M-44,62 Q4,76 46,58" stroke="#14121c" strokeWidth={3} fill="none" />
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "#16080a", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="ag" cx="50%" cy="48%" r="60%">
            <stop offset="0" stopColor="#ffcf5a" />
            <stop offset="0.5" stopColor="#ff5a3c" />
            <stop offset="1" stopColor="#3a0a12" />
          </radialGradient>
          <linearGradient id="iris" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b3f9c" />
            <stop offset="1" stopColor="#4fd2ff" />
          </linearGradient>
          <pattern id="tone" width={10} height={10} patternUnits="userSpaceOnUse">
            <circle cx={5} cy={5} r={2} fill="#000" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#ag)" />
        {/* hız çizgileri */}
        <g transform={`rotate(${t * 6},540,960)`}>
          {rays.map((i) => {
            const a = (i / 64) * Math.PI * 2;
            const w = 0.012 + (i % 3) * 0.006;
            return (
              <polygon
                key={i}
                points={`${540 + Math.cos(a) * 330},${960 + Math.sin(a) * 330} ${540 + Math.cos(a - w) * 2000},${960 + Math.sin(a - w) * 2000} ${540 + Math.cos(a + w) * 2000},${960 + Math.sin(a + w) * 2000}`}
                fill={i % 2 ? "#ffffff" : "#000000"}
                opacity={i % 2 ? 0.35 : 0.25}
              />
            );
          })}
        </g>
        <g transform={`translate(${shake},${shake * 0.4}) translate(540,1000) scale(${push}) translate(-540,-1000)`}>
          {/* boyun + yaka */}
          <path d="M470,1180 L470,1330 L610,1330 L610,1180 Z" fill={SKIN_D} stroke="#14121c" strokeWidth={6} />
          <path d="M260,1700 Q300,1380 470,1320 L540,1400 L610,1320 Q780,1380 820,1700 Z" fill="#2563eb" stroke="#14121c" strokeWidth={7} />
          <path d="M470,1320 L540,1400 L610,1320" fill="none" stroke="#fff" strokeWidth={14} />
          {/* yüz */}
          <path d="M370,760 C366,980 420,1150 540,1250 C660,1150 714,980 710,760 Z" fill={SKIN} stroke="#14121c" strokeWidth={7} strokeLinejoin="round" />
          <path d="M690,860 C700,1000 650,1130 560,1220 C640,1120 668,1000 650,860 Z" fill={SKIN_D} opacity={0.8} />
          <path d="M372,770 L708,770 L700,850 Q540,800 380,850 Z" fill={SKIN_D} opacity={0.9} />
          {/* kaşlar */}
          <path d="M405,840 L520,862 L516,878 L400,858 Z" fill="#14121c" />
          <path d="M675,840 L560,862 L564,878 L680,858 Z" fill="#14121c" />
          <Eye x={462} />
          <Eye x={618} flip />
          {/* burun + ağız */}
          <path d="M548,980 L556,1030 L538,1036" stroke="#14121c" strokeWidth={5} fill="none" strokeLinejoin="round" />
          <path d="M500,1112 Q540,1100 584,1110" stroke="#14121c" strokeWidth={7} fill="none" strokeLinecap="round" />
          {/* ter damlası */}
          <path d="M720,820 C740,860 744,880 724,892 C704,880 708,860 720,820 Z" fill="#bfeaff" stroke="#14121c" strokeWidth={4} />
          {/* sivri saç */}
          <path
            d="M330,880 L300,700 L250,720 L320,560 L270,500 L380,470 L360,380 L460,430 L500,320 L560,420 L640,330 L660,440 L770,400 L740,500 L830,520 L760,600 L820,720 L750,700 L720,880
               L700,780 L650,860 L640,770 L590,830 L560,760 L520,840 L490,770 L440,860 L430,780 L380,850 Z"
            fill="#1d1b2e"
            stroke="#14121c"
            strokeWidth={7}
            strokeLinejoin="round"
          />
          <path d="M420,520 L470,470 L520,500" stroke="#6b6ab8" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
        {/* manga noktaları */}
        <rect width={1080} height={1920} fill="url(#tone)" opacity={0.08} />
        {/* yazılar */}
        {t > 0.4 ? (
          <g transform={`translate(540,300) rotate(-6) scale(${pop(t, 0.4)})`}>
            <text textAnchor="middle" fontFamily={SANS} fontWeight={800} fontStyle="italic" fontSize={96} fill="#fff" stroke="#14121c" strokeWidth={18} paintOrder="stroke">
              KISA BOY LANETİ…?!
            </text>
          </g>
        ) : null}
        {t > 2.6 ? (
          <g transform={`translate(540,1560) rotate(4) scale(${pop(t, 2.6) * 1.1})`}>
            <text textAnchor="middle" fontFamily={SANS} fontWeight={800} fontStyle="italic" fontSize={190} fill="#ffd23f" stroke="#14121c" strokeWidth={26} paintOrder="stroke">
              EFSANE!
            </text>
          </g>
        ) : null}
      </svg>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Label n={3} name="ANİME AKSİYON" desc="Dramatik yakın çekim, hız çizgileri" />
    </AbsoluteFill>
  );
};

// =================================================================== 4 · İZOMETRİK 3B MİNİ DÜNYA

const LookAt: React.FC<{ y?: number }> = ({ y = 0 }) => {
  const { camera } = useThree();
  camera.lookAt(0, y, 0);
  camera.updateProjectionMatrix();
  return null;
};

const IsoWorld: React.FC<{ t: number }> = ({ t }) => {
  const COLS = 5;
  const flow = (t * 0.7) % 1;
  return (
    <group rotation={[0, -0.5 + t * 0.16, 0]}>
      {/* yüzen ada tabanı */}
      <mesh position={[0, -2.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.6, 4.4]} />
        <meshStandardMaterial color="#c9a27a" flatShading />
      </mesh>
      <mesh position={[0, -2.05, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.12, 4.4]} />
        <meshStandardMaterial color="#8fd17e" flatShading />
      </mesh>
      {/* kemik bloğu: gövde */}
      <mesh position={[0, -1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.5, 3]} />
        <meshStandardMaterial color="#f3e7cf" flatShading />
      </mesh>
      {/* büyüme plağı (kesit) */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.4, 3]} />
        <meshStandardMaterial color="#9fd8ff" transparent opacity={0.3} />
      </mesh>
      {/* hücre sütunları: aşağı akar, altta kemiğe dönüşür */}
      {Array.from({ length: COLS }).map((_, c) =>
        Array.from({ length: COLS }).map((__, r) =>
          [0, 1].map((k) => {
            const y = -0.12 - ((k + flow) % 2) * 0.24;
            const bone = y < -0.4;
            return (
              <mesh key={`${c}-${r}-${k}`} position={[-1.28 + c * 0.64, y, -1.28 + r * 0.64]} castShadow>
                <sphereGeometry args={[0.17, 12, 10]} />
                <meshStandardMaterial color={bone ? "#f3e7cf" : "#4fa8e8"} />
              </mesh>
            );
          }),
        ),
      )}
      {/* üst eklem başı */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.7, 3]} />
        <meshStandardMaterial color="#fbf3e2" flatShading />
      </mesh>
      {/* tepede minik sporcu */}
      <group position={[0.4, 0.6, 0.2]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.3, 4, 8]} />
          <meshStandardMaterial color="#3fa7ff" />
        </mesh>
        <mesh position={[0, 0.66, 0]} castShadow>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial color="#ffcfa8" />
        </mesh>
        <group position={[0, 0.5 + Math.abs(Math.sin(t * 3)) * 0.3, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
            <meshStandardMaterial color="#8b93a6" />
          </mesh>
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 0.08, 14]} />
              <meshStandardMaterial color="#3b3f58" />
            </mesh>
          ))}
        </group>
      </group>
      {/* ağaçlar */}
      {[
        [-1.9, -1.7],
        [1.8, -1.9],
        [1.9, 1.6],
      ].map(([x, z], i) => (
        <group key={i} position={[x, -1.95, z]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.4, 6]} />
            <meshStandardMaterial color="#8a5a3c" />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <coneGeometry args={[0.26, 0.6, 6]} />
            <meshStandardMaterial color="#38b764" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Isometric: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#ffe9d6 0%,#ffd1e0 55%,#c9d8ff 100%)" }}>
      <ThreeCanvas width={width} height={height} orthographic shadows camera={{ position: [10, 8, 10], zoom: 205, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true }}>
        <LookAt y={-0.9} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 10, 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <IsoWorld t={t} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 70, color: "#3d4566", opacity: sm(t, 0.6, 1.0) }}>
        Kemiğin içindeki <span style={{ color: "#2f86d6" }}>büyüme plağı</span>
      </div>
      <Label n={4} name="İZOMETRİK 3B MİNİ DÜNYA" desc="Maket gibi dönen küçük bir 3B dünya" />
    </AbsoluteFill>
  );
};

// =================================================================== 5 · KİL (HAMUR) GÖRÜNÜMÜ

/** parmak izi + hamur dokusu (bump map) */
const useClayTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#808080";
    g.fillRect(0, 0, 256, 256);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},0.08)`;
      g.beginPath();
      g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let k = 0; k < 6; k++) {
      const cx = rnd() * 256;
      const cy = rnd() * 256;
      g.strokeStyle = "rgba(40,40,40,0.25)";
      g.lineWidth = 1.2;
      for (let r = 4; r < 34; r += 4) {
        g.beginPath();
        g.ellipse(cx, cy, r, r * 0.7, rnd(), 0, Math.PI * 1.6);
        g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);

const Clay: React.FC<{ color: string; bump: THREE.Texture }> = ({ color, bump }) => (
  <meshStandardMaterial color={color} roughness={0.92} metalness={0} bumpMap={bump} bumpScale={0.6} />
);

const ClayWorld: React.FC<{ t: number }> = ({ t }) => {
  const bump = useClayTexture();
  const jit = (k: number) => Math.sin(Math.floor(t * 12) * 12.9898 + k * 78.233) * 0.006; // stop-motion titreşimi
  const lift = (1 - Math.cos(Math.floor(t * 12) / 12 * 3)) / 2; // dambıl
  const split = sm((t * 0.4) % 1, 0.2, 0.8); // hücre bölünmesi
  return (
    <group>
      {/* zemin ve fon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <Clay color="#f2c58f" bump={bump} />
      </mesh>
      <mesh position={[0, 3, -3]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <Clay color="#9fd3c7" bump={bump} />
      </mesh>
      {/* genç */}
      <group position={[-0.9 + jit(1), 0, 0]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <capsuleGeometry args={[0.55, 0.6, 8, 16]} />
          <Clay color="#3d8bd9" bump={bump} />
        </mesh>
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, -1.25, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.4, 6, 10]} />
            <Clay color="#3a3f5c" bump={bump} />
          </mesh>
        ))}
        <mesh position={[0, 0.75 + jit(2), 0]} castShadow>
          <sphereGeometry args={[0.62, 32, 24]} />
          <Clay color="#ffcba4" bump={bump} />
        </mesh>
        {/* saç */}
        <mesh position={[0, 1.08, -0.06]} scale={[1.05, 0.62, 1]} castShadow>
          <sphereGeometry args={[0.6, 24, 16]} />
          <Clay color="#4a2c1a" bump={bump} />
        </mesh>
        {/* gözler */}
        {[-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0.8, 0.55]}>
            <mesh>
              <sphereGeometry args={[0.1, 16, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.07]}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color="#1a1a22" roughness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.55, 0.58]} rotation={[0, 0, Math.PI]} scale={[1, 0.6, 0.6]}>
          <torusGeometry args={[0.13, 0.03, 8, 16, Math.PI]} />
          <Clay color="#a03b3b" bump={bump} />
        </mesh>
        {/* kol + dambıl */}
        <group position={[0.62, -0.1, 0.1]} rotation={[0, 0, -0.3 - lift * 1.6]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.5, 6, 10]} />
            <Clay color="#ffcba4" bump={bump} />
          </mesh>
          <group position={[0, -0.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 10]} />
              <Clay color="#7d8597" bump={bump} />
            </mesh>
            {[-0.32, 0.32].map((y) => (
              <mesh key={y} position={[0, y, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 12]} />
                <Clay color="#e84a4a" bump={bump} />
              </mesh>
            ))}
          </group>
        </group>
        <mesh position={[-0.62, -0.4, 0]} rotation={[0, 0, 0.25]} castShadow>
          <capsuleGeometry args={[0.15, 0.5, 6, 10]} />
          <Clay color="#ffcba4" bump={bump} />
        </mesh>
      </group>
      {/* bölünen kil hücre */}
      <group position={[1.15, -1.05 + jit(3), 0.6]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * split * 0.36, 0, 0]}>
            <mesh castShadow scale={[1 + 0.12 * (1 - split), 1, 1]}>
              <sphereGeometry args={[0.42, 32, 24]} />
              <Clay color="#7cc4f2" bump={bump} />
            </mesh>
            {[-0.12, 0.12].map((x) => (
              <mesh key={x} position={[x, 0.08, 0.38]}>
                <sphereGeometry args={[0.05, 10, 8]} />
                <meshStandardMaterial color="#1a1a22" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};

const ClayScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = Math.floor(f / 2.5) / 12; // 12 kare/sn stop-motion hissi
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#9fd3c7" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ position: [0, 0.5, 9.5], fov: 40 }} gl={{ antialias: true }}>
        <LookAt y={-0.1} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-3, 2, 3]} intensity={6} color="#ffd9b0" />
        <ClayWorld t={t} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 76, color: "#fff", WebkitTextStroke: "12px #2f4f5a", paintOrder: "stroke" }}>
        Hücreler bölünür… 🧫
      </div>
      <Label n={5} name="KİL (HAMUR) GÖRÜNÜMÜ" desc="Stop-motion, parmak izli sıcak doku" />
    </AbsoluteFill>
  );
};

// =================================================================== ana

export const StilOrnekleri: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#000" }}>
    <Sequence durationInFrames={SEG} name="1 piksel">
      <PixelGame />
    </Sequence>
    <Sequence from={SEG} durationInFrames={SEG} name="2 telefon">
      <Phone />
    </Sequence>
    <Sequence from={SEG * 2} durationInFrames={SEG} name="3 anime">
      <Anime />
    </Sequence>
    <Sequence from={SEG * 3} durationInFrames={SEG} name="4 izometrik">
      <Isometric />
    </Sequence>
    <Sequence from={SEG * 4} durationInFrames={SEG} name="5 kil">
      <ClayScene />
    </Sequence>
  </AbsoluteFill>
);
