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
4. **Paylaşım kopyası (ses yüksekliği):** ElevenLabs sesi sosyal medya için kısık kalır
   (~-18 LUFS). Paylaşmadan önce -14 LUFS'a çek:
   ```bash
   ffmpeg -i out/x.mp4 -c:v libx264 -crf 20 -preset slow -af "loudnorm=I=-14:TP=-1:LRA=11" \
     -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart out/x-paylas.mp4
   ```

## Mevcut kompozisyonlar

- **VoiceoverVideo** — 1080x1920 (9:16), 30 fps. Arka plan gradyanı, başlık,
  ElevenLabs sesi ve kelime kelime vurgulanan büyük altyazılar (3 kelimelik sayfalar).
- **VoomTanitim** — Voom uygulaması tanıtımı (~45 sn). Metin `icerik/voom-tanitim.txt`,
  ekran görüntüleri `public/voom/`. Sahne zamanları dosyadaki `S` tablosunda; metin
  değişirse yeni JSON'a göre güncellenmeli. Renkler uygulamanın kendi paletinden
  (siyah + limon yeşili #D4F24A). Render:
  `npx remotion render VoomTanitim out/voom-tanitim.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`

- **VoomKisa** — Voom tanıtımının 15 sn'lik kısa sürümü (aynı dosyada, `K` tablosu). Metin
  `icerik/voom-kisa.txt`. Kullanıcı isteği: yapay zekayla yapıldığı belli olmasın ve uygulamanın
  "yapay zeka koç" tarafı (sohbet/öneri ekranları) gösterilmesin. Bu yüzden koç sohbeti sahneleri
  yok, altyazı sade (`plain`, kelime kelime vurgu yok), ses daha canlı (`--stability 0.35 --speed 1.15`).
- **HerKafadanAkici** — **güncel örnek / referans kurgu** (~35 sn). Kullanıcının metni +
  bağlayıcı kendi cümlelerimiz, tek kahraman (52xxx serisi kadın) ile bütünlüklü hikâye,
  profesyonel kurgu: kesmeler cümle başında (efekt geçiş yok), ortak renk + vinyet + gren,
  yüze doğru yavaş push-in, sade altyazı, DSÖ alt bandı, kapanış başlığı, müzik
  (Mixkit "Deep Urban", `public/music/623.mp3`; bas girişi dönüm cümlesine denk).
- **HerKafadan15** — 15 sn deneme; kullanıcı "ilk video daha iyiydi, bütünlük ve geçişler amatör" dedi.
  ~15 sn, sade. Metin
  `icerik/her-kafadan-15sn.txt` (kullanıcının metni). 6 çekim, sadece altyazı + sonda tek
  DSÖ bilgi kartı. Yüz konumları OpenCV ile ölçülüp `face` olarak yazıldı (yüz tam görünsün).
- **HerkesBaskaDiyorGercek** — (uzun, 50 sn; kullanıcı "çok uzun ve karmaşık" buldu) aynı metin, **gerçek insan** stok videolarıyla (Mixkit).
  Kullanıcı bunu tercih etti (3D mankeni "yüzü yok" diye beğenmedi). Çekim listesi
  dosyadaki `SHOTS` tablosu (klip id, başlangıç, yatay odak `x`, zoom, görünüm).
  Klipler `public/stock/` (git'e eklenmez), kaynak listesi `icerik/stok-kaynaklar.md`.
  Ortak balon/etiket/altyazı parçaları `src/ui/overlays.tsx`.
- **HerkesBaskaDiyor** — (eski deneme) aynı metnin 3D manken versiyonu (~50 sn), "Zack D. Films" tarzı: 3D manken
  karakter, kas bölgesi renklendirme (bacak/kol/karın), konuşma balonları, bilgi etiketleri.
  Metin `icerik/herkes-baska-diyor.txt`. Sahne zamanları dosyadaki `T` tablosunda.
  Tek 3D sahne tüm video boyunca açık; kamera `cameraAt(t)` ile, etiketler aynı kamerayla
  3D noktalara bağlanır (`project`).

## 3D karakter (src/three/Character.tsx)

- Model: `public/models/Xbot.glb` (three.js örneklerinden, Mixamo iskeleti). Klipler:
  idle, walk, run, agree, headShake, sad_pose, sneak_pose.
- Model **+z'ye bakar**, karakterin solu **+x**. `aims` ile kemik bir yöne çevrilir
  (karakterin kendi yönlerine göre) — squat/curl/plank pozları böyle yazıldı.
- `glow` ile kas bölgeleri renklenir (legs/arms/core), `attach` ile ele dambıl takılır.
- Modeller canvas dışında `useGltf` ile yüklenmeli (yoksa render boş çıkar).
- 3D render yavaş ve bellek yiyor: `--concurrency=3` kullan; aynı anda çok `still` çalıştırma.
  `remotion.config.ts` içinde yazılım WebGL (`swangle`) açık.

## Kurallar / kararlar

- Kullanıcı **gerçek, yüzü görünen insan** görüntüsü istiyor; yüzsüz manken/3D figür kabul görmedi.
  Gerçek insan için stok video (Mixkit, anahtar gerekmez) kullan.
- **Sade ama akıcı ve profesyonel**: ekranı kalabalıklaştırma (balon yağmuru, ölçer, çok etiket yok).
  Süre metne göre (~30-35 sn kabul gördü; aşırı kısaltma bütünlüğü bozdu).
- **Profesyonel kurgu**: bulanık/kayan "whip" geçişler amatör duruyor → kullanma. Kesmeler
  cümle başında; tüm kliplere aynı renk ayarı; mümkünse tek kahraman ile hikâye bütünlüğü;
  kapanışta "daha yakına kes" gibi sade teknikler; arka planda konuşmanın altında kısık müzik.
- Metin: kullanıcının cümlelerini koru, akıcılık için bağlayıcı kendi cümlelerimizi ekle.
- **Yüzler yarım kalmasın**: dikey kadrajda yüz tam görünmeli. Yüz konumunu ölç
  (`pip install "opencv-python-headless<5"`, Haar cascade) ve kadrajı yüze göre ayarla;
  yüzü kadraj genişliğinden büyük (kaynak yüksekliğinin ~%50'sinden büyük) klipleri kullanma.
- Bilgi/iddia gerekiyorsa uluslararası kaynaklı ve doğrulanmış olsun (ör. DSÖ/WHO 2020:
  yetişkinler haftada 150–300 dk orta tempo aerobik + haftada ≥2 gün kas güçlendirme);
  kaynağı kartta küçük yaz.

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
- Bilgilendirici içerikte iddialar genel kabul görmüş bilgiye dayanmalı (ör. kardiyo/ağırlık
  sırası hedefe bağlı; tükenişe yakın setlerde hafif ve ağır yük benzer kas gelişimi sağlar,
  güç için ağır yük gerekir; pilates karın/duruş için iyi, tek başına yeterli değil).
- Okunuşu bozuk kelimeler seslendirme metninde okunduğu gibi yazılır
  (`icerik/<ad>.seslendirme.txt`, ör. "Voom" → "Vum"); ekranda doğru yazım için
  kompozisyondaki `DISPLAY` eşlemesi kullanılır.

## Geliştirme notları

- Tip kontrolü: `npm run typecheck`
- Bulut/CI ortamında Remotion kendi Chrome'unu indiremezse
  `--browser-executable=<chrome-headless-shell yolu>` ile mevcut tarayıcı verilebilir.
