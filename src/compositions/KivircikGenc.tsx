/** Kıvırcık saçlı gözlüklü genç karakter önizlemesi (bej zemin, sessiz). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { blink } from "../avatar/Avatars";
import { CurlyGuy } from "../avatar/CurlyGuy";

export const KIVIRCIK_FRAMES = 30 * 5;

export const KivircikGenc: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #dcd2c5, #c4b6a4)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(160,170) scale(1.9)">
          <CurlyGuy id="cg" t={t} blink={blink(t)} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
