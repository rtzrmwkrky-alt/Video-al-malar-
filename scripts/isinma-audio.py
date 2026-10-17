"""
IsinmaKas videosu için neşeli müzik döngüsü + ses efektlerini sentezler (hazır dosya kullanmaz).

Kullanım:  python3 scripts/isinma-audio.py
Yazar:     public/isinma/muzik.wav (16 sn, kesintisiz döngü), public/isinma/<efekt>.wav
(Eski sentez sürüm; artık Mixkit efekt/müzik kullanılıyor. Konuşma süreleri: scripts/isinma-ses.py)
"""
import json
import os
import re
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "isinma")
os.makedirs(OUT, exist_ok=True)
SR = 48000
rng = np.random.default_rng(11)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def save(name, x, peak=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.max(np.abs(x)) or 1
    wavfile.write(os.path.join(OUT, name + ".wav"), SR, (x / m * peak * 32767).astype(np.int16))


# ------------------------------------------------------------------ müzik (ukulele benzeri, 120 bpm)

def pluck(freq, dur, bright=0.5):
    """Karplus-Strong telli çalgı."""
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 2000 + 5000 * bright, 1)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


BPM = 120
BEAT = 60 / BPM
BARS = 8
LOOP = BARS * 4 * BEAT  # 16 sn
music = np.zeros((int(LOOP * SR) + SR * 2, 2))


def add(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    sig = sig[: len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * gain * l * 1.414
    buf[i : i + len(sig), 1] += sig * gain * r * 1.414


# C – G – Am – F (iki tur)
CHORDS = [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]] * 2
BASS = [48, 43, 45, 41] * 2
# strum deseni: aşağı, aşağı-yukarı, yukarı-aşağı-yukarı (8'lik)
PATTERN = [(0, 1.0), (1, 0.55), (1.5, 0.45), (2.5, 0.5), (3, 0.7), (3.5, 0.45)]
cache = {}
for b, ch in enumerate(CHORDS):
    for pos, vel in PATTERN:
        t0 = (b * 4 + pos) * BEAT
        for k, m in enumerate(ch if pos % 1 == 0 else ch[::-1]):
            key = (m, round(vel, 2))
            if key not in cache:
                cache[key] = pluck(note(m), 1.2, bright=0.35 + 0.4 * vel) * np.exp(-t_arr(1.2) * 2.5)
            add(music, cache[key], t0 + k * 0.012, gain=0.16 * vel, pan=-0.25 + k * 0.15)
    # bas: 1. ve 3. vuruş
    for pos in (0, 2):
        tt = t_arr(0.45)
        f = note(BASS[b])
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) + 0.3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 9)
        add(music, s, (b * 4 + pos) * BEAT, gain=0.32)
    # alkış/parmak şıklatma: 2 ve 4
    for pos in (1, 3):
        n = rng.uniform(-1, 1, int(0.12 * SR)) * np.exp(-t_arr(0.12) * 40)
        add(music, bp(n, 1200, 5000), (b * 4 + pos) * BEAT, gain=0.18, pan=0.2)
    # shaker: 16'lıklar
    for k in range(16):
        n = rng.uniform(-1, 1, int(0.05 * SR)) * np.exp(-t_arr(0.05) * 70)
        add(music, hp(n, 6000), (b * 4 + k * 0.25) * BEAT, gain=0.05 * (1.3 if k % 2 else 0.8), pan=-0.3)
    # glockenspiel melodisi (2. tur)
    if b >= 4:
        mel = [76, 79, 81, 79, 76, 74, 72, 74][(b - 4) * 2 : (b - 4) * 2 + 2]
        for j, m in enumerate(mel):
            tt = t_arr(1.0)
            f = note(m)
            s = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 8)) * np.exp(-tt * 3.5)
            add(music, s, (b * 4 + j * 2) * BEAT, gain=0.09, pan=0.35)

# döngü: kuyruğu başa ekle (kesintisiz)
L = int(LOOP * SR)
music[: len(music) - L] += music[L:]
music = music[:L]
save("muzik", music, peak=0.8)

# ------------------------------------------------------------------ efektler

# woosh (kas zıplayarak girer)
tt = t_arr(0.6)
n = rng.uniform(-1, 1, len(tt))
k = tt / 0.6
sweep = bp(n, 300, 1200) * (1 - k) + bp(n, 1200, 4500) * k
save("woosh", sweep * np.sin(np.pi * k) ** 2)

# boing (zıplama/iniş)
tt = t_arr(0.45)
f = 180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 5)
save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6))

# buz çatırtısı (lastik gerilirken): rastgele çıtırtılar, yoğunluk artar
dur = 1.6
x = np.zeros(int(dur * SR))
for k in range(70):
    at = dur * (rng.random() ** 0.6)
    ln = int(rng.uniform(0.004, 0.02) * SR)
    c = rng.uniform(-1, 1, ln) * np.exp(-np.arange(ln) / (ln / 4))
    i = int(at * SR)
    x[i : i + ln] += c[: len(x) - i] * (0.3 + 0.7 * at / dur)
creak_t = t_arr(dur)
creak = np.sin(2 * np.pi * np.cumsum(90 + 140 * creak_t / dur + 20 * np.sin(2 * np.pi * 23 * creak_t)) / SR)
creak = bp(np.sign(creak) * 0.3 + creak * 0.2, 150, 1800) * (creak_t / dur) ** 1.5
save("buz", hp(x, 1500) * 0.9 + creak * 0.35)

# ÇAT! (kopma): keskin çatlama + düşük gümleme + buz kırıntıları
tt = t_arr(1.0)
crack = rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 45)
thump = np.sin(2 * np.pi * (70 + 60 * np.exp(-tt * 20)) * tt) * np.exp(-tt * 9)
tink = np.zeros(len(tt))
for k in range(9):
    at = rng.uniform(0.05, 0.6)
    f = rng.uniform(2500, 5200)
    s = np.sin(2 * np.pi * f * t_arr(0.15)) * np.exp(-t_arr(0.15) * 35)
    i = int(at * SR)
    tink[i : i + len(s)] += s[: len(tink) - i] * 0.25
save("cat", hp(crack, 600) * 1.0 + thump * 0.9 + tink)

# bloop (ısınma hareketi kartı)
tt = t_arr(0.22)
save("bloop", np.sin(2 * np.pi * np.cumsum(300 + 500 * tt / 0.22) / SR) * np.exp(-tt * 14))

# ışıltı (kas ısındı): yükselen çan arpeji
tt = t_arr(1.6)
x = np.zeros(len(tt))
for j, m in enumerate([84, 88, 91, 96, 100]):
    s = np.sin(2 * np.pi * note(m) * t_arr(1.0)) * np.exp(-t_arr(1.0) * 4)
    i = int(j * 0.07 * SR)
    x[i : i + len(s)] += s[: len(x) - i]
save("isilti", x)

# metal (halter kavranır / bırakılır)
tt = t_arr(0.8)
x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(523, 7), (1271, 10), (2213, 14), (3417, 20)])
x += hp(rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 60), 2000) * 0.8
save("metal", x)

# ding (kapanış kartı)
tt = t_arr(1.4)
save("ding", (np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 2636 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 3))

print("Hazır:", ", ".join(sorted(f for f in os.listdir(OUT))), "|", len(lines), "satır")
