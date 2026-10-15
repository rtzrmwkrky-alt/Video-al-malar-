import { Composition, staticFile } from "remotion";
import {
  VoiceoverVideo,
  type VoiceoverVideoProps,
} from "./compositions/VoiceoverVideo";
import { VoomTanitim, type VoomTanitimProps } from "./compositions/VoomTanitim";
import {
  HerkesBaskaDiyor,
  type HerkesBaskaDiyorProps,
} from "./compositions/HerkesBaskaDiyor";
import type { VoiceoverData } from "./types";

const FPS = 30;

/** Ses JSON'ını okuyup video süresini seslendirmeye göre ayarlar. */
const withVoiceover = async <P extends { audioName: string; data: VoiceoverData | null }>({
  props,
}: {
  props: P;
}) => {
  const res = await fetch(staticFile(`audio/${props.audioName}.json`));
  if (!res.ok) {
    return { props: { ...props, data: null } };
  }
  const data = (await res.json()) as VoiceoverData;
  return {
    durationInFrames: Math.ceil((data.durationInSeconds + 0.8) * FPS),
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
      id="HerkesBaskaDiyor"
      component={HerkesBaskaDiyor}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 50}
      defaultProps={{ audioName: "herkes-baska-diyor", data: null } satisfies HerkesBaskaDiyorProps}
      calculateMetadata={withVoiceover}
    />
    </>
  );
};
