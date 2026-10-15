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
  yok, altyazı sade (`plain`, kelime kelime vurgu yok), ses sakin ve az vurgulu (`--stability 0.6 --speed 1.1`).
- **HerKafadanAnimasyon** — **kullanıcının son tercihi: animasyon (3D manken)**, gerçek insandan
  vazgeçti. Referans videodaki (Zack D. Films) gibi. Aynı metin/ses (her-kafadan-akici).
  Tek kesintisiz 3D sahne; kamera karakterler arasında yumuşak süzülür (kesme yok, `SETUPS`).
  Ana karakter ortada; turuncu (yerinde koşu = kardiyo), mor (hızlı hafif dambıl),
  yeşil (matta plank = pilates). Balonlar 3D noktalara bağlı (`project`, kamera arkasındaysa gizli).
  "Yol alamıyorsun"da ana karakter yerinde koşar, balonlar başı etrafında döner; "vücudunun neye
  ihtiyacı"nda bacak/kol/karın sırayla yanar; kapanış yüze yaklaşma + "Senin hedefin ne?".
  Ortak 3D parçalar `src/three/scene.tsx` (zemin, mat, dambıl, pozlar, arka plan, project).
  Kullanıcı "etraf boş" dedi → `GymProps`: squat kafesi, dambıl rafları, koşu bantları, bench,
  kettlebell, plaka ağacı/yığını, pilates topları; her çekimin arka planını dolduracak ve kamera
  yollarını kapatmayacak şekilde yerleştirildi. Geniş plandan yakına geçişte kamera `arc` ile
  karakterin etrafından dolaşır (düz çizgide içinden geçiyordu).
- **HerKafadanAkici** — (gerçek insan sürümü) referans kurgu (~26 sn). Kullanıcı DSÖ detayını
  istemedi → metinden ve ekrandan çıkarıldı; kapanış "Asıl soru şu: Senin hedefin ne?". Kullanıcının metni +
  bağlayıcı kendi cümlelerimiz, tek kahraman (52xxx serisi kadın) ile bütünlüklü hikâye,
  profesyonel kurgu: kesmeler cümle başında (efekt geçiş yok), ortak renk + vinyet + gren,
  yüze doğru yavaş push-in, sade altyazı, kapanış başlığı, müzik
  (Mixkit "Deep Urban", `public/music/623.mp3`; bas girişi kapanış sorusuna denk).
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

- **Sessiz örnekler (Ornek1–4)** — kullanıcı referans videolardan (Pixar tarzı hikâye, Zack D.
  Films, glassbox.tr koyu teknik anlatım, eski kâğıt çizim masal) harman, spor/antrenman konulu,
  her yaşa uygun viral örnekler istedi. **Seslendirme yok, kredi harcanmadı**; kullanıcı birini
  seçince seslendirilecek. Voom gösterilmiyor. Zamanlama metin satırlarından (`src/ornek/common.tsx`,
  `timeline`), sahneler satır sırasına (`at(i)`) bağlı; satırlar ileride seslendirme metni olur.
  1 KasAgrisi (koyu teknik çizim), 2 Pazartesi (3D manken hikâye), 3 TasUstasi (kâğıt üstü
  karakalem masal), 4 DogruYanlis (4 soruluk efsane testi, sarı zemin).

- **KarakterSecim** — kullanıcı Xbot mankenini **istemiyor** ("bu adamı istemiyorum"). Yerine kendi
  çizdiğimiz animasyon karakteri: `src/three/ToonPerson.tsx` (iri baş, büyük gözler, kaş/gülümseme/
  göz kırpma mimikleri, saç tipleri; pozlar açılarla: idle/walk/run/wave, `mix` ile karıştırılır).
  Üç aday: Deniz (kıvırcık saçlı kadın), Can (sakallı erkek), Elif (at kuyruklu genç kadın) — seçim bekleniyor.
  Hazır ücretsiz modeller (three.js Michelle, ReadyPlayerMe) denendi, beğenilecek kalitede değildi.

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

- Görsel tercih değişti: önce gerçek insan istedi, **en son 3D manken animasyonunda karar kıldı**
  (referans: Zack D. Films). Emin değilsen sor; gerçek insan gerekiyorsa Mixkit stok video kullan.
- 3D'de kamera karakterlerin içinden/arkasından geçmesin: her kurulumda kamera ile hedef arasında
  başka karakter olmadığını kare kontrolüyle doğrula.
- **Sade ama akıcı ve profesyonel**: ekranı kalabalıklaştırma (balon yağmuru, ölçer, çok etiket yok).
  Süre metne göre (~30-35 sn kabul gördü; aşırı kısaltma bütünlüğü bozdu).
- **Profesyonel kurgu**: bulanık/kayan "whip" geçişler amatör duruyor → kullanma. Kesmeler
  cümle başında; tüm kliplere aynı renk ayarı; mümkünse tek kahraman ile hikâye bütünlüğü;
  kapanışta "daha yakına kes" gibi sade teknikler; arka planda konuşmanın altında kısık müzik.
- Metin: kullanıcının cümlelerini koru, akıcılık için bağlayıcı kendi cümlelerimizi ekle.
- **Yüzler yarım kalmasın**: dikey kadrajda yüz tam görünmeli. Yüz konumunu ölç
  (`pip install "opencv-python-headless<5"`, Haar cascade) ve kadrajı yüze göre ayarla;
  yüzü kadraj genişliğinden büyük (kaynak yüksekliğinin ~%50'sinden büyük) klipleri kullanma.
- Kullanıcı istemedikçe kurum/istatistik detayı (ör. DSÖ önerisi) ekleme; mesaj odaklı kal.
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
- **Ses tercihi (kullanıcı seçti, "robot gibi" bulduğu düz okumaya karşı):** `eleven_v4`,
  `--language tr --stability 0.3 --style 0.45 --speed 1.05`. Seslendirme metninde doğal duraklar
  için "..." ve virgül kullan (`icerik/<ad>.seslendirme.txt`); altyazıda "..." gösterilmez.
  Ses denemesi gerekirse kısa bir karşılaştırma videosu (1-2-3) yapıp kullanıcıya seçtir.
  Alternatif "duygulu" ses: `eleven_v3 --stability 0.5` + metinde İngilizce duygu etiketleri
  (`[conversational]`, `[sighs]`, `[curious]`...; `icerik/her-kafadan-akici.duygulu.txt`);
  etiketler okunmaz, altyazıdan otomatik ayıklanır. Kompozisyon: HerKafadanAkiciDuygulu.
- HerKafadanAkici'de kesmeler saniyeyle değil **kelime sırasıyla** (`word`) tanımlı: ses
  değişse de kesmeler cümle başında kalır.
- ElevenLabs hesabı **ücretsiz** planda: kütüphanedeki (Türk) sesler API'den kullanılamıyor.
  Ses tasarımı (yeni ses oluşturma) da ücretli. Şimdilik hazır ses "Sarah"
  (EXAVITQu4vr4xnSDxMaL) + en yeni model `eleven_v4` + `--language tr` (Türkçe zorlanır).
  Ücretli plana geçilirse önerilen Türkçe ses: "Gökçe Deniz" (oPC5I9GKjMReiaM29gjY).
- Bilgilendirici içerikte iddialar genel kabul görmüş bilgiye dayanmalı (ör. kardiyo/ağırlık
  sırası hedefe bağlı; tükenişe yakın setlerde hafif ve ağır yük benzer kas gelişimi sağlar,
  güç için ağır yük gerekir; pilates karın/duruş için iyi, tek başına yeterli değil).
- **Seslendirme metni doğal konuşma dili olsun**: cümleler hep "-yor" ile bitmesin ("biliyor,
  giriyorsun, kaydediyor" gibi art arda gelince duyuru/robot gibi duruyor). Yumuşak, gündelik
  ifadeler kullan ("yazman yeterli", "evde de olur", "kayıtta"); abartılı vurgu yok.
- Okunuşu bozuk kelimeler seslendirme metninde okunduğu gibi yazılır
  (`icerik/<ad>.seslendirme.txt`, ör. "Voom" → "Vum"); ekranda doğru yazım için
  kompozisyondaki `DISPLAY` eşlemesi kullanılır.

## Geliştirme notları

- Tip kontrolü: `npm run typecheck`
- Bulut/CI ortamında Remotion kendi Chrome'unu indiremezse
  `--browser-executable=<chrome-headless-shell yolu>` ile mevcut tarayıcı verilebilir.
