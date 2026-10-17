/**
 * Gazete / mizah dergisi karikatürü tarzı genç (kullanıcı referansı: Türk karikatürü havası; özgün çizim).
 * Beyaz kâğıt, elle çizilmiş gibi titrek mürekkep (kaynayan çizgi), çapraz tarama gölge, soluk düz renkler,
 * büyük burun + iri yuvarlak gözler, el yazısı düşünce balonu.
 */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HAND, loadFonts } from "../fonts";

loadFonts();

export const KARIKATUR_FRAMES = 90;

const INK = "#1d1b26";
const LW = 5;
const C = {
  paper: "#fbfaf5",
  skin: "#f6cfa8",
  hair: "#8a5a3c",
  top: "#de6b5f",
  jean: "#5276ad",
  shoe: "#6b4a35",
  wall: "#c8d6ea",
  metal: "#9aa1ad",
  plate: "#4e525e",
};

/** mürekkep konturlu kalın uzuv: altta koyu geniş çizgi, üstte renkli çizgi */
const Stroke: React.FC<{ d: string; w: number; fill: string; shade?: boolean; dx?: number }> = ({ d, w, fill, shade, dx = 0.28 }) => (
  <g>
    <path d={d} stroke={INK} strokeWidth={w + LW * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} stroke={fill} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {shade ? <path d={d} stroke="url(#hatch)" strokeWidth={w * 0.42} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(${w * dx},0)`} /> : null}
  </g>
);

export const KarikaturGenc: React.FC = () => {
  const f = useCurrentFrame();
  const boil = Math.floor(f / 4) % 3; // elle çizim "kaynayan çizgi" etkisi
  const look = Math.sin(f / 18) * 1.5;
  return (
    <AbsoluteFill lang="tr" style={{ background: C.paper, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="hatch" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={9} stroke={INK} strokeWidth={1.6} opacity={0.75} />
          </pattern>
          <pattern id="cross" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={9} stroke={INK} strokeWidth={1.4} opacity={0.7} />
            <line x1={0} y1={0} x2={9} y2={0} stroke={INK} strokeWidth={1.2} opacity={0.55} />
          </pattern>
          <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency={0.028} numOctaves={2} seed={boil + 2} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g filter="url(#wobble)">
          {/* ---------------- oda köşesi ---------------- */}
          <path d="M820,560 Q880,640 880,1000 L878,1350 L770,1400 Q790,1000 760,760 Z" fill={C.wall} opacity={0.8} />
          <path d="M820,600 Q872,680 872,1000 L870,1340 L780,1385 Q796,1000 770,780 Z" fill="url(#cross)" />
          <path d="M880,420 L878,1350" stroke={INK} strokeWidth={3.5} fill="none" />
          <path d="M878,1350 L150,1352" stroke={INK} strokeWidth={3.5} fill="none" />
          <path d="M878,1350 L1060,1470" stroke={INK} strokeWidth={3.5} fill="none" />
          {/* yer gölgesi */}
          <ellipse cx={650} cy={1488} rx={190} ry={26} fill="url(#hatch)" />

          {/* ---------------- bacaklar (kot) ---------------- */}
          <Stroke d="M612,1100 Q600,1270 588,1420" w={92} fill={C.jean} shade />
          <Stroke d="M698,1100 Q706,1270 714,1420" w={92} fill={C.jean} shade />
          <path d="M650,1110 L652,1200" stroke={INK} strokeWidth={3} />
          {/* ayakkabılar (sola bakan) */}
          {[588, 714].map((x) => (
            <path
              key={x}
              d={`M${x - 34},1418 Q${x - 96},1424 ${x - 102},1458 Q${x - 102},1484 ${x - 56},1484 L${x + 40},1484 Q${x + 52},1446 ${x + 36},1418 Z`}
              fill={C.shoe}
              stroke={INK}
              strokeWidth={LW}
              strokeLinejoin="round"
            />
          ))}
          <path d="M520,1470 L620,1470 M646,1470 L746,1470" stroke="#4a3122" strokeWidth={4} />

          {/* ---------------- gövde (kazak) ---------------- */}
          <path
            d="M566,800 Q610,772 662,774 Q722,776 752,806 L766,1000 Q770,1070 748,1104 L572,1108 Q556,1060 558,996 Z"
            fill={C.top}
            stroke={INK}
            strokeWidth={LW}
            strokeLinejoin="round"
          />
          <path d="M700,800 Q744,812 752,840 L764,1000 Q768,1066 748,1100 L690,1104 Q722,1000 700,800 Z" fill="url(#hatch)" />
          <path d="M610,782 Q640,808 676,780" stroke={INK} strokeWidth={4} fill="none" />
          <path d="M572,1090 L748,1088" stroke={INK} strokeWidth={3} />

          {/* ---------------- kollar + dambıl ---------------- */}
          <Stroke d="M736,816 Q770,900 742,968 Q700,960 664,944" w={62} fill={C.top} shade dx={0.2} />
          {/* dambıl */}
          <rect x={494} y={926} width={220} height={18} rx={8} fill={C.metal} stroke={INK} strokeWidth={4} />
          <rect x={470} y={882} width={36} height={106} rx={10} fill={C.plate} stroke={INK} strokeWidth={LW} />
          <rect x={704} y={882} width={36} height={106} rx={10} fill={C.plate} stroke={INK} strokeWidth={LW} />
          <Stroke d="M580,818 Q536,900 560,964 Q590,966 612,950" w={62} fill={C.top} />
          {/* eller */}
          {[600, 662].map((x) => (
            <g key={x}>
              <path d={`M${x - 26},918 Q${x - 30},956 ${x - 18},964 Q${x + 4},972 ${x + 24},962 Q${x + 32},938 ${x + 22},914 Q${x},904 ${x - 26},918 Z`} fill={C.skin} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              <path d={`M${x - 20},936 L${x + 22},934 M${x - 20},950 L${x + 22},948`} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}

          {/* ---------------- boyun + baş ---------------- */}
          <path d="M612,730 L604,782 Q636,796 668,780 L664,726 Z" fill={C.skin} stroke={INK} strokeWidth={LW} strokeLinejoin="round" />
          <path d="M640,730 L664,728 L666,778 Q652,786 640,786 Z" fill="url(#hatch)" />
          <g transform="translate(0,34)">
          {/* kafa (sola, yukarı bakan 3/4) */}
          <path
            d="M562,516 C580,458 656,444 704,478 C744,508 746,592 726,642 C708,686 670,708 630,712 C606,714 588,708 576,700 C566,692 560,680 562,668 C552,664 548,656 552,650 L548,648 C520,664 486,680 470,676 C456,672 458,656 472,648 C500,630 530,610 548,592 C552,560 552,540 562,516 Z"
            fill={C.skin}
            stroke={INK}
            strokeWidth={LW}
            strokeLinejoin="round"
          />
          {/* yanak / ense gölgesi */}
          <path d="M700,560 C724,590 720,640 704,668 C686,690 660,704 636,708 C668,680 690,630 700,560 Z" fill="url(#hatch)" />
          {/* kulak */}
          <path d="M672,584 Q704,572 708,604 Q708,632 680,634" fill={C.skin} stroke={INK} strokeWidth={4.5} />
          <path d="M682,596 Q694,600 690,618" stroke={INK} strokeWidth={3} fill="none" />
          {/* gözler (yukarı-sola bakan, endişeli) */}
          <circle cx={566} cy={576} r={27} fill="#ffffff" stroke={INK} strokeWidth={4.5} />
          <circle cx={608} cy={570} r={25} fill="#ffffff" stroke={INK} strokeWidth={4.5} />
          <circle cx={556 + look} cy={564} r={7} fill={INK} />
          <circle cx={598 + look} cy={558} r={7} fill={INK} />
          {/* kaşlar: iç uçları kalkık */}
          <path d="M540,540 Q556,532 578,526" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M594,520 Q612,520 630,530" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* burun deliği + ağız */}
          <path d="M520,668 Q528,664 534,668" stroke={INK} strokeWidth={3} fill="none" />
          <path d="M562,698 Q574,692 592,700" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* saç */}
          <path
            d="M560,520 C566,470 640,436 708,470 C750,494 754,566 734,606 C728,574 714,552 694,544 C694,562 684,568 674,560 C670,540 652,528 632,530 C612,520 592,524 580,532 C572,528 566,524 560,520 Z"
            fill={C.hair}
            stroke={INK}
            strokeWidth={LW}
            strokeLinejoin="round"
          />
          <path d="M600,490 Q640,470 680,488 M612,508 Q650,494 690,512" stroke={INK} strokeWidth={2.5} fill="none" />
          <path d="M716,520 Q732,548 730,580" stroke={INK} strokeWidth={2.5} fill="none" />
          </g>

          {/* ---------------- düşünce balonu ---------------- */}
          <ellipse cx={400} cy={300} rx={345} ry={185} fill="#ffffff" stroke={INK} strokeWidth={LW} />
          <circle cx={500} cy={520} r={26} fill="#ffffff" stroke={INK} strokeWidth={LW} />
          <circle cx={540} cy={566} r={13} fill="#ffffff" stroke={INK} strokeWidth={4} />
        </g>

        {/* el yazısı (titreşimsiz, okunaklı) */}
        <g fontFamily={HAND} fontSize={66} fill={INK} textAnchor="middle" letterSpacing={2}>
          <text x={400} y={252}>AĞIRLIK KALDIRIRSAM</text>
          <text x={400} y={330}>BOYUM KISA</text>
          <text x={400} y={408}>MI KALIR?</text>
        </g>
      </svg>

      {/* altyazı örneği: el yazısı */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 1600, textAlign: "center", fontFamily: HAND, fontSize: 80, color: INK, lineHeight: 1.1 }}>
        Herkes bunu söylüyor…
        <br />
        <span style={{ color: "#c2463c" }}>peki doğru mu?</span>
      </div>
    </AbsoluteFill>
  );
};
