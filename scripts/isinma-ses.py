"""
IsinmaKas seslendirme özetini yazar: src/compositions/isinma-ses.json
(her satır: dosya, baştaki sessizlik, konuşmanın bittiği an, okunan metin, kelime başlangıçları).

Kullanım:  python3 scripts/isinma-ses.py
Okur:      icerik/isinma.seslendirme.txt, public/audio/isinma-NN.mp3/.json
Sürüm (`VERSION`) kompozisyondaki VOICE_VERSION ile aynı olmalı; değilse video sesleri eski sayar.
"""
import json
import os
import re
import subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = "v2-yumusak"
AUDIO = os.path.join(ROOT, "public", "audio")

lines = {}
for row in open(os.path.join(ROOT, "icerik", "isinma.seslendirme.txt"), encoding="utf8"):
    if row.startswith("#") or not row.strip():
        continue
    n, _who, text = row.rstrip("\n").split("|", 2)
    mp3 = os.path.join(AUDIO, f"isinma-{n}.mp3")
    log = subprocess.run(
        ["ffmpeg", "-i", mp3, "-af", "silencedetect=n=-40dB:d=0.08", "-f", "null", "-"], capture_output=True, text=True
    ).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", log).groups()
    dur = float(s)
    starts = [float(v) for v in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", log)]
    speech_end = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= dur - 0.1) else dur
    lead = ends[0] if starts and starts[0] < 0.01 else 0.0
    words = [w["start"] for w in json.load(open(os.path.join(AUDIO, f"isinma-{n}.json"), encoding="utf8"))["words"]]
    # ağız hareketi için ses zarfı: video karesi başına (30 fps) 0-1 seviye
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-ac", "1", "-ar", "24000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float64) / 32768
    hop = 24000 // 30
    rms = np.array([np.sqrt(np.mean(x[i : i + hop] ** 2)) for i in range(0, len(x), hop)])
    env = np.clip((20 * np.log10(rms + 1e-6) + 45) / 30, 0, 1)
    lines[str(int(n))] = {
        "env": [round(float(v), 2) for v in env],
        "file": f"isinma-{n}.mp3",
        "lead": round(lead, 3),
        "speech": round(speech_end, 3),
        "text": text,
        "words": [round(max(lead, w), 3) for w in words],
    }
out = os.path.join(ROOT, "src", "compositions", "isinma-ses.json")
json.dump({"version": VERSION, "lines": lines}, open(out, "w", encoding="utf8"), ensure_ascii=False, indent=1)
for k, v in lines.items():
    print(k, v["lead"], v["speech"], v["text"], len(v["env"]))
