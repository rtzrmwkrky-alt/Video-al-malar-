/** BoyUzama karakterlerinin anime tarzı görünümleri (ana genç varsayılan görünümdür). */
import type { AnimeLook } from "./AnimeTeen";

/** anne: topuz saç, mor tişört, uzun pantolon */
export const MOM: AnimeLook = {
  hair: "bun",
  band: false,
  top: "tee",
  bottom: "pants",
  number: null,
  lashes: true,
  wrist: false,
  wide: 0.94,
  c: { hair: "#2b1d16", hairS: "#1a110c", hairH: "#5a3e30", top: "#9b5fd0", topS: "#7340a3", shorts: "#3b3550", shortsS: "#28233a", shoe: "#f4f0ea", sole: "#9b5fd0" },
};

/** koç: şapka, yeşil tişört, eşofman altı */
export const COACH: AnimeLook = {
  hair: "cap",
  band: false,
  top: "tee",
  bottom: "pants",
  number: null,
  wrist: false,
  wide: 1.04,
  c: { hair: "#5a3b26", hairS: "#3e281a", band: "#1f8a5c", bandS: "#16684a", top: "#2fb37a", topS: "#1f8a5c", shorts: "#25344f", shortsS: "#18233a", skin: "#f0c39c", skinS: "#d79e78", sole: "#2fb37a" },
};

/** halterci: kısa ve geniş, kırmızı atlet */
export const LIFTER: AnimeLook = {
  hair: "short",
  band: false,
  number: null,
  wrist: false,
  wide: 1.2,
  c: { hair: "#1e1714", hairS: "#120d0b", hairH: "#4a3a32", top: "#e8423a", topS: "#b52a24", shorts: "#2b2b38", shortsS: "#1b1b26", skin: "#e8b48c", skinS: "#c98e68", sole: "#e8423a" },
};

/** basketbolcu: uzun ve ince, turuncu-mor forma "23" */
export const BALLER: AnimeLook = {
  hair: "short",
  band: true,
  number: "23",
  wide: 0.9,
  c: { hair: "#151010", hairS: "#0a0707", hairH: "#3a2c2c", band: "#7a3cff", bandS: "#5a26c9", top: "#7a3cff", topS: "#5a26c9", shorts: "#7a3cff", shortsS: "#5a26c9", skin: "#9a6646", skinS: "#7a4c32", iris: "#3a2414", irisL: "#6a4428", wrist: "#ffb02e", sole: "#ffb02e" },
};
