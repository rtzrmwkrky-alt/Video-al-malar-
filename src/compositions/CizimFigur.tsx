/** Kurşun kalem/kuru boya figür önizlemesi: salonda kanepede üç figür + ayakta bir kız. Sessiz. */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { talkAt } from "../avatar/Avatars";
import { SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import { SketchRoom, SofaFront } from "../sketch/SketchRoom";

export const CIZIM_FIGUR_FRAMES = 30 * 8;

export const CizimFigur: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const who = Math.floor(t / 2) % 4;
  const talk = (i: number) => (who === i ? talkAt(t, 0) : 0);
  return (
    <AbsoluteFill lang="tr" style={{ background: "#f4dcc6" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <SketchDefs />
        <g filter="url(#pencil)">
          <SketchRoom t={t} />
          <SofaFront />
          {/* kanepede oturanlar (kalça y=480 → koltuk ~1250) */}
          <g transform="translate(110,880) scale(0.85)">
            <SketchPerson t={t} seed={0} look={SKETCH_CAST.sari.look} pose={{ sit: true, turn: 0.4, l: { a: 24, e: -4 }, r: { a: 10, e: -40 } }} expr="smile" talk={talk(0)} />
          </g>
          <g transform="translate(360,870) scale(0.85)">
            <SketchPerson t={t} seed={1.3} look={SKETCH_CAST.siyah.look} pose={{ sit: true, turn: 0.2, l: { a: 18, e: 0 }, r: { a: 20, e: -95 }, itemR: "tea" }} expr="grin" talk={talk(1)} />
          </g>
          <g transform="translate(600,890) scale(0.85)">
            <SketchPerson t={t} seed={2.1} look={SKETCH_CAST.dede.look} pose={{ sit: true, turn: -0.3, legSide: 1, l: { a: 10, e: 10 }, r: { a: 20, e: -10 } }} expr="think" talk={talk(2)} />
          </g>
          {/* ayakta kız */}
          <g transform="translate(20,1150) scale(0.85)">
            <SketchPerson t={t} seed={0.6} look={SKETCH_CAST.kiz.look} pose={{ turn: 0.4, l: { a: 14, e: 4 }, r: { a: 30, e: -110, }, itemR: "phone" }} expr="surprise" talk={talk(3)} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
