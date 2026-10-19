/**
 * Kanal avatarı: Pixar tarzı büyük gözlü genç ("Efe" adayından türetildi, kullanıcı seçti).
 * Görünüm `ChibiLook` ile değişir (ten, saç modeli/rengi, göz rengi, üst, aksesuar).
 * 600x700 yerel kutuda omuz plan; göz kırpma, konuşurken ağız, hafif nefes/baş sallama.
 */
import React from "react";
import { blink } from "./Avatars";

export type HairStyle = "messy" | "curly" | "swept" | "cap";
export type TopStyle = "hoodie" | "tee" | "jersey";

export type ChibiLook = {
  skin: [string, string, string]; // ışık, orta, gölge
  hair: [string, string, string];
  hairStyle: HairStyle;
  iris: [string, string, string];
  top: [string, string, string]; // açık, koyu, detay
  topStyle: TopStyle;
  number?: string;
  band?: string; // alında ter bandı
  cap?: string; // ters şapka rengi
  freckles?: boolean;
  headphones?: string;
};

export const LOOKS: Record<string, ChibiLook> = {
  orijinal: {
    skin: ["#ffe2cc", "#f6bf98", "#d9926a"],
    hair: ["#8a5530", "#5a3218", "#36190a"],
    hairStyle: "messy",
    iris: ["#7fe0b0", "#2a9a78", "#0f4a3c"],
    top: ["#ff8a3d", "#e85d1a", "#d94e12"],
    topStyle: "hoodie",
  },
  kivircik: {
    skin: ["#f3c9a4", "#d99a6c", "#b5744a"],
    hair: ["#3a2a22", "#1f1612", "#0d0806"],
    hairStyle: "curly",
    iris: ["#c98a3c", "#7a4a1f", "#3a200a"],
    top: ["#3b82f6", "#1d4ed8", "#1e3a8a"],
    topStyle: "tee",
    band: "#ef4444",
    freckles: true,
  },
  sari: {
    skin: ["#ffe8d6", "#f8caa8", "#e0a27c"],
    hair: ["#ffd98a", "#e0a63c", "#a8701c"],
    hairStyle: "swept",
    iris: ["#9fd8ff", "#3b8fd9", "#1a4a80"],
    top: ["#34d399", "#059669", "#ffffff"],
    topStyle: "jersey",
    number: "7",
  },
  sapka: {
    skin: ["#ffe2cc", "#f2b98f", "#d38c62"],
    hair: ["#6b4226", "#3f2414", "#24130a"],
    hairStyle: "cap",
    iris: ["#b98a5a", "#6b4226", "#2e1a0c"],
    top: ["#a78bfa", "#7c3aed", "#5b21b6"],
    topStyle: "hoodie",
    cap: "#ef4444",
    headphones: "#111827",
  },
};

const HEAD = "M120,290 Q120,120 300,112 Q480,120 480,290 Q480,430 380,476 Q300,500 220,476 Q120,430 120,290 Z";

/** kıvırcık saç: başın üst kenarı boyunca yuvarlak bukleler */
const curls = () => {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1 + i / 10);
    out.push([300 + Math.cos(a) * 185, 270 + Math.sin(a) * 175, i % 2 ? 50 : 56]);
  }
  for (let i = 0; i < 5; i++) out.push([200 + i * 50, 160 + (i % 2) * 10, 40]);
  return out;
};

const Hair: React.FC<{ look: ChibiLook; id: string; back?: boolean }> = ({ look, id, back }) => {
  const f = `url(#${id}-hair)`;
  const [hl, , hd] = look.hair;
  switch (look.hairStyle) {
    case "messy":
      if (back) return null;
      return (
        <g>
          <path d="M112,300 Q90,150 200,92 Q300,40 410,88 Q500,140 488,300 Q470,230 440,200 Q420,170 380,176 Q330,150 290,182 Q240,150 200,190 Q150,210 140,280 Z" fill={f} />
          <path d="M200,110 Q190,50 250,64 Q262,10 320,40 Q370,0 392,60 Q450,50 430,110 Q330,80 200,110 Z" fill={f} />
          <path d="M290,182 Q300,120 360,110 Q330,140 340,170 Q320,160 290,182 Z" fill={hd} opacity={0.5} />
          <path d="M190,110 Q260,70 340,78" fill="none" stroke={hl} strokeWidth={14} strokeLinecap="round" opacity={0.6} />
        </g>
      );
    case "curly":
      if (back) return null;
      return (
        <g>
          <path d="M116,290 Q100,110 300,92 Q500,110 484,290 Q460,200 300,196 Q140,200 116,290 Z" fill={f} />
          {curls().map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={f} />
              <path d={`M${x - r * 0.5},${y - r * 0.2} Q${x},${y - r * 0.7} ${x + r * 0.5},${y - r * 0.2}`} fill="none" stroke={hl} strokeWidth={6} strokeLinecap="round" opacity={0.45} />
            </g>
          ))}
        </g>
      );
    case "swept":
      if (back) return null;
      return (
        <g>
          <path d="M114,300 Q92,120 280,84 Q470,70 492,280 Q474,200 420,176 Q330,214 220,196 Q150,214 140,300 Z" fill={f} />
          {/* yana taranmış büyük perçem */}
          <path d="M150,230 Q170,120 300,100 Q430,96 470,200 Q420,150 330,160 Q240,176 150,230 Z" fill={f} />
          <path d="M200,150 Q290,110 400,128" fill="none" stroke={hl} strokeWidth={16} strokeLinecap="round" opacity={0.7} />
          <path d="M230,180 Q320,150 420,166" fill="none" stroke={hd} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
        </g>
      );
    case "cap": {
      const c = look.cap ?? "#ef4444";
      if (back)
        // ters şapkanın siperi arkadan yukarı-yana taşar
        return <path d="M390,124 Q450,72 512,90 Q520,114 490,122 Q450,130 420,150 Z" fill={c} stroke="#00000033" strokeWidth={3} />;
      return (
        <g>
          {/* yanlardan taşan saç */}
          <path d="M112,300 Q100,220 140,200 L460,200 Q500,220 488,300 Q470,250 440,236 L160,236 Q130,250 112,300 Z" fill={f} />
          <path d="M116,236 Q118,92 300,84 Q482,92 484,236 Z" fill={c} />
          <path d="M150,130 Q220,96 300,94" fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.3} />
          <path d="M300,86 L300,226 M200,104 Q180,170 186,232 M400,104 Q420,170 414,232" fill="none" stroke="#00000022" strokeWidth={5} />
          <path d="M112,226 Q300,200 488,226 L488,252 Q300,226 112,252 Z" fill={c} />
          <path d="M112,226 Q300,200 488,226 L488,252 Q300,226 112,252 Z" fill="#000" opacity={0.18} />
          {/* önde ayar boşluğundan çıkan perçem */}
          <path d="M250,236 Q250,170 300,166 Q350,170 350,236 Z" fill="#00000033" />
          <path d="M256,252 Q262,184 300,182 Q340,184 344,252 Q320,230 300,240 Q280,230 256,252 Z" fill={f} />
          <circle cx={300} cy={88} r={11} fill={c} />
        </g>
      );
    }
  }
};

const Top: React.FC<{ look: ChibiLook; id: string; skin: string }> = ({ look, id, skin }) => {
  const [, dark, det] = look.top;
  const f = `url(#${id}-top)`;
  const neck = <path d="M250,476 Q300,510 350,476 L350,530 Q300,556 250,530 Z" fill={skin} />;
  if (look.topStyle === "hoodie")
    return (
      <g>
        <path d="M80,760 Q90,560 210,520 Q300,500 390,520 Q510,560 520,760 Z" fill={f} />
        <path d="M170,540 Q300,620 430,540 Q420,500 300,488 Q180,500 170,540 Z" fill={det} />
        {neck}
        <path d="M262,560 L254,650 M338,560 L346,650" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        <circle cx={254} cy={654} r={8} fill="#fff" />
        <circle cx={346} cy={654} r={8} fill="#fff" />
      </g>
    );
  if (look.topStyle === "tee")
    return (
      <g>
        <path d="M80,760 Q90,560 210,520 Q300,500 390,520 Q510,560 520,760 Z" fill={f} />
        {neck}
        <path d="M236,512 Q300,566 364,512" fill="none" stroke={det} strokeWidth={16} strokeLinecap="round" />
        <path d="M110,620 L170,600 M490,620 L430,600" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  // forma (atlet, V yaka, numara)
  return (
    <g>
      <path d="M80,760 Q90,580 180,540 L160,760 Z M520,760 Q510,580 420,540 L440,760 Z" fill={`url(#${id}-skin)`} />
      <path d="M150,760 Q160,600 190,530 Q230,520 250,500 L300,580 L350,500 Q370,520 410,530 Q440,600 450,760 Z" fill={f} />
      <path d="M250,476 Q300,500 350,476 L350,500 L300,580 L250,500 Z" fill={skin} />
      <path d="M244,498 L300,586 L356,498" fill="none" stroke={det} strokeWidth={12} strokeLinejoin="round" />
      <path d="M190,530 Q178,600 160,760 M410,530 Q422,600 440,760" fill="none" stroke={dark} strokeWidth={10} />
      <text x={300} y={672} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={96} fill={det}>
        {look.number ?? ""}
      </text>
    </g>
  );
};

export const Chibi: React.FC<{ t: number; talk?: number; id: string; look: ChibiLook; seed?: number }> = ({ t, talk = 0, id, look, seed = 0 }) => {
  const open = 1 - blink(t, 0.9 + seed);
  const bob = Math.sin(t * 2.1 + 3 + seed) * 5;
  const tilt = Math.sin(t * 1.2 + 3 + seed) * 2;
  const lx = Math.sin(t * 0.7 + seed) * 4;
  const [sl, sm, sd] = look.skin;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={sl} />
          <stop offset="0.7" stopColor={sm} />
          <stop offset="1" stopColor={sd} />
        </radialGradient>
        <radialGradient id={`${id}-hair`} cx="0.4" cy="0.25" r="0.9">
          <stop offset="0" stopColor={look.hair[0]} />
          <stop offset="0.6" stopColor={look.hair[1]} />
          <stop offset="1" stopColor={look.hair[2]} />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor={look.iris[0]} />
          <stop offset="0.6" stopColor={look.iris[1]} />
          <stop offset="1" stopColor={look.iris[2]} />
        </radialGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.top[0]} />
          <stop offset="1" stopColor={look.top[1]} />
        </linearGradient>
        <radialGradient id={`${id}-sclera`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe3ee" />
        </radialGradient>
        <clipPath id={`${id}-head`}>
          <path d={HEAD} />
        </clipPath>
      </defs>
      <g transform={`translate(0,${bob * 0.4 - 20})`}>
        <Top look={look} id={id} skin={sm} />
        {look.headphones ? (
          <g>
            <path d="M170,560 Q300,640 430,560" fill="none" stroke={look.headphones} strokeWidth={18} strokeLinecap="round" />
            <ellipse cx={176} cy={548} rx={38} ry={46} fill={look.headphones} />
            <ellipse cx={424} cy={548} rx={38} ry={46} fill={look.headphones} />
            <ellipse cx={176} cy={548} rx={20} ry={26} fill={look.cap ?? "#ef4444"} />
            <ellipse cx={424} cy={548} rx={20} ry={26} fill={look.cap ?? "#ef4444"} />
          </g>
        ) : null}
      </g>
      <g transform={`translate(0,${bob}) rotate(${tilt},300,480)`}>
        <Hair look={look} id={id} back />
        <ellipse cx={128} cy={318} rx={30} ry={40} fill={`url(#${id}-skin)`} />
        <ellipse cx={472} cy={318} rx={30} ry={40} fill={`url(#${id}-skin)`} />
        <path d={HEAD} fill={`url(#${id}-skin)`} />
        <Hair look={look} id={id} />
        {look.band ? (
          <g>
            <path d="M118,214 Q300,170 482,214 L484,250 Q300,206 116,250 Z" fill={look.band} />
            <path d="M118,232 Q300,188 482,232" fill="none" stroke="#fff" strokeWidth={6} opacity={0.8} />
          </g>
        ) : null}
        <path d="M188,236 Q222,218 258,230" fill="none" stroke={look.hair[2]} strokeWidth={12} strokeLinecap="round" />
        <path d="M412,236 Q378,218 342,230" fill="none" stroke={look.hair[2]} strokeWidth={12} strokeLinecap="round" />
        {[222, 378].map((x) => (
          <g key={x} transform={`translate(${x},292) scale(1,${Math.max(0.06, open)}) translate(${-x},-292)`}>
            <ellipse cx={x} cy={292} rx={50} ry={56} fill={`url(#${id}-sclera)`} />
            <ellipse cx={x + lx} cy={298} rx={34} ry={38} fill={`url(#${id}-iris)`} />
            <ellipse cx={x + lx} cy={300} rx={17} ry={20} fill="#0a1a16" />
            <ellipse cx={x + lx - 12} cy={284} rx={11} ry={13} fill="#fff" />
            <circle cx={x + lx + 12} cy={314} r={5} fill="#fff" opacity={0.8} />
            <path d={`M${x - 52},${282} Q${x},${226} ${x + 52},${282}`} fill="none" stroke="#2a160a" strokeWidth={7} strokeLinecap="round" />
          </g>
        ))}
        <ellipse cx={170} cy={380} rx={38} ry={22} fill="#ff7a8a" opacity={0.35} />
        <ellipse cx={430} cy={380} rx={38} ry={22} fill="#ff7a8a" opacity={0.35} />
        {look.freckles
          ? [
              [160, 360],
              [178, 372],
              [150, 378],
              [440, 360],
              [422, 372],
              [450, 378],
            ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={sd} opacity={0.8} />)
          : null}
        <ellipse cx={300} cy={366} rx={20} ry={14} fill={sd} opacity={0.55} />
        <ellipse cx={294} cy={361} rx={7} ry={4} fill="#fff" opacity={0.6} />
        {talk < 0.08 ? (
          <path d="M262,410 Q300,440 338,410" fill="none" stroke="#7a2a20" strokeWidth={7} strokeLinecap="round" />
        ) : (
          <g>
            <path d={`M258,408 Q300,416 342,408 Q332,${430 + talk * 40} 300,${432 + talk * 40} Q268,${430 + talk * 40} 258,408 Z`} fill="#6a1a22" />
            <path d="M266,410 Q300,418 334,410 L330,420 Q300,426 270,420 Z" fill="#fff" />
            <ellipse cx={300} cy={428 + talk * 34} rx={22} ry={6 + talk * 6} fill="#ff7f8f" />
          </g>
        )}
      </g>
    </g>
  );
};
