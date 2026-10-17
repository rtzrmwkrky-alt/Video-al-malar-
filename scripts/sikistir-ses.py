"""
Seslendirmeyi yeniden üretmeden (kredi harcamadan) kısaltır:
uzun sessizlikleri `--max-pause` saniyeye indirir, sonra sesi perdesini bozmadan `--tempo` kat hızlandırır.
Kelime zamanlarını (JSON) aynı dönüşümle yeniden yazar.

  python3 scripts/sikistir-ses.py gece-yemek gece-yemek-kisa --max-pause 0.28 --tempo 1.04
  → public/audio/gece-yemek-kisa.mp3 / .json
"""
import argparse
import json
import re
import subprocess
import wave

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--max-pause", type=float, default=0.28)
ap.add_argument("--tempo", type=float, default=1.0)
ap.add_argument("--db", type=float, default=-35)
a = ap.parse_args()

src = f"public/audio/{a.src}.mp3"
SR = 44100

# sessizlikleri bul
log = subprocess.run(
    ["ffmpeg", "-i", src, "-af", f"silencedetect=n={a.db}dB:d=0.18", "-f", "null", "-"],
    capture_output=True,
    text=True,
).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]

# kesilecek aralıklar: sessizliğin ortasından (max-pause'u aşan kısım)
cuts = []
for s, e in zip(starts, ends):
    d = e - s
    if d > a.max_pause and s > 0.05:
        cut = d - a.max_pause
        m = s + a.max_pause / 2
        cuts.append((m, m + cut))

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.int16)
keep = np.ones(len(x), dtype=bool)
for s, e in cuts:
    keep[int(s * SR) : int(e * SR)] = False
y = x[keep]

tmp = f"public/audio/{a.dst}.tmp.wav"
with wave.open(tmp, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(y.tobytes())
subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", f"atempo={a.tempo}", "-ar", "44100", "-b:a", "128k", f"public/audio/{a.dst}.mp3"],
    check=True,
)
subprocess.run(["rm", tmp])


def remap(t: float) -> float:
    removed = 0.0
    for s, e in cuts:
        if t >= e:
            removed += e - s
        elif t > s:
            removed += t - s
    return (t - removed) / a.tempo


data = json.load(open(f"public/audio/{a.src}.json"))
for w in data["words"]:
    w["start"] = round(remap(w["start"]), 3)
    w["end"] = round(remap(w["end"]), 3)
data["durationInSeconds"] = data["words"][-1]["end"]
json.dump(data, open(f"public/audio/{a.dst}.json", "w"), ensure_ascii=False, indent=2)
print(f"{len(cuts)} sessizlik kısaltıldı, yeni süre {data['durationInSeconds']:.1f} sn")
