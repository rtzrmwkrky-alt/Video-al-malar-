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
    </>
  );
};
