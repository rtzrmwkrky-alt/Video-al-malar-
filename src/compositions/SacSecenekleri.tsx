/** Figür için saç seçenekleri: aynı genç, 4 farklı saç (baş yakın plan, 2x2). */
import { AbsoluteFill } from "remotion";
import { AnimeTeen, type HairStyle } from "../anime/AnimeTeen";
import { SANS, loadFonts } from "../fonts";

loadFonts();

const OPTS: { n: number; hair: HairStyle; name: string }[] = [
  { n: 1, hair: "wavy", name: "Dalgalı" },
  { n: 2, hair: "side", name: "Kısa düz" },
  { n: 3, hair: "quiff", name: "Üstü kabarık" },
  { n: 4, hair: "messy", name: "Dağınık" },
];

export const SacSecenekleri: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "linear-gradient(180deg,#1f7fe0,#a8dcff)" }}>
    {OPTS.map((o, i) => {
      const x = (i % 2) * 540;
      const y = 120 + Math.floor(i / 2) * 880;
      return (
        <div key={o.n} style={{ position: "absolute", left: x + 20, top: y, width: 500, height: 840, borderRadius: 40, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <svg width={500} height={680} viewBox="380 250 320 435" style={{ position: "absolute", left: 0, top: 30 }}>
            <AnimeTeen hair={o.hair} band={false} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 50, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.4)" }}>
            <span style={{ color: "#ffd23f" }}>{o.n}</span> · {o.name}
          </div>
        </div>
      );
    })}
  </AbsoluteFill>
);
