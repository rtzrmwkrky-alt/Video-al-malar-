import { Composition, staticFile } from "remotion";
import {
  VoiceoverVideo,
  type VoiceoverVideoProps,
} from "./compositions/VoiceoverVideo";
import { VoomKisa, VoomTanitim, type VoomTanitimProps } from "./compositions/VoomTanitim";
import {
  HerkesBaskaDiyor,
  type HerkesBaskaDiyorProps,
} from "./compositions/HerkesBaskaDiyor";
import {
  HerkesBaskaDiyorGercek,
  type HerkesBaskaDiyorGercekProps,
} from "./compositions/HerkesBaskaDiyorGercek";
import { HerKafadan15, type HerKafadan15Props } from "./compositions/HerKafadan15";
import { HerKafadanAkici, type HerKafadanAkiciProps } from "./compositions/HerKafadanAkici";
import {
  HerKafadanAnimasyon,
  type HerKafadanAnimasyonProps,
} from "./compositions/HerKafadanAnimasyon";
import type { VoiceoverData } from "./types";
import { PAZ_TL, OrnekPazartesi } from "./compositions/OrnekPazartesi";
import { TAS_TL, OrnekTasUstasi } from "./compositions/OrnekTasUstasi";
import { DY_TL, OrnekDogruYanlis } from "./compositions/OrnekDogruYanlis";
import { KarakterSecim } from "./compositions/KarakterSecim";
import { KizDeneme } from "./compositions/KizDeneme";
import { KizBeyaz } from "./compositions/KizBeyaz";
import { KAS2_TL, KasAgrisiKiz } from "./compositions/KasAgrisiKiz";
import { KasAgrisiToon, TOON_TL, VOICE_TAIL, type KasAgrisiToonProps } from "./compositions/KasAgrisiToon";
import { KAS_TL, OrnekKasAgrisi } from "./compositions/OrnekKasAgrisi";
import { ISINMA_TL, IsinmaKas, type IsinmaProps } from "./compositions/IsinmaKas";
import { WILMA_TAIL, WilmaRudolph, type WilmaProps } from "./compositions/WilmaRudolph";
import { Karakterler } from "./compositions/Karakterler";
import { FigurPozlar } from "./compositions/FigurPozlar";
import { SacSecenekleri } from "./compositions/SacSecenekleri";
import { KARIKATUR_FRAMES, KarikaturGenc } from "./compositions/KarikaturGenc";
import { ANIME_FRAMES, AnimeKarakter } from "./compositions/AnimeKarakter";
import { AVATAR_FRAMES, AvatarSecim } from "./compositions/AvatarSecim";
import { EFE_VAR_FRAMES, EfeVaryant } from "./compositions/EfeVaryant";
import { FIGUR_FRAMES, FigurSecim } from "./compositions/FigurSecim";
import { FIGUR_UC_FRAMES, FigurUc } from "./compositions/FigurUc";
import { ORGU_FRAMES, OrguKiyafet } from "./compositions/OrguKiyafet";
import { BORA_FRAMES, BoraTanitim } from "./compositions/BoraTanitim";
import { KIVIRCIK_FRAMES, KivircikGenc } from "./compositions/KivircikGenc";
import { SILUET_FRAMES, SiluetRontgen } from "./compositions/SiluetRontgen";
import { STIL_FRAMES, StilOrnekleri } from "./compositions/StilOrnekleri";
import { BOY_TAIL, BOY_TL, BoyUzama, type BoyUzamaProps } from "./compositions/BoyUzama";
import { BoraPozlar } from "./compositions/BoraPozlar";
import { KivircikPozlar } from "./compositions/KivircikPozlar";
import { Bora3DDeneme } from "./compositions/Bora3DDeneme";
import { BoraKiyafet } from "./compositions/BoraKiyafet";
import { GECE_TAIL, GECE_TL, GeceYemek, type GeceYemekProps } from "./compositions/GeceYemek";
import { GK_TAIL, GK_TL, GeceKilo, type GeceKiloProps } from "./compositions/GeceKilo";
import { GY_TAIL, GY_TL, GobekYagi, type GobekYagiProps } from "./compositions/GobekYagi";
import { BS_TAIL, BS_TL, BeslenmeSpor, type BeslenmeSporProps } from "./compositions/BeslenmeSpor";
import { B3_TAIL, B3_TL, BeslenmeSpor3, type BeslenmeSpor3Props } from "./compositions/BeslenmeSpor3";
import { B4_TAIL, B4_TL, BeslenmeSpor4, type BeslenmeSpor4Props } from "./compositions/BeslenmeSpor4";
import { B5_TAIL, B5_TL, BeslenmeSpor5, type BeslenmeSpor5Props } from "./compositions/BeslenmeSpor5";
import { TG_TAIL, TG_TL, BeslenmeTekGun, type BeslenmeTekGunProps } from "./compositions/BeslenmeTekGun";
import { KN_TAIL, KN_TL, KasNedenBuyumuyor, type KasNedenBuyumuyorProps } from "./compositions/KasNedenBuyumuyor";
import { TD_TAIL, TD_TL, TabaginiDegistir, type TabaginiDegistirProps } from "./compositions/TabaginiDegistir";
import { ZAYIF_TAIL, ZAYIF_TL, Zayiflar, type ZayiflarProps } from "./compositions/Zayiflar";

const FPS = 30;

/** Ses JSON'ını okuyup video süresini seslendirmeye göre ayarlar. */
const withVoiceover = async <P extends { audioName: string; data: VoiceoverData | null }>({
  props,
}: {
  props: P;
}) => withVoiceoverTail(0.8, props);

/** Seslendirme bittikten sonra `tail` saniye daha (ör. kapanış kartı için). */
const withVoiceoverTail = async <P extends { audioName: string; data: VoiceoverData | null }>(
  tail: number,
  props: P,
) => {
  const res = await fetch(staticFile(`audio/${props.audioName}.json`));
  if (!res.ok) {
    return { props: { ...props, data: null } };
  }
  const data = (await res.json()) as VoiceoverData;
  return {
    durationInFrames: Math.ceil((data.durationInSeconds + tail) * FPS),
    props: { ...props, data },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="VoiceoverVideo"
      component={VoiceoverVideo}
      // Dikey format: Reels / TikTok / Shorts
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 10}
      defaultProps={
        {
          audioName: "ornek",
          title: "Video Çalışmaları",
          data: null,
        } satisfies VoiceoverVideoProps
      }
      // Ses dosyası varsa süreyi ve altyazıyı ElevenLabs çıktısından al.
      calculateMetadata={async ({ props }) => {
        const res = await fetch(staticFile(`audio/${props.audioName}.json`));
        if (!res.ok) {
          return { props: { ...props, data: null } };
        }
        const data = (await res.json()) as VoiceoverData;
        return {
          durationInFrames: Math.ceil((data.durationInSeconds + 0.5) * FPS),
          props: { ...props, data },
        };
      }}
    />
    <Composition
      id="VoomTanitim"
      component={VoomTanitim}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 45}
      defaultProps={{ audioName: "voom-tanitim", data: null } satisfies VoomTanitimProps}
      calculateMetadata={withVoiceover}
    />
    <Composition
      id="VoomKisa"
      component={VoomKisa}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 15}
      defaultProps={{ audioName: "voom-kisa", data: null } satisfies VoomTanitimProps}
      calculateMetadata={withVoiceover}
    />
    <Composition
      id="HerkesBaskaDiyor"
      component={HerkesBaskaDiyor}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 50}
      defaultProps={{ audioName: "herkes-baska-diyor", data: null } satisfies HerkesBaskaDiyorProps}
      calculateMetadata={withVoiceover}
    />
    <Composition
      id="HerkesBaskaDiyorGercek"
      component={HerkesBaskaDiyorGercek}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 50}
      defaultProps={{ audioName: "herkes-baska-diyor", data: null } satisfies HerkesBaskaDiyorGercekProps}
      calculateMetadata={withVoiceover}
    />
    <Composition
      id="HerKafadan15"
      component={HerKafadan15}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 16}
      defaultProps={{ audioName: "her-kafadan-15sn", data: null } satisfies HerKafadan15Props}
      calculateMetadata={({ props }) => withVoiceoverTail(2.0, props)}
    />
    <Composition
      id="HerKafadanAkici"
      component={HerKafadanAkici}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 26}
      defaultProps={{ audioName: "her-kafadan-akici", data: null } satisfies HerKafadanAkiciProps}
      calculateMetadata={({ props }) => withVoiceoverTail(2.6, props)}
    />
    <Composition
      id="HerKafadanAkiciDuygulu"
      component={HerKafadanAkici}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 26}
      defaultProps={{ audioName: "her-kafadan-duygulu", data: null } satisfies HerKafadanAkiciProps}
      calculateMetadata={({ props }) => withVoiceoverTail(2.6, props)}
    />
    <Composition
      id="HerKafadanAnimasyon"
      component={HerKafadanAnimasyon}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 27}
      defaultProps={{ audioName: "her-kafadan-akici", data: null } satisfies HerKafadanAnimasyonProps}
      calculateMetadata={({ props }) => withVoiceoverTail(2.6, props)}
    />
        <Composition
      id="KasAgrisiToon"
      component={KasAgrisiToon}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TOON_TL.frames}
      defaultProps={{ audioName: "kas-agrisi", data: null } satisfies KasAgrisiToonProps}
      calculateMetadata={({ props }) => withVoiceoverTail(VOICE_TAIL, props)}
    />
    <Composition
      id="IsinmaKas"
      component={IsinmaKas}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={ISINMA_TL.frames}
      defaultProps={{ music: null } satisfies IsinmaProps}
    />
    <Composition
      id="WilmaRudolph"
      component={WilmaRudolph}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      defaultProps={{ audioName: "wilma", data: null } satisfies WilmaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(WILMA_TAIL, props)}
    />
    <Composition
      id="BoyUzama"
      component={BoyUzama}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BOY_TL.frames}
      defaultProps={{ audioName: "boy-uzama-v2", data: null, look: "turkuaz" } satisfies BoyUzamaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BOY_TAIL, props)}
    />
    <Composition
      id="BoyUzamaTebesir"
      component={BoyUzama}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BOY_TL.frames}
      defaultProps={{ audioName: "boy-uzama", data: null, look: "tebesir" } satisfies BoyUzamaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BOY_TAIL, props)}
    />
    <Composition
      id="BoyUzamaNeon"
      component={BoyUzama}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BOY_TL.frames}
      defaultProps={{ audioName: "boy-uzama", data: null, look: "neon" } satisfies BoyUzamaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BOY_TAIL, props)}
    />
    <Composition
      id="BoyUzamaPastel"
      component={BoyUzama}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BOY_TL.frames}
      defaultProps={{ audioName: "boy-uzama", data: null, look: "pastel" } satisfies BoyUzamaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BOY_TAIL, props)}
    />
    <Composition
      id="BoyUzamaComic"
      component={BoyUzama}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BOY_TL.frames}
      defaultProps={{ audioName: "boy-uzama", data: null, look: "comic" } satisfies BoyUzamaProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BOY_TAIL, props)}
    />
    <Composition
      id="GeceYemek"
      component={GeceYemek}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={GECE_TL.frames}
      defaultProps={{ audioName: "gece-yemek-v2", data: null } satisfies GeceYemekProps}
      calculateMetadata={({ props }) => withVoiceoverTail(GECE_TAIL, props)}
    />
    <Composition
      id="GeceYemekBora"
      component={GeceYemek}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={GECE_TL.frames}
      defaultProps={{ audioName: "gece-yemek-v2", data: null, hero: "kivircik", bg: ["#ddd3c6", "#c4b6a4"] } satisfies GeceYemekProps}
      calculateMetadata={({ props }) => withVoiceoverTail(GECE_TAIL, props)}
    />
    <Composition
      id="GeceKilo"
      component={GeceKilo}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={GK_TL.frames}
      defaultProps={{ audioName: "gece-kilo", data: null } satisfies GeceKiloProps}
      calculateMetadata={({ props }) => withVoiceoverTail(GK_TAIL, props)}
    />
    <Composition
      id="Zayiflar"
      component={Zayiflar}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={ZAYIF_TL.frames}
      defaultProps={{ audioName: "zayiflar", data: null } satisfies ZayiflarProps}
      calculateMetadata={({ props }) => withVoiceoverTail(ZAYIF_TAIL, props)}
    />
    <Composition
      id="GobekYagi"
      component={GobekYagi}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={GY_TL.frames}
      defaultProps={{ audioName: "gobek-yagi-v2-kisa", data: null } satisfies GobekYagiProps}
      calculateMetadata={({ props }) => withVoiceoverTail(GY_TAIL, props)}
    />
    <Composition
      id="BeslenmeSpor"
      component={BeslenmeSpor}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={BS_TL.frames}
      defaultProps={{ audioName: "beslenme-spor-35", data: null } satisfies BeslenmeSporProps}
      calculateMetadata={({ props }) => withVoiceoverTail(BS_TAIL, props)}
    />
    <Composition
      id="BeslenmeSpor3"
      component={BeslenmeSpor3}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={B3_TL.frames}
      defaultProps={{ audioName: "beslenme-spor-v3", data: null } satisfies BeslenmeSpor3Props}
      calculateMetadata={({ props }) => withVoiceoverTail(B3_TAIL, props)}
    />
    <Composition
      id="BeslenmeSpor4"
      component={BeslenmeSpor4}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={B4_TL.frames}
      defaultProps={{ audioName: "beslenme-spor-v4", data: null } satisfies BeslenmeSpor4Props}
      calculateMetadata={({ props }) => withVoiceoverTail(B4_TAIL, props)}
    />
    <Composition
      id="BeslenmeSpor5"
      component={BeslenmeSpor5}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={B5_TL.frames}
      defaultProps={{ audioName: "beslenme-spor-v5b-kisa", data: null } satisfies BeslenmeSpor5Props}
      calculateMetadata={({ props }) => withVoiceoverTail(B5_TAIL, props)}
    />
    <Composition
      id="BeslenmeTekGun"
      component={BeslenmeTekGun}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TG_TL.frames}
      defaultProps={{ audioName: "tek-gun", data: null } satisfies BeslenmeTekGunProps}
      calculateMetadata={({ props }) => withVoiceoverTail(TG_TAIL, props)}
    />
    <Composition
      id="KasNedenBuyumuyor"
      component={KasNedenBuyumuyor}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={KN_TL.frames}
      defaultProps={{ audioName: "kas-neden", data: null } satisfies KasNedenBuyumuyorProps}
      calculateMetadata={({ props }) => withVoiceoverTail(KN_TAIL, props)}
    />
    <Composition
      id="TabaginiDegistir"
      component={TabaginiDegistir}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TD_TL.frames}
      defaultProps={{ audioName: "tabagini-degistir-guclu", data: null } satisfies TabaginiDegistirProps}
      calculateMetadata={({ props }) => withVoiceoverTail(TD_TAIL, props)}
    />
    <Composition id="BoraKiyafet" component={BoraKiyafet} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="Bora3DDeneme" component={Bora3DDeneme} width={1080} height={1920} fps={FPS} durationInFrames={60} />
    <Composition id="KivircikPozlar" component={KivircikPozlar} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="BoraPozlar" component={BoraPozlar} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="Karakterler" component={Karakterler} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="FigurPozlar" component={FigurPozlar} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="SacSecenekleri" component={SacSecenekleri} width={1080} height={1920} fps={FPS} durationInFrames={30} />
    <Composition id="KarikaturGenc" component={KarikaturGenc} width={1080} height={1920} fps={FPS} durationInFrames={KARIKATUR_FRAMES} />
    <Composition id="AvatarSecim" component={AvatarSecim} width={1080} height={1920} fps={FPS} durationInFrames={AVATAR_FRAMES} />
    <Composition id="EfeVaryant" component={EfeVaryant} width={1080} height={1920} fps={FPS} durationInFrames={EFE_VAR_FRAMES} />
    <Composition id="FigurSecim" component={FigurSecim} width={1080} height={1920} fps={FPS} durationInFrames={FIGUR_FRAMES} />
    <Composition id="FigurUc" component={FigurUc} width={1080} height={1920} fps={FPS} durationInFrames={FIGUR_UC_FRAMES} />
    <Composition id="OrguKiyafet" component={OrguKiyafet} width={1080} height={1920} fps={FPS} durationInFrames={ORGU_FRAMES} />
    <Composition id="BoraTanitim" component={BoraTanitim} width={1080} height={1920} fps={FPS} durationInFrames={BORA_FRAMES} />
    <Composition id="KivircikGenc" component={KivircikGenc} width={1080} height={1920} fps={30} durationInFrames={KIVIRCIK_FRAMES} />
    <Composition id="AnimeKarakter" component={AnimeKarakter} width={1080} height={1920} fps={FPS} durationInFrames={ANIME_FRAMES} />
    <Composition id="SiluetRontgen" component={SiluetRontgen} width={1080} height={1920} fps={FPS} durationInFrames={SILUET_FRAMES} />
    <Composition id="StilOrnekleri" component={StilOrnekleri} width={1080} height={1920} fps={FPS} durationInFrames={STIL_FRAMES} />
    <Composition id="KasAgrisiKiz" component={KasAgrisiKiz} width={1080} height={1920} fps={FPS} durationInFrames={KAS2_TL.frames} />
    <Composition id="KizBeyaz" component={KizBeyaz} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 9} />
    <Composition id="KizDeneme" component={KizDeneme} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 8} />
    <Composition id="KarakterSecim" component={KarakterSecim} width={1080} height={1920} fps={FPS} durationInFrames={FPS * 13} />
    {/* Sessiz örnekler (seslendirme yok) */}
    <Composition id="Ornek1KasAgrisi" component={OrnekKasAgrisi} width={1080} height={1920} fps={FPS} durationInFrames={KAS_TL.frames} />
    <Composition id="Ornek2Pazartesi" component={OrnekPazartesi} width={1080} height={1920} fps={FPS} durationInFrames={PAZ_TL.frames} />
    <Composition id="Ornek3TasUstasi" component={OrnekTasUstasi} width={1080} height={1920} fps={FPS} durationInFrames={TAS_TL.frames} />
    <Composition id="Ornek4DogruYanlis" component={OrnekDogruYanlis} width={1080} height={1920} fps={FPS} durationInFrames={DY_TL.frames} />
    </>
  );
};
