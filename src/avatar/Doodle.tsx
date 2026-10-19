/**
 * Sade el çizimi figür (kullanıcının gösterdiği iki örneğin ortalaması):
 * yuvarlak büyük kafa, nokta gözler, allık, düz renkler, kalın titrek kontur
 * (açık zeminde koyu, koyu kareli zeminde krem). 400x600 yerel kutuda tam boy, yer çizgisi y=560.
 */
import React from "react";
import { blink } from "./Avatars";

export type DoodleHair = "short" | "spiky" | "ponytail" | "curly" | "cap";

export type DoodleLook = {
  skin: string;
  hair: string;
  hairStyle: DoodleHair;
  top: string;
  topS: string; // gölge/çizgi tonu
  longSleeve?: boolean;
  bottom: string;
  longPants?: boolean;
  shoe: string;
  cap?: string;
  lashes?: boolean;
};

const HX = 200;
const HY = 130;
const HR = 72;

/** konturlu uzuv: önce kalın mürekkep, üstüne ince renk */
const Limb: React.FC<{ d: string; ink: string; fill: string; w?: number }> = ({ d, ink, fill, w = 24 }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={ink} strokeWidth={w + 11} />
    <path d={d} stroke={fill} strokeWidth={w} />
  </g>
);

const Hair: React.FC<{ look: DoodleLook; ink: string; back?: boolean }> = ({ look, ink, back }) => {
  const s = { fill: look.hair, stroke: ink, strokeWidth: 5.5, strokeLinejoin: "round" as const };
  const base = (
    <path d={`M${HX - 72},${HY + 8} Q${HX - 74},${HY - 78} ${HX},${HY - 80} Q${HX + 74},${HY - 78} ${HX + 72},${HY + 8} Q${HX + 62},${HY - 30} ${HX + 34},${HY - 40} Q${HX},${HY - 28} ${HX - 38},${HY - 40} Q${HX - 62},${HY - 30} ${HX - 72},${HY + 8} Z`} {...s} />
  );
  switch (look.hairStyle) {
    case "short":
      return back ? null : base;
    case "spiky":
      return back ? null : (
        <g>
          {base}
          <path d={`M${HX - 34},${HY - 76} l-6,-30 l18,16 M${HX - 4},${HY - 80} l0,-32 l16,22 M${HX + 28},${HY - 76} l8,-28 l10,22`} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "ponytail":
      return back ? (
        <path d={`M${HX + 50},${HY - 60} Q${HX + 120},${HY - 70} ${HX + 118},${HY + 10} Q${HX + 116},${HY + 70} ${HX + 86},${HY + 110} Q${HX + 96},${HY + 40} ${HX + 60},${HY - 10} Z`} {...s} />
      ) : (
        <g>
          <path d={`M${HX - 74},${HY + 20} Q${HX - 78},${HY - 80} ${HX},${HY - 82} Q${HX + 76},${HY - 80} ${HX + 74},${HY + 10} Q${HX + 50},${HY - 40} ${HX + 10},${HY - 46} Q${HX - 20},${HY - 20} ${HX - 60},${HY - 24} Q${HX - 70},${HY} ${HX - 74},${HY + 20} Z`} {...s} />
          <circle cx={HX + 58} cy={HY - 58} r={9} fill="#ff6b8a" stroke={ink} strokeWidth={4} />
        </g>
      );
    case "curly": {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (1.02 + (i / 8) * 0.96);
        pts.push([HX + Math.cos(a) * 70, HY - 6 + Math.sin(a) * 72]);
      }
      return back ? null : (
        <g>
          {base}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 22 : 25} {...s} />
          ))}
          <path d={`M${HX - 66},${HY - 6} Q${HX},${HY - 70} ${HX + 66},${HY - 6} L${HX + 50},${HY - 30} Q${HX},${HY - 52} ${HX - 50},${HY - 30} Z`} fill={look.hair} />
        </g>
      );
    }
    case "cap": {
      const c = look.cap ?? "#3b82f6";
      return back ? null : (
        <g>
          {base}
          <path d={`M${HX - 70},${HY - 18} Q${HX - 70},${HY - 86} ${HX},${HY - 88} Q${HX + 70},${HY - 86} ${HX + 70},${HY - 18} Z`} fill={c} stroke={ink} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M${HX - 70},${HY - 18} Q${HX - 120},${HY - 18} ${HX - 126},${HY - 8} Q${HX - 100},${HY + 2} ${HX - 66},${HY - 4} Z`} fill={c} stroke={ink} strokeWidth={5.5} strokeLinejoin="round" />
          <circle cx={HX} cy={HY - 88} r={6} fill={c} stroke={ink} strokeWidth={4} />
        </g>
      );
    }
  }
};

export const Doodle: React.FC<{ t: number; talk?: number; look: DoodleLook; ink: string; seed?: number; filterId?: string }> = ({ t, talk = 0, look, ink, seed = 0, filterId }) => {
  const shut = blink(t, seed) > 0.4;
  const bob = Math.sin(t * 2.2 + seed) * 3;
  const sway = Math.sin(t * 1.4 + seed) * 2;
  const armL = Math.sin(t * 1.8 + seed) * 3;
  const sleeve = look.longSleeve ? look.top : look.skin;
  const legC = look.longPants ? look.bottom : look.skin;
  return (
    <g filter={filterId ? `url(#${filterId})` : undefined}>
      <ellipse cx={200} cy={572} rx={100} ry={12} fill="#000" opacity={0.12} />
      {/* bacaklar + ayakkabılar */}
      <Limb d="M176,400 L174,548" ink={ink} fill={legC} w={look.longPants ? 40 : 30} />
      <Limb d="M224,400 L226,548" ink={ink} fill={legC} w={look.longPants ? 40 : 30} />
      <ellipse cx={168} cy={560} rx={30} ry={14} fill={look.shoe} stroke={ink} strokeWidth={5} />
      <ellipse cx={232} cy={560} rx={30} ry={14} fill={look.shoe} stroke={ink} strokeWidth={5} />
      <g transform={`translate(0,${bob}) rotate(${sway},200,400)`}>
        {/* şort / pantolon üstü */}
        <path d="M146,330 L254,330 L258,410 L206,410 L200,372 L194,410 L142,410 Z" fill={look.bottom} stroke={ink} strokeWidth={5.5} strokeLinejoin="round" />
        {/* kollar */}
        <g transform={`rotate(${armL},140,220)`}>
          <Limb d="M140,222 Q122,280 128,332" ink={ink} fill={sleeve} />
          <circle cx={128} cy={340} r={15} fill={look.skin} stroke={ink} strokeWidth={5} />
        </g>
        <g transform={`rotate(${-armL},260,220)`}>
          <Limb d="M260,222 Q278,280 272,332" ink={ink} fill={sleeve} />
          <circle cx={272} cy={340} r={15} fill={look.skin} stroke={ink} strokeWidth={5} />
        </g>
        {/* gövde */}
        <path d="M150,200 Q200,188 250,200 Q262,270 258,340 Q200,350 142,340 Q138,270 150,200 Z" fill={look.top} stroke={ink} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M156,318 Q200,330 244,318" fill="none" stroke={look.topS} strokeWidth={4} strokeLinecap="round" />
        <path d="M180,198 Q200,214 220,198" fill="none" stroke={look.topS} strokeWidth={5} strokeLinecap="round" />
        {/* omuz kabarıkları */}
        <ellipse cx={146} cy={218} rx={24} ry={28} fill={look.top} stroke={ink} strokeWidth={5.5} />
        <ellipse cx={254} cy={218} rx={24} ry={28} fill={look.top} stroke={ink} strokeWidth={5.5} />
        {/* kafa */}
        <Hair look={look} ink={ink} back />
        <circle cx={HX - 70} cy={HY + 10} r={14} fill={look.skin} stroke={ink} strokeWidth={5} />
        <circle cx={HX + 70} cy={HY + 10} r={14} fill={look.skin} stroke={ink} strokeWidth={5} />
        <circle cx={HX} cy={HY} r={HR} fill={look.skin} stroke={ink} strokeWidth={5.5} />
        <Hair look={look} ink={ink} />
        {/* yüz */}
        <ellipse cx={HX - 42} cy={HY + 30} rx={14} ry={8} fill="#ff6f7d" opacity={0.4} />
        <ellipse cx={HX + 42} cy={HY + 30} rx={14} ry={8} fill="#ff6f7d" opacity={0.4} />
        <path d={`M${HX - 34},${HY - 12} q10,-6 20,0 M${HX + 14},${HY - 12} q10,-6 20,0`} fill="none" stroke="#2a1f1a" strokeWidth={3.5} strokeLinecap="round" />
        {shut ? (
          <path d={`M${HX - 31},${HY + 8} q7,5 14,0 M${HX + 17},${HY + 8} q7,5 14,0`} fill="none" stroke="#2a1f1a" strokeWidth={4} strokeLinecap="round" />
        ) : (
          <g fill="#2a1f1a">
            <ellipse cx={HX - 24} cy={HY + 6} rx={6.5} ry={8} />
            <ellipse cx={HX + 24} cy={HY + 6} rx={6.5} ry={8} />
            <circle cx={HX - 22} cy={HY + 3} r={2.2} fill="#fff" />
            <circle cx={HX + 26} cy={HY + 3} r={2.2} fill="#fff" />
          </g>
        )}
        {look.lashes && !shut ? (
          <path d={`M${HX - 31},${HY - 1} l-7,-4 M${HX + 31},${HY - 1} l7,-4`} stroke="#2a1f1a" strokeWidth={3} strokeLinecap="round" />
        ) : null}
        <path d={`M${HX + 2},${HY + 14} q6,6 -2,10`} fill="none" stroke="#2a1f1a" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {talk < 0.08 ? (
          <path d={`M${HX - 14},${HY + 36} q14,12 28,0`} fill="none" stroke="#2a1f1a" strokeWidth={4} strokeLinecap="round" />
        ) : (
          <g>
            <path d={`M${HX - 15},${HY + 34} Q${HX},${HY + 38} ${HX + 15},${HY + 34} Q${HX + 12},${HY + 44 + talk * 14} ${HX},${HY + 45 + talk * 14} Q${HX - 12},${HY + 44 + talk * 14} ${HX - 15},${HY + 34} Z`} fill="#7a2430" stroke="#2a1f1a" strokeWidth={3.5} strokeLinejoin="round" />
            <ellipse cx={HX} cy={HY + 42 + talk * 10} rx={7} ry={3 + talk * 2} fill="#ff8a96" />
          </g>
        )}
      </g>
    </g>
  );
};

export const DOODLES: { look: DoodleLook; desc: string; bg: "wall" | "grid" | "blue" }[] = [
  {
    desc: "Kısa saç, sarı tişört",
    bg: "wall",
    look: { skin: "#f2c39b", hair: "#4a2e1f", hairStyle: "short", top: "#f5c33b", topS: "#c99a1c", bottom: "#2f3e66", shoe: "#2a2a2a" },
  },
  {
    desc: "At kuyruğu, mercan tişört",
    bg: "wall",
    look: { skin: "#f6cfae", hair: "#6b3f22", hairStyle: "ponytail", top: "#ff7a6b", topS: "#d9564a", bottom: "#3a3f6b", longPants: true, shoe: "#ffffff", lashes: true },
  },
  {
    desc: "Dikenli saç, mor kapüşonlu",
    bg: "grid",
    look: { skin: "#f0bf96", hair: "#3b2a4a", hairStyle: "spiky", top: "#a78bfa", topS: "#7c5fd6", longSleeve: true, bottom: "#5b6b8a", longPants: true, shoe: "#2a2a2a" },
  },
  {
    desc: "Ters şapka, yeşil tişört",
    bg: "blue",
    look: { skin: "#e8b48a", hair: "#2a1d16", hairStyle: "cap", cap: "#3b82f6", top: "#34c48a", topS: "#1f9a68", bottom: "#2a2a2a", shoe: "#ffffff" },
  },
  {
    desc: "Kıvırcık saç, turuncu eşofman",
    bg: "grid",
    look: { skin: "#d9a07a", hair: "#2a1a12", hairStyle: "curly", top: "#ff9a3c", topS: "#d97316", longSleeve: true, bottom: "#4b5563", longPants: true, shoe: "#ffffff", lashes: true },
  },
];
