"""
Wilma Rudolph videosu için müzik + ses efektlerini sentezler (hazır dosya kullanmaz).

Kullanım:  python3 scripts/wilma-audio.py
Okur:      public/audio/wilma.json (kelime zamanları; efektler kelimelere bağlı)
Yazar:     public/wilma/muzik.wav, public/wilma/efekt.wav, public/wilma/grain-*.png, public/wilma/kagit.jpg
"""
import json
import os

import numpy as np
from PIL import Image
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "wilma")
os.makedirs(OUT, exist_ok=True)

SR = 48000
TAIL = 2.8  # src/compositions/WilmaRudolph.tsx içindeki TAIL ile aynı
data = json.load(open(os.path.join(ROOT, "public", "audio", "wilma.json")))
W = [w["start"] for w in data["words"]]
DUR = data["durationInSeconds"] + TAIL
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def add(buf, sig, at, gain=1.0, pan=0.0):
    """Mono sinyali stereo tampona `at` saniyesinde ekler."""
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * gain * l * 1.414
    buf[i : i + len(sig), 1] += sig * gain * r * 1.414


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env_adsr(n, a=0.01, r=0.3):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def reverb(x, sec=2.6, mix=0.3):
    n = int(sec * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    out = np.zeros_like(x)
    for c in range(x.shape[1]):
        out[:, c] = fftconvolve(x[:, c], np.roll(ir, c * 97), mode="full")[: len(x)]
    return x * (1 - mix) + out * mix


# ---------------------------------------------------------------- enstrümanlar
def piano(note, dur=2.5, vel=0.6):
    f = hz(note)
    t = t_arr(dur)
    s = np.zeros_like(t)
    for k in range(1, 8):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        s += np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.2 + k * 0.9)) / k**1.1
    ham = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 60) * 0.15
    s = (s + ham) * env_adsr(len(t), 0.003, 0.25)
    return s * vel


def pad(notes, dur, vel=0.2, bright=1200):
    t = t_arr(dur)
    s = np.zeros_like(t)
    for n in notes:
        for d in (-0.08, 0.0, 0.07):
            ph = rng.uniform(0, 1)
            s += (2 * ((hz(n + d) * t + ph) % 1) - 1) * 0.3
    s = lp(s, bright, 2)
    return s * env_adsr(len(t), min(1.2, dur / 3), min(1.5, dur / 3)) * vel / len(notes)


def boom(dur=3.0, f0=55, vel=1.0):
    t = t_arr(dur)
    f = f0 * (1 + 1.5 * np.exp(-t * 18))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    s += lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 8) * 0.4
    return s * vel


def kick(vel=0.8):
    t = t_arr(0.5)
    f = 48 * (1 + 2.5 * np.exp(-t * 35))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel


def tom(vel=0.5, f0=110):
    t = t_arr(0.6)
    f = f0 * (1 + 0.6 * np.exp(-t * 20))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s += bp(rng.standard_normal(len(t)), 200, 2500) * np.exp(-t * 25) * 0.3
    return s * vel


def whoosh(dur=0.9, vel=0.35, rise=True):
    t = t_arr(dur)
    x = rng.standard_normal(len(t))
    e = np.sin(np.pi * (t / dur) ** (0.6 if rise else 1.6)) ** 2
    lo = lp(x, 900) * e
    hi = bp(x, 1500, 6000) * e * (t / dur)
    return (lo * 0.8 + hi * 0.5) * vel


def riser(dur=2.6, vel=0.4):
    t = t_arr(dur)
    x = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = int(0.05 * SR)
    for i in range(0, len(t), seg):
        c = 400 + 7000 * (i / len(t)) ** 2
        out[i : i + seg] = bp(x[i : i + seg + 2000], c * 0.7, min(c * 1.4, 20000))[:seg][: len(out[i : i + seg])]
    out *= (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(110 + 330 * (t / dur) ** 2) / SR) * (t / dur) ** 2 * 0.25
    return (lp(out, 9000) + tone) * vel


def click(vel=0.25, f=2600):
    t = t_arr(0.06)
    return bp(rng.standard_normal(len(t)), f * 0.6, f * 1.6) * np.exp(-t * 120) * vel


def type_key(vel=0.3):
    t = t_arr(0.12)
    s = bp(rng.standard_normal(len(t)), 1200, 5000) * np.exp(-t * 90)
    s += np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.5
    return s * vel


def stamp(vel=0.7):
    t = t_arr(0.5)
    s = lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 30)
    s += np.sin(2 * np.pi * 85 * t) * np.exp(-t * 18)
    return s * vel


def clank(vel=0.4):
    t = t_arr(1.2)
    s = np.zeros_like(t)
    for f, d in ((523, 4), (1187, 6), (1873, 8), (2741, 11), (3517, 14)):
        s += np.sin(2 * np.pi * f * t) * np.exp(-t * d)
    s += bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 80) * 2
    return s / 4 * vel


def chime(note, vel=0.4):
    t = t_arr(3.0)
    f = hz(note)
    s = np.zeros_like(t)
    for k, a, d in ((1, 1, 1.4), (2.76, 0.5, 2.6), (5.4, 0.25, 4.0), (8.9, 0.12, 6.0)):
        s += np.sin(2 * np.pi * f * k * t) * a * np.exp(-t * d)
    return s * env_adsr(len(t), 0.002, 0.3) * vel


def scribble(dur, vel=0.12):
    t = t_arr(dur)
    x = bp(rng.standard_normal(len(t)), 2500, 9000)
    stroke = 0.5 + 0.5 * np.sin(2 * np.pi * (5 + 2 * np.sin(t * 3)) * t)
    return x * stroke**2 * env_adsr(len(t), 0.03, 0.1) * vel


def pistol(vel=0.9):
    t = t_arr(1.6)
    s = rng.standard_normal(len(t)) * np.exp(-t * 45)
    s = hp(s, 300) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 5) * 0.25
    return s * vel


def crowd(dur=5.0, vel=0.3):
    t = t_arr(dur)
    x = np.zeros_like(t)
    for _ in range(6):
        x += bp(rng.standard_normal(len(t)), rng.uniform(300, 600), rng.uniform(1500, 3000))
    e = np.minimum(t / 0.5, 1) * np.exp(-np.maximum(t - 1.5, 0) * 0.9)
    return x / 6 * e * vel


def footstep(vel=0.3):
    t = t_arr(0.15)
    return (lp(rng.standard_normal(len(t)), 700) * np.exp(-t * 50) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 40)) * vel


def flash(vel=0.2):
    t = t_arr(0.4)
    s = bp(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t * 70)
    s += np.sin(2 * np.pi * (3000 + 4000 * t) * t) * np.exp(-t * 12) * 0.05
    return s * vel


def heartbeat(vel=0.5):
    t = t_arr(0.6)
    one = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 25)
    two = np.zeros_like(t)
    k = int(0.22 * SR)
    two[k:] = one[: len(t) - k] * 0.7
    return lp(one + two, 200) * vel


# ---------------------------------------------------------------- müzik
music = np.zeros((N, 2))
BEAT = 60 / 72
A, C, D, E, F, G = 57, 60, 62, 64, 65, 67

# 1) Giriş: gerilimli bas drone + kalp atışı (0 – "Adı")
intro_end = W[16]
add(music, pad([33, 45], intro_end + 1.5, 0.5, 400), 0)
add(music, pad([76, 83], intro_end + 1.5, 0.05, 3000), 0.5, pan=0.3)
for k in range(int(intro_end / 1.05)):
    add(music, heartbeat(0.35), 0.4 + k * 1.05)

# 2) Hikâye: Am – F – C – G piyano arpejleri + pad
story_a, story_b = W[16] - 0.2, W[86]
prog = [(A - 12, [A, C, E]), (F - 12, [F, A, C]), (C - 12, [C, E, G]), (G - 12, [G, 59, D])]
t0 = story_a
bar = 4 * BEAT
i = 0
while t0 < story_b - 0.3:
    root, ch = prog[i % 4]
    full = t0 > W[53]  # annesi: tel pad katmanı
    add(music, pad([root, root + 12] + ch, bar + 1.2, 0.16 if full else 0.1, 1600 if full else 900), t0)
    add(music, piano(root - 12 + 12, 3.5, 0.35), t0)
    pat = [0, 1, 2, 1, 2, 0, 1, 2] if t0 > W[72] else [0, 1, 2, 1]
    step = bar / len(pat)
    for j, p in enumerate(pat):
        if t0 + j * step < story_b - 0.2:
            add(music, piano(ch[p] + 12, 2.2, 0.22), t0 + j * step, pan=0.2 * (p - 1))
    if t0 > W[78]:  # koşmaya başladı: nabız gibi tom
        for b in range(4):
            add(music, kick(0.35), t0 + b * BEAT)
    t0 += bar
    i += 1

# 3) Roma: yükselen gerilim, sessizlik, tabanca, coşkulu final bölümü
rome = W[92]
add(music, riser(rome - story_b, 0.35), story_b)
add(music, pad([45, 52, 57], rome - story_b + 0.3, 0.18, 700), story_b)
epic = [(C - 12, [C, E, G]), (G - 12, [G, 59, D]), (A - 12, [A, C, E]), (F - 12, [F, A, C])]
t0 = rome
i = 0
quote = W[109]
while t0 < quote - 0.2:
    root, ch = epic[i % 4]
    add(music, pad([root - 12, root] + ch + [c + 12 for c in ch], bar + 1.5, 0.22, 2600), t0)
    for b in range(8):
        tb = t0 + b * BEAT / 2
        if tb >= quote - 0.2:
            break
        if b % 2 == 0:
            add(music, kick(0.55), tb)
        if b in (2, 6):
            add(music, tom(0.35, 140), tb, pan=-0.2)
        add(music, piano(ch[b % 3] + 24, 1.4, 0.12), tb, pan=0.3)
    t0 += bar
    i += 1

# 4) Alıntı: sadece yumuşak piyano
for k, (root, ch) in enumerate([(A - 12, [A, C, E]), (F - 12, [F, A, C])]):
    tb = quote + k * 3.8
    add(music, piano(root, 4.5, 0.3), tb)
    for j, n in enumerate(ch):
        add(music, piano(n + 12, 4.0, 0.16), tb + 0.5 + j * 0.6)
add(music, pad([45, 57, 60, 64], W[121] - quote, 0.07, 700), quote)

# 5) Kapanış: büyük çözülme F → C
fin = W[121]
add(music, boom(4, 41, 0.5), fin)
add(music, pad([41, 53, 57, 60, 65, 69], (W[125] - fin) + 0.8, 0.22, 2200), fin)
add(music, pad([36, 48, 55, 60, 64, 67, 72], DUR - W[125] + 0.5, 0.26, 2400), W[125])
for j, n in enumerate([72, 76, 79, 84]):
    add(music, piano(n, 5.0, 0.2), W[125] + j * 0.35)
add(music, piano(48, 6.0, 0.4), W[125])

music = reverb(music, 3.0, 0.35)
fade = np.ones(N)
fe = int((DUR - 1.8) * SR)
nf = int(1.8 * SR)
fade[fe : fe + nf] = np.linspace(1, 0, nf)
fade[fe + nf :] = 0
music *= fade[:, None]

# ---------------------------------------------------------------- efektler
fx = np.zeros((N, 2))
# Projektör vızıltısı (çok kısık, sürekli)
t = np.arange(N) / SR
proj = lp(rng.standard_normal(N), 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t) ** 2) * 0.02
fx[:, 0] += proj
fx[:, 1] += proj

add(fx, boom(3, 45, 0.55), 0.0)
add(fx, whoosh(0.7, 0.35), W[7] - 0.6)
add(fx, boom(3, 50, 0.8), W[7])
add(fx, flash(0.25), W[7] + 0.02)
add(fx, whoosh(0.8, 0.3), W[16] - 0.5)
add(fx, stamp(0.55), W[19])
for k in range(22):  # 22 kardeş noktaları
    add(fx, click(0.12, 1800 + 60 * k), W[23] + k * 0.055, pan=-0.6 + k * 0.055)
add(fx, chime(84, 0.15), W[26])
add(fx, whoosh(0.7, 0.25), W[29] - 0.45)
for wi in (36, 38, 42):  # dosya kartı: daktilo
    for k in range(7):
        add(fx, type_key(0.25), W[wi] - 0.15 + k * 0.07)
add(fx, stamp(0.7), W[43])
add(fx, whoosh(0.8, 0.3), W[48] - 0.5)
add(fx, clank(0.45), W[50])
add(fx, whoosh(0.8, 0.25), W[53] - 0.5)
add(fx, scribble(W[64] - W[59], 0.1), W[59])  # haritada yol çizilir
for k in range(4):
    add(fx, click(0.3, 1500), W[67] + k * 0.2)
add(fx, clank(0.3), W[75] + 0.2)
for k in range(9):  # koşmaya başladı: hızlanan adımlar
    add(fx, footstep(0.35), W[77] + 0.9 * (1 - (1 - k / 9) ** 0.5) * 1.3, pan=0.15 * (-1) ** k)
add(fx, whoosh(0.7, 0.3), W[80] - 0.45)
add(fx, chime(76, 0.3), W[84])
add(fx, pistol(0.7), W[92] - 0.05)
add(fx, crowd(6.5, 0.22), W[92])
for k, wi in enumerate((100, 101, 102)):
    add(fx, chime(88 + 2 * k, 0.35), W[wi])
for k in range(5):
    add(fx, flash(0.18), W[103] + k * 0.45 + rng.uniform(0, 0.15), pan=rng.uniform(-0.7, 0.7))
add(fx, whoosh(1.0, 0.2, rise=False), W[109] - 0.4)
for a, b in ((112, 114), (115, 117), (118, 120)):
    add(fx, scribble(W[b] - W[a] + 0.4, 0.08), W[a])
add(fx, boom(4, 38, 0.6), W[128] + 0.5)

fx = reverb(fx, 1.6, 0.18)


def write_wav(path, x, peak):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    import wave

    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


write_wav(os.path.join(OUT, "muzik.wav"), music, 0.9)
write_wav(os.path.join(OUT, "efekt.wav"), fx, 0.9)

# ---------------------------------------------------------------- dokular
for k in range(6):  # film greni
    g = rng.normal(128, 38, (960, 540)).clip(0, 255).astype("uint8")
    Image.fromarray(g, "L").save(os.path.join(OUT, f"grain-{k}.png"))

# Eski kâğıt dokusu
h, w = 1920, 1080
base = np.zeros((h, w))
for s, a in ((4, 0.5), (16, 0.3), (64, 0.2)):
    small = rng.standard_normal((h // s + 1, w // s + 1))
    big = np.array(Image.fromarray(small.astype("float32"), "F").resize((w, h), Image.BICUBIC))
    base += big * a
yy, xx = np.mgrid[0:h, 0:w]
vig = ((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2
lum = 0.86 + base * 0.025 - vig * 0.07
col = np.stack([lum * 236, lum * 222, lum * 190], -1).clip(0, 255).astype("uint8")
Image.fromarray(col, "RGB").save(os.path.join(OUT, "kagit.jpg"), quality=88)
print("hazır", DUR)
