# Şu an proje geliştirilmeye başlıyor

> Bu dosya proje geliştikçe güncellenir. Yeni kararlar, kurallar ve iş akışları
> konuşuldukça buraya eklenir.

## İletişim kuralları (EN ÖNEMLİ — her zaman uy)

- Kullanıcıyla **her zaman Türkçe** konuş. Asla İngilizce yazma.
- Kullanıcı teknik değil: **çok basit, günlük dille** anlat. Teknik terim,
  dosya adı, komut veya kod gösterme; gerekiyorsa ne işe yaradığını sade
  bir cümleyle söyle.
- Kullanıcı bu kuralları her seferinde tekrar etmek zorunda kalmamalı.

## Projenin amacı

Sosyal medya (Instagram Reels, TikTok, YouTube Shorts vb.) için **organik içerik**
üretmek ve bu içerikleri **izlenebilir** (dikkat çekici, sonuna kadar izlenen) kılmak.

Şu anki araç seti:

- **ElevenLabs** → metinden seslendirme (text-to-speech) + kelime zamanlamaları
- **Remotion** → React ile kodla video üretimi ve render

İleride daha iyi bir araç çıkarsa onunla değiştirilebilir; mimariyi buna göre
gevşek bağlı tut (ses üretimi ve video katmanı birbirinden ayrı).

## Kullanıcıyla iletişim

- Kullanıcı teknik değil. Cevaplar **Türkçe**, kısa ve **basit dille** olmalı;
  jargon gerekiyorsa kısa bir benzetmeyle açıkla.
- API anahtarlarını asla sohbete yapıştırmasını isteme.

## Proje yapısı

```
scripts/generate-voice.ts       ElevenLabs ile ses + kelime zamanlaması üretir
public/audio/<ad>.mp3 / .json   Üretilen ses ve altyazı verisi (Remotion buradan okur)
src/index.ts                    Remotion giriş noktası
src/Root.tsx                    Kompozisyonların kaydı (format, fps, süre)
src/compositions/               Video şablonları (her biri bir kompozisyon)
src/types.ts                    Ortak tipler (VoiceoverData, Word)
remotion.config.ts              Remotion CLI ayarları
```

## Kurulum

```bash
npm install
cp .env.example .env   # ELEVENLABS_API_KEY değerini doldur
```

Bulut (Claude Code web) oturumlarında `ELEVENLABS_API_KEY` ortam ayarlarına
eklendi; script onu doğrudan ortam değişkeninden okur, `.env` gerekmez.
Anahtar sadece ayar eklendikten **sonra açılan** oturumlarda görünür.

## İş akışı

1. **Seslendirme üret:**
   ```bash
   npm run voice -- --name bolum1 "Seslendirilecek metin buraya"
   # veya dosyadan:
   npm run voice -- --name bolum1 --file metin.txt
   # Türkçe aksanı için önerilen:
   npm run voice -- --name bolum1 --model eleven_v4 --language tr --file metin.txt
   ```
   → `public/audio/bolum1.mp3` ve `public/audio/bolum1.json` oluşur.
2. **Önizle:** `npm run dev` (Remotion Studio), `audioName` prop'unu `bolum1` yap.
3. **Render al:**
   ```bash
   npx remotion render VoiceoverVideo out/bolum1.mp4 \
     --props='{"audioName":"bolum1","title":"Başlık","data":null}'
   ```
   `data` alanı `calculateMetadata` ile JSON'dan otomatik doldurulur; video
   süresi seslendirme süresine göre ayarlanır.

## Mevcut kompozisyonlar

- **VoiceoverVideo** — 1080x1920 (9:16), 30 fps. Arka plan gradyanı, başlık,
  ElevenLabs sesi ve kelime kelime vurgulanan büyük altyazılar (3 kelimelik sayfalar).
- **VoomTanitim** — Voom uygulaması tanıtımı (~45 sn). Metin `icerik/voom-tanitim.txt`,
  ekran görüntüleri `public/voom/`. Sahne zamanları dosyadaki `S` tablosunda; metin
  değişirse yeni JSON'a göre güncellenmeli. Renkler uygulamanın kendi paletinden
  (siyah + limon yeşili #D4F24A). Render:
  `npx remotion render VoomTanitim out/voom-tanitim.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`

## Kurallar / kararlar

- Varsayılan format **dikey 9:16 (1080x1920), 30 fps**.
- İçerik dili **Türkçe**. ElevenLabs modeli varsayılan `eleven_multilingual_v2`.
  Video kökünde `lang="tr"` kullan ki büyük harf dönüşümü doğru olsun (i → İ).
- Altyazılar her videoda olmalı (sessiz izleyen kitle için izlenebilirliğin temeli).
- `remotion` ve `@remotion/*` paketleri **aynı ve sabit sürümde** tutulmalı (`^` yok).
- API anahtarları sadece `.env` içinde; asla commit edilmez.
- `out/` (render çıktıları) commit edilmez.

- Yazı tipleri `public/fonts/` içinde (Geist, Geist Mono, Instrument Serif), `src/fonts.ts`
  ile yüklenir; render sırasında internet gerekmez.
- ElevenLabs hesabı **ücretsiz** planda: kütüphanedeki (Türk) sesler API'den kullanılamıyor.
  Ses tasarımı (yeni ses oluşturma) da ücretli. Şimdilik hazır ses "Sarah"
  (EXAVITQu4vr4xnSDxMaL) + en yeni model `eleven_v4` + `--language tr` (Türkçe zorlanır).
  Ücretli plana geçilirse önerilen Türkçe ses: "Gökçe Deniz" (oPC5I9GKjMReiaM29gjY).
- Okunuşu bozuk kelimeler seslendirme metninde okunduğu gibi yazılır
  (`icerik/<ad>.seslendirme.txt`, ör. "Voom" → "Vum"); ekranda doğru yazım için
  kompozisyondaki `DISPLAY` eşlemesi kullanılır.

## Geliştirme notları

- Tip kontrolü: `npm run typecheck`
- Bulut/CI ortamında Remotion kendi Chrome'unu indiremezse
  `--browser-executable=<chrome-headless-shell yolu>` ile mevcut tarayıcı verilebilir.
