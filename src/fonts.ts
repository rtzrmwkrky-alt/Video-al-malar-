/**
 * Yazı tipleri projenin içinde (public/fonts) durur; render sırasında
 * internete gerek kalmaz. Türkçe harfler (ğ, ş, ı, İ) "latin-ext" dosyasında.
 */
import { continueRender, delayRender, staticFile } from "remotion";

const FACES = [
  { family: "Geist", file: "Geist-latin-ext.woff2", style: "normal", weight: "400 800", unicodeRange: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Geist", file: "Geist-latin.woff2", style: "normal", weight: "400 800", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Geist Mono", file: "GeistMono-latin-ext.woff2", style: "normal", weight: "400 500", unicodeRange: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Geist Mono", file: "GeistMono-latin.woff2", style: "normal", weight: "400 500", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Instrument Serif", file: "InstrumentSerif-latin-ext.woff2", style: "italic", weight: "400", unicodeRange: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Instrument Serif", file: "InstrumentSerif-latin.woff2", style: "italic", weight: "400", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  // Belgesel/sinematik: Playfair Display (başlık + altyazı), Dancing Script (el yazısı)
  { family: "Playfair Display", file: "PlayfairDisplay.ttf", style: "normal", weight: "400 900", format: "truetype" },
  { family: "Playfair Display", file: "PlayfairDisplay-Italic.ttf", style: "italic", weight: "400 900", format: "truetype" },
  { family: "Dancing Script", file: "DancingScript.ttf", style: "normal", weight: "400 700", format: "truetype" },
];

export const PLAYFAIR = "'Playfair Display', Georgia, serif";
export const SCRIPT = "'Dancing Script', cursive";
export const SANS = "Geist, Helvetica, Arial, sans-serif";
export const MONO = "'Geist Mono', ui-monospace, monospace";
export const SERIF = "'Instrument Serif', Georgia, serif";

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Yazı tipleri yükleniyor");
  Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("${"format" in f ? f.format : "woff2"}")`, {
        style: f.style,
        weight: f.weight,
        ...("unicodeRange" in f ? { unicodeRange: f.unicodeRange } : {}),
      });
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
