"""BoyUzama kısa sürüm: mevcut seslendirmeden seçili satırları keser, birleştirir ve hızlandırır (yeni kredi yok).
Çıktı: public/audio/boy-uzama-kisa.mp3 + .json (kelime zamanları yeni sese göre)."""
import json, subprocess, sys

SRC = "public/audio/boy-uzama"
OUT = "public/audio/boy-uzama-kisa"
TEMPO = 1.15
PAD_IN, PAD_OUT = 0.05, 0.14
# (orijinal satır no, satırın başından atlanacak kelime sayısı)
KEEP = [(0, 0), (1, 5), (2, 0), (3, 0), (4, 0), (5, 0), (9, 0), (10, 0), (12, 0)]

data = json.load(open(SRC + ".json"))
words = data["words"]
lines = open("icerik/boy-uzama.txt", encoding="utf-8").read().strip().split("\n")
offs, k = [], 0
for l in lines:
    offs.append(k)
    k += len(l.split())
assert k == len(words), (k, len(words))

segs, new_words, t_new, new_lines = [], [], 0.0, []
for li, skip in KEEP:
    n = len(lines[li].split())
    ws = words[offs[li] + skip : offs[li] + n]
    a = max(0.0, ws[0]["start"] - PAD_IN)
    b = ws[-1]["end"] + PAD_OUT
    for w in ws:
        new_words.append({"text": w["text"], "start": (t_new + w["start"] - a) / TEMPO, "end": (t_new + w["end"] - a) / TEMPO})
    segs.append((a, b))
    t_new += b - a
    new_lines.append(" ".join(lines[li].split()[skip:]))

parts = "".join(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[s{i}];" for i, (a, b) in enumerate(segs))
cat = "".join(f"[s{i}]" for i in range(len(segs)))
flt = parts + f"{cat}concat=n={len(segs)}:v=0:a=1,atempo={TEMPO}[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC + ".mp3", "-filter_complex", flt, "-map", "[o]", "-b:a", "128k", OUT + ".mp3"], check=True)
dur = t_new / TEMPO
json.dump({**{k: v for k, v in data.items() if k not in ("words", "durationInSeconds")}, "words": new_words, "durationInSeconds": dur}, open(OUT + ".json", "w"), ensure_ascii=False, indent=1)
open("icerik/boy-uzama-kisa.txt", "w", encoding="utf-8").write("\n".join(new_lines) + "\n")
print(f"{dur:.1f} sn, {len(new_words)} kelime")
