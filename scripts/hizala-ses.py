"""Sessizliklere dayalı kelime hizalama (kredisiz, Scribe gerekmez). Kullanım: python3 scripts/hizala-ses.py <ad> icerik/<ad>.seslendirme.txt → public/audio/<ad>.json"""
import json, re, subprocess, sys
name, txtf = sys.argv[1], sys.argv[2]
src = f"public/audio/{name}.mp3"
text = open(txtf).read().strip()
log = subprocess.run(["ffmpeg", "-i", src, "-af", "silencedetect=n=-38dB:d=0.10", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
dur = float(re.findall(r"Duration: (\d+):(\d+):([0-9.]+)", log)[0][2]) + 60 * float(re.findall(r"Duration: (\d+):(\d+):([0-9.]+)", log)[0][1])
segs = []
cur = 0.0
for s, e in zip(st, en):
    if s > cur + 0.02:
        segs.append((cur, s))
    cur = e
if dur > cur + 0.05:
    segs.append((cur, dur))
words = text.split()
V = set("aeıioöuüAEIİOÖUÜ")
syl = [max(1, sum(c in V for c in w)) for w in words]
punct = [bool(re.search(r"[.,!?…:]$", w)) for w in words]
tot_sp = sum(b - a for a, b in segs)
rate = tot_sp / sum(syl)
N, M = len(words), len(segs)
INF = 1e18
dp = [[INF] * (N + 1) for _ in range(M + 1)]
bk = [[None] * (N + 1) for _ in range(M + 1)]
dp[0][0] = 0
pre = [0]
for s in syl:
    pre.append(pre[-1] + s)
for j in range(M):
    d = segs[j][1] - segs[j][0]
    for i in range(N + 1):
        if dp[j][i] >= INF:
            continue
        # boş segment (nefes/klik)
        c = dp[j][i] + (0.3 if d < 0.25 else 50)
        if c < dp[j + 1][i]:
            dp[j + 1][i], bk[j + 1][i] = c, i
        for k in range(i + 1, min(N, i + 25) + 1):
            pred = (pre[k] - pre[i]) * rate
            cost = ((d - pred) / max(0.4, pred)) ** 2 * 4
            # segment sonu bir kelime sonu: noktalamada ise ödül
            if k < N:
                cost += 0 if punct[k - 1] else 0.6
            c = dp[j][i] + cost
            if c < dp[j + 1][k]:
                dp[j + 1][k], bk[j + 1][k] = c, i
assign = []
i = N
for j in range(M, 0, -1):
    p = bk[j][i]
    assign.append((j - 1, p, i))
    i = p
assign.reverse()
out = []
for j, a, b in assign:
    if a == b:
        continue
    s0, s1 = segs[j]
    tot = sum(syl[a:b]) + 0.4 * (b - a)
    t = s0
    for k in range(a, b):
        w = (syl[k] + 0.4) / tot * (s1 - s0)
        out.append({"word": words[k], "start": round(t, 3), "end": round(t + w, 3)})
        t += w
    print(f"[{s0:6.2f}-{s1:6.2f}] " + " ".join(words[a:b]))
json.dump({"text": text, "durationInSeconds": round(dur, 3), "words": out}, open(f"public/audio/{name}.json", "w"), ensure_ascii=False, indent=1)
