import { Bora, BORA_OUTFITS, type BoraOutfit } from "../avatar/BoraYan";

export { BORA_OUTFITS };

/** tanıtım duruşu: parmak kaldırmış, gülümsüyor */
export const BoraYanFigure: React.FC<{ x: number; y: number; s: number; o: BoraOutfit; id: string }> = ({ x, y, s, o, id }) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-220,-850)`}>
    <Bora id={id} o={o} pose={{ el: [312, 370], wr: [322, 250], hand: "point", handRot: 20 }} expr="grin" />
  </g>
);
