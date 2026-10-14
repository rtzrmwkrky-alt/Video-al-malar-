import { Composition, staticFile } from "remotion";
import {
  VoiceoverVideo,
  type VoiceoverVideoProps,
} from "./compositions/VoiceoverVideo";
import type { VoiceoverData } from "./types";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
