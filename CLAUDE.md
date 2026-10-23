# Şu an proje geliştirilmeye başlıyor

> Bu dosya proje geliştikçe güncellenir. Yeni kararlar, kurallar ve iş akışları
> konuşuldukça buraya eklenir.

## İletişim kuralları (EN ÖNEMLİ — her zaman uy)

- Kullanıcıyla **her zaman Türkçe** konuş. Asla İngilizce yazma.
- Kullanıcı teknik değil: **çok basit, günlük dille** anlat. Teknik terim,
  dosya adı, komut veya kod gösterme; gerekiyorsa ne işe yaradığını sade
  bir cümleyle söyle.
- Kullanıcı bu kuralları her seferinde tekrar etmek zorunda kalmamalı.
- **Robot gibi konuşma** (kullanıcı uyardı): madde madde rapor, başlık, düz resmî cümleler yok. Arkadaşınla
  sohbet eder gibi, sıcak ve kısa yaz ("tamam, hallettim", "bak şöyle yaptım"). Video seslendirme metinleri de
  aynı şekilde gündelik konuşma dilinde olmalı.
- **Kredi/para harcayan her işten önce sor** (Apify taraması, ElevenLabs seslendirmesi vb.):
  ne yapılacağını ve yaklaşık maliyetini söyle, onay gelmeden çalıştırma.

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

- **KarakterSecim** — kullanıcı Xbot mankenini **istemiyor**. Kendi çizdiğimiz `ToonPerson` (src/three/ToonPerson.tsx)
  da beğenilmedi. Kullanıcı **Michelle** modelinin (three.js örneği, `public/models/Michelle.glb`) tarzını beğendi:
  "kollarını düzelt, yüzünü saçını değiştir, aynısı olmasın" → `src/three/Girl.tsx`:
  - Xbot klipleri model-uzayında yeniden hedeflenir (kollar düzgün).
  - Üçgen etiketleri `michelle-labels.txt` (0 gövde, 2 kulaklık, 3 saç, 4-5-7 gözlük, 6 göz, 8 ayakkabı,
    9 yan topuzlar) ve UV haritası `michelle-uvlabels.png` (10 = yüz) ile kulaklık/gözlük/topuz gizlenir,
    doku yeniden boyanır (ten, saç, üst, alt, ayakkabı; yüzdeki gözlük gölgesi düzleştirilir).
  - Kaşlar ve yeni saç modelleri (uzun / at kuyruğu / topuz) baş kemiğine bağlı tüplerle eklenir.
  - Adaylar (`GIRLS`): Ada (uzun kahve saç, mercan üst), Mina (siyah at kuyruğu, lila), Zeynep (kızıl topuz, mint).
    Seçim bekleniyor.
  - Kullanıcı sonra **orijinal kızın aynısını, beyaz tenli ve düz saçlı** istedi → `KizBeyaz`
    (kıyafet orijinal renklerde; `style: "straight"`).
  - Saç **kumral** (`#7f5a3e`). Son istek: **gözlük/kulaklık yok, takı olsun, gözler ve kirpikler belirgin, yüzde hata olmasın** →
    `eyes` (yeni dokulu göz küreleri + göz kapağı açma `openLids` + kirpik/eyeliner), `lips` (3B dudak,
    boyalı dudak tene çevrilir), `jewelry` (altın halka küpe, gerdanlık + kolye ucu, sol bilekte bileklik).

- **KasAgrisiToon** — kullanıcı 3D kızı da bıraktı: **düz çizgi karikatür** istedi (referans: bej kâğıt zemin,
  kalın kahverengi konturlu sade karakter, sarı vurgulu kalın altyazı). Karakter `src/cartoon/ToonGirl2D.tsx`
  (SVG; pozlar açıyla, ifadeler smile/ouch/grit/wink/happy/think). Önce 30 sn istendi, sonra kullanıcı **kısaltma yapma, uzun videodaki detaylı bilgiler kalsın** dedi (~47 sn). Seslendirildi: `icerik/kas-agrisi.seslendirme.txt` → `public/audio/kas-agrisi` (Sarah, eleven_v4, tr, stability 0.3, style 0.45, speed 1.05; ~52 sn). Satır ve altyazı zamanları kelime zamanlarından (`voiceTimeline`); seslendirme metni ekrandaki satırlarla kelime kelime aynı sayıda olmalı. Kısık müzik 623. Geçişler yumuşak (kullanıcı "göz yoruyor" dedi: büyük zoom, zıplayan yazı, titreme yok); izleyiciyi
  tutan hızlı kurgu; altyazı 3 kelimelik parçalar. Kullanıcı isteği: **teslimden önce videoyu kendin izle,
  bozuk yeri düzelt, fazlayı çıkar, eksiği ekle.**

- **WilmaRudolph** — belgesel tarzı motivasyon reels'i (~67 sn), Wilma Rudolph hikâyesi. Kanca: "Doktorlar:
  bir daha asla yürüyemeyecek" → 16 yıl sonra Roma. Metin `icerik/wilma.seslendirme.txt` (okunuş "Vilma Rudolf";
  ekranda doğru yazım ve rakamlar `DISPLAY` ile). Ses `public/audio/wilma` (Sarah, eleven_v4, tr, stability 0.35,
  style 0.4, speed 1.0). Görseller `public/wilma/` (kullanıcının fotoğrafları, telefon ekranından kırpıldı).
  Kürsü fotoğrafı aslında 1948 Londra (Alice Coachman) → sadece yüzsüz kürsü kısmı kullanılıyor; bacak desteği
  fotoğrafı temsilî (ekranda yazıyor). Müzik + efektler hazır dosya değil, `scripts/wilma-audio.py` ile sentezlenir
  (kelime zamanlarına bağlı; ses değişirse yeniden çalıştır). Görünüm: Playfair Display italik altyazı,
  Dancing Script el yazısı, sepya ton, gren, çizik/toz, vinyet, ışık titremesi. Sahneler kelime sırasına (`W(i)`) bağlı.

- **IsinmaKas** — "Isınmadan başlama!" (~38 sn). **Kullanıcı bu çalışmayı beğenmedi ve sonlandırdı (v4 sonrası); devam ettirme.**
  Ders: 2B SVG konuşan kas karakteri + çizgi film sahnesi kullanıcının beklediği kaliteye ulaşmadı. Kullanıcının örneği: konuşan
  kas karakteri sahibine laf yetiştiriyor (yapay zekâ ile üretilmiş Pixar tarzı video) → **aynısı asla olmasın,
  sadece fikir**; kendimize özel. Parlak, yuvarlak hatlı çizgi film; karakterler `src/cartoon/IsinmaChars.tsx`.
  - 1. taslak geri bildirimi: "konuşma akıcı ve hikâye gibi olsun, **kas kasa benzemiyor**, hareketler akıcı olsun".
    → Kas artık gerçek kas gibi: iğ biçimli karın, uzunlamasına lif demetleri, iki ucunda parlak beyaz tendon;
    soğukken soluk pembe + buz + atkı/bere, ısınınca canlı kırmızı (`w`). Onion/soğan gibi durmasın: mor ton ve
    sivri uç kullanma.
  - Pozlar satır başına (`guyAt`/`kasAt`), satır geçişinde 0.4 sn harmanlanır (`BLEND`); nefes alma hareketi;
    konuşan karakterin ağzı oynar (`talk`).
  - Diyalog (karşılıklı, hikâye): "Hop hop! Nereye böyle?" → "Halter kaldıracağım. Ne var?" → "Ama ben daha
    uyanmadım… Buz gibiyim!" → "Abartma, iki dakikalık iş." → lastik gösterisi "ÇAT!" → "Isınmadan yüklenirsen
    ben de böyle incinebilirim." → "Peki ne yapayım?" → "Beni sadece 5-10 dakika ısıt." → 3 ısınma hareketi →
    "Oh be! Kan geldi, ısındım!" → kaldırış → kart → "Yarın sabah da ısınıyoruz, tamam mı?" → "Söz!".
  - **Döngü (loop) kullanıcı isteği:** son 0.63 sn sporcu halterlere koşar, video aynı koşunun devamıyla başlar
    (`LOOP_END`/`LOOP_START`). Konuşmalar balonlarda (altyazı yerine).
  - 2. taslak onaylandı ("daha iyi"); "halter yandan kesilmiş, alanı genişlet" → geniş plan ölçeği `BASE` 0.88.
  - **Seslendirildi:** `icerik/isinma.seslendirme.txt` → satır başına ayrı dosya `public/audio/isinma-NN.mp3`
    (kas = Jessica `cgSgspJ2msm6clMCkdW9`, sporcu = Liam `TX3LPaxmHKxFdv7VOQHJ`; eleven_v4, tr, 0.3/0.45/1.05).
    Videoda `RATE` 1.08 hızla çalınır. Satır süreleri konuşma süresinden (`src/compositions/isinma-ses.json`,
    sessizlik ölçülerek `scripts/isinma-audio.py` yazar) → toplam ~39 sn. Kart cümlesini de kas okur.
  - Müzik + efektler hazır dosya değil: `python3 scripts/isinma-audio.py` (ukulele benzeri 120 bpm 16 sn döngü,
    woosh/boing/buz çatırtısı/ÇAT/bloop/ışıltı/metal/ding → `public/isinma/`, git'e girmez). Müzik ısınma
    bölümünde (konuşma yokken) biraz yükselir.
  - 3. geri bildirim: sentez müzik/efekt ve sesler beğenilmedi. Efektler artık Mixkit ücretsiz efektleri
    (`public/isinma/sfx/<id>.mp3`, `FX` tablosu). Müzik: önce enerjik spor istendi, sonra **"sakin müzik"**;
    **seçilen: Mixkit 1076 "Smile"** (`public/music/1076.mp3`, git'te yok:
    `curl -o public/music/1076.mp3 https://assets.mixkit.co/music/1076/1076.mp3`). Müzik Remotion'da değil,
    render sonrası ffmpeg ile konuşmanın altında kısılarak (sidechain) eklenir:
    video `--props='{"music":null}'` ile render → `ffmpeg -i out/isinma-son.mp4 -i public/music/1076.mp3
    -filter_complex "[0:a]asplit=2[v][key];[1:a]volume=0.32,afade=t=in:d=0.3[m];[m][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];[v][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]"
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k out/isinma-son-paylas.mp4`.
  - **Bekleyen (kredi gelince, kullanıcıya sorarak):** kullanıcı konuşan seslerin tonunu/tınısını beğenmedi →
    tüm satırlar yeni seslerle (ücretli plan olursa Türk sesler). Sporcu repliği "Abartma istersen, ne olacak ki?"
    olacak (şimdilik balon eski sesle aynı: "Abartma, iki dakikalık iş."). Kapanış kartı yazısı yeni
    ("Isınma 5 dakika. Ama sakatlanırsan aylarca sürebilir."), kasın sesi hâlâ eski cümle.
    Kullanıcı şimdilik **hak harcanmasını istemedi**.
  - 4. geri bildirim: "sıp sıp geçişler" (pop/woosh efektleri, zıplayarak beliren balon/çipler) **sevilmedi** →
    pop/woosh efektleri ve ölçekle zıplayan beliriş yok; her şey yumuşak solarak gelir. Konuşma balonları
    "kitap gibi / çocuk eğitim videosu gibi" bulundu → kutusuz, kalın konturlu yuvarlak yazı (Baloo 2,
    `ROUND`, `toonText`), söylenen kelime konuşanın renginde (karaoke, `Caption`). Yazı ile konuşma birebir
    aynı olmalı (`say` alanı okunuş farkı için). Kullanıcı önce **sessiz hâli** görüp onaylayacak,
    **seslendirme en son**. Yeni metin: "Daha uyanmadım… Buz gibiyim!", "Abartma istersen, ne olacak ki?",
    "Gel, sana…" çıktı (sessiz an, `act`), "Isınmadan yüklenirsen ben de incinirim.", kapanışı kas okur.
    Ses tonu: daha yumuşak, akıcı, samimi (ör. stability ~0.5, style ~0.2, speed ~0.95; `RATE` 1.0).
    Seslendirince `isinma-ses.json` içine `version: "v2-yumusak"`, satır `text` ve kelime başlangıçları
    (`words`) yazılmalı; sürüm tutmazsa süreler tahmini ve ses çalınmaz (sessiz taslak böyle üretilir).
  - **Sessiz taslak onaylandı → v2 seslendirme yapıldı** (hesap artık **Starter** plan, ~29 bin karakter; kütüphane
    sesleri kullanılabiliyor). Kas = **Gökçe Deniz** (`oPC5I9GKjMReiaM29gjY`), sporcu = **Arman Yılmazkurt**
    (`qUGjOGoUuQBTUqwY8n0e`, kütüphaneden eklendi); eleven_v4, tr, stability 0.5, style 0.2, speed 0.95.
    Metin `icerik/isinma.seslendirme.txt`; özet `python3 scripts/isinma-ses.py` → `isinma-ses.json` (sürüm
    `v2-yumusak`). Render: `--props='{"music":null}'` → ardından müzik ffmpeg ile (yukarıdaki komut) →
    `out/isinma-v2-paylas.mp4`.
  - 5. geri bildirim: müzik "çok çocukça" → **Deep Urban (623)**; kasın sesi **erkek** olsun → 4 aday
    (`public/audio/kas-aday-*`, `out/kas-ses-secimi.mp4`) arasından **Ses 3 = Arman Yılmazkurt** seçildi
    (kas: 0.4/0.3/1.0); sporcu = **Chris** (0.3/0.45/1.05). Kasın ağzı konuşurken oynamıyordu → ağız artık
    gerçek ses seviyesine bağlı (`isinma-ses.json` `env`, kare başına 0-1) ve her ifadede konuşurken açılır.
    "Kas şeklini belli et, gerekirse kolundan konuşsun" → kasın uçlarında tendon yelpazesi + enine çizgiler;
    sporcunun üst kollarında pazu kası (`Bicep`), kas konuşurken parlar. Son: `out/isinma-v4-paylas.mp4`
    (müzik 623 ile ffmpeg karışımı).

- **BoyUzama** — gençlere yönelik karikatür (~49 sn sessiz), tek anlatıcı. Apify ile TikTok/YouTube/Instagram tarandı:
  en çok izlenenler komedi skeci ve "annene göster" tarzı cevap videoları; Türkçede animasyonlu anlatım yok.
  Kurgu: kapıda anne "Ağırlık kaldırma, boyun kısa kalır!" (kapı pervazında boy çizgileri) → kemiğin içi:
  **büyüme plağı** (kullanıcı "inşaat" yerine bilimsel anlatım istedi) — sevimli kıkırdak hücreleri bölünür,
  dizilir, sertleşip kemiğe dönüşür (plağa yumuşak yaklaşma) → ergenlik sonu "plak kapandı" + **röntgen** (12 yaş açık
  plak çizgisi / 18 yaş çizgi yok; kullanıcı seçimi) → kararı genler +
  hormonlar verir → halterci/basketbolcu (seçilme, spor boyu değiştirmez) → asıl tehlike: koçsuz, bozuk teknik,
  aşırı yük → 3 kural kartı → uyku + beslenme (pervaza yeni çizgi "16") → "sana bunu söyleyene gönder".
  Metin `icerik/boy-uzama.txt` — kullanıcı isteği: **robotik değil, izleyiciyle sohbet eder gibi hikâyeleşen** dil
  ("Tanıdık geldi mi?", "dediğini duyar gibiyim"). "Hoca" değil **"koç"** kelimesi.
  Ses isteği: **sıcak, samimi, yapay zekâ olduğu belli olmayan** ses.
  Ses karşılaştırması yapıldı (`out/ses-karsilastirma.mp4`; SES 1 Sarah, 2 Jessica, 3 Will, 4 Chris; örnekler
  `public/audio/ses-*`). Kullanıcı **SES 4 = Chris** (`iP95p4xoKVk53GoZ742B`, eleven_v4, tr, 0.3/0.45/1.05) seçti. Seslendirme yapıldı. Genç/anne/halterci/basketbolcu/koç `ToonGirl2D`'nin `look` seçenekleriyle
  (kısa saç, renkler) çizilir; ele nesne `itemL/itemR` ile verilir.

- **BoyUzama görünüm denemeleri (beğenilmedi):** 4 renk/stil teması (tebeşir, neon, pastel, çizgi roman;
  `boyUzamaStyles.tsx`) ve 5 yeni stil denemesi (`StilOrnekleri`: piksel oyun, telefon mesajlaşma, anime,
  izometrik 3B, kil). Kullanıcı hepsini beğenmedi: **"daha farklı bir karakter oluşturmalıyız"**. Sıradaki adım:
  kullanıcıdan beğendiği karakter örneği (video/görsel) istemek; kodla çizilen basit karakterler yetersiz kalıyor.

- **Yeni figür (BoyUzama için, geliştiriliyor):** `src/anime/AnimeTeen.tsx` — anime/TV çizgi film tarzı genç
  (kullanıcı referansı: One Piece, Avatar; gerçek insan ve bebeksi karikatür değil, gerçekçi oranlı, ifadeli,
  kalın kontur + iki tonlu gölge). Turuncu atlet "16", lacivert şort, kırmızı kafa bandı, bileklik, dambıl.
  Saç: diken → kıvırcık (beğenilmedi, "çok gür") → 4 seçenekten **"Dağınık" (`messy`) seçildi**. Önizleme:
  `AnimeKarakter` (bulutlu gökyüzü). Gazete karikatürü tarzı (`KarikaturGenc`) da denendi; kullanıcı figür
  üzerinde ilerlemek istedi. **Kırmızı bantlı hâli onaylandı.**
  - BoyUzama artık bu figürle: `AnimeTeen` pozlanabilir (`pose`: dirsek/bilek, `squat`, elde dambıl/telefon,
    `head`; `expr`: grin/happy/wink/think/ouch/shout/smile; `look`: renkler, saç bun/short/cap, tişört, pantolon,
    numara, kirpik, genişlik). Diğer karakterler de aynı tarzda (`src/anime/looks.ts`: MOM, COACH, LIFTER, BALLER).
  - Arka plan: 9 palet denendi, kullanıcı **turkuaz** seçti (BoyUzama varsayılanı `look: "turkuaz"`).
    Son video: `out/boy-uzama-turkuaz-paylas.mp4`.
  - **v2 (son, ~42 sn):** kullanıcı "çok yavaş / max 30-40 sn" dedi; önce eski sesten kesip %15 hızlandırdık
    (`boy-uzama-kisa`) → "çok hızlı, kekeliyor, anlatım bozuk" → **baştan kısa metin** (`icerik/boy-uzama-v2.txt`)
    Chris ile normal hızda seslendirildi (`public/audio/boy-uzama-v2`, ~580 karakter). Son cümle kullanıcı isteği:
    "Şimdi bu videoyu arkadaşına gönder." Sürüm seçimi `VARIANTS` (audioName → kalan sahne satırları). **Sesi
    hızlandırma/kesip birleştirme yapma** — kısaltma gerekirse metni yeniden yaz ve onayla seslendir.
  - Anne: bağırıp kaybolan hâli beğenilmedi; telefon bildirimi önerisi istenmedi → **iki eli belinde**, endişeli-sevecen
    (`expr: "worry"`, konuşurken `mouth`), lafını bitirince gülümseyip sahnede kalır. Altyazı `top` 1300.
    Müzik 623 normal hızda. Son: `out/boy-uzama-v2-paylas.mp4`.

- **GeceYemek** — "Geç saatte yeme, kilo alırsın" efsanesi (~41 sn, sessiz taslak, tek anlatıcı). Karakter: anime tarzı genç
  (`AnimeTeen`). Kadroda anne/koç da var (`src/anime/looks.ts`) ama **bu videoda kullanıcı anne ve koçu istemedi** → sadece genç;
  "Gece gece yeme!" sesi ekran dışından (aralık kapıdan) gelir, 2. satır "Peki gerçekten öyle mi? Cevap çok net: …".
  Arka fon **turkuaz** gradyan (kullanıcı seçimi, `bg` prop), kanca "EFSANE Mİ, GERÇEK Mİ?" + koç sahnesinde EFSANE damgası, müzik 623. Metin `icerik/gece-yemek.txt`.
  Sahneler: gece mutfak (kapıdan ses "Gece gece yeme!") → "saati yok, matematiği var" + EFSANE damgası → terazi (alınan/harcanan, saat döner
  00:00, sandviç düşer ama açık sürer) → yatak odası (ağır yemek, uyku ölçer düşer) → hafif atıştırmalık → özet kartı → telefonlu genç kapanış.
  **Seslendirildi:** `icerik/gece-yemek.seslendirme.txt` → `public/audio/gece-yemek` (Chris, eleven_v4, tr, 0.3/0.45/1.05; ~47 sn,
  657 karakter). Kullanıcı isteği: sıcak, samimi, konuşma dili.
  Kullanıcı **40-45 sn** istedi (uzun video istemiyor, akış bozulmasın) → kredi harcamadan kısaltıldı:
  `python3 scripts/sikistir-ses.py gece-yemek gece-yemek-kisa --max-pause 0.28 --tempo 1.04` (uzun sessizlikler 0.28 sn'ye,
  perde bozulmadan %4 hız; kelime zamanları da yeniden yazılır) → video `audioName: gece-yemek-kisa`, ~43 sn.
  Son: `out/gece-yemek-43sn-paylas.mp4`.
  **KESİN KURAL (kullanıcı tekrar hatırlattı): videolar 30-40 sn**, çok akıcı, görsellerde hiçbir kusur yok, ses tonu Chris (sıcak,
  samimi, konuşma dili). Kısaltma = metni yeniden yaz + onayla yeniden seslendir (sesi hızlandırma/kesme yok).

- **AvatarSecim** — kullanıcı videolarda sürekli kullanacağı bir **kanal avatarı** (ekrana konuşan karikatür) istedi; 4 aday
  (`src/avatar/Avatars.tsx`, omuz plan, göz kırpar, konuşurken ağız oynar): 1 Deniz (anime sporcu kız), 2 Kaan Koç
  (anime genç koç, şapka + düdük), 3 Bobo (maskot ayı), 4 Efe (Pixar tarzı büyük gözlü genç). Önizleme
  `out/avatar-secim.mp4`. Kullanıcı **4 Efe'yi (Pixar tarzı) seçti**, ismin değişmesini istedi.
  Görünüm seçenekli sürüm `src/avatar/Chibi.tsx` (`LOOKS`), önizleme **EfeVaryant** (`out/efe-varyant.mp4`):
  1 Arda (dağınık kahve saç, turuncu kapüşonlu = orijinal), 2 Kuzey (kıvırcık siyah saç, ter bandı, çil, mavi tişört),
  3 Atlas (sarı saç, yeşil forma 7), 4 Poyraz (ters kırmızı şapka, boyunda kulaklık, mor kapüşonlu).
  **Görünüm ve isim seçimi bekleniyor** (isim ve görünüm ayrı ayrı da eşleşebilir).
- **FigurSecim** — kullanıcı sonra yön değiştirdi: Voom hesabındaki (heyvoom) iki videonun figürlerinin
  **ortalaması** olan sade el çizimi figür istedi (yuvarlak büyük kafa, nokta göz, allık, kabarık omuzlu tişört,
  konturlu çubuk kollar/bacaklar; açık bej duvar + zemin ya da koyu lacivert kareli zemin + krem kontur; hafif
  titrek çizgi filtresi). `src/avatar/Doodle.tsx` (`DOODLES`, 5 aday: 1 kısa saç sarı tişört, 2 at kuyruğu kız,
  3 dikenli saç mor kapüşonlu, 4 ters şapka yeşil tişört, 5 kıvırcık kız turuncu üst). Önizleme `out/figur-secim.mp4`.
  Kullanıcı **3'ü** sordu; 3 ikinci örneğe (8 saat videosu) fazla benzediği için kendine özgü hâller yapıldı:
  **FigurUc** (`out/figur-3-halleri.mp4`): A sarı kapüşonlu + turkuaz atkı (koyu yeşil kareli), B turkuaz +
  kırmızı ter bandı (bordo), C turuncu + mavi bileklik, kahve saç (koyu petrol), D kırmızı + sarı kulaklık (antrasit).
  Doodle'a imza eşyalar eklendi: `hood`, `scarf`, `headband`, `wrist`, `phones`. **Seçim bekleniyor.**
- **Yeni yön (yapay zekâ görselleri):** kullanıcı Pinterest'ten 3 yapay zekâ 3B görseli buldu: (1) örgü kazaklı, uzun boyunlu,
  pembe düz zemin; (2) bej zemin, güneş gözlüklü şık sade çift; (3) turuncu zemin, battaniyeli koltukta Pixar tarzı ifadeli çift.
  Önerimiz 3 (ifade + tanıdık mizah), sonra 1; 2 gözleri kapattığı için uygun değil. Kodla çizim bu kaliteye ulaşmaz →
  karakter ChatGPT/Gemini resim aracında üretilecek, biz **karakter tarifi** yazıp videoya yerleştiriyoruz.
  Harman önerisi "kanal karakteri": Pixar ifadeli yüz (3) + örgü kazak ve bere (1) + alnına itilmiş yuvarlak gözlük imza
  eşyası (2'den, gözler açık kalır) + her videoda tek renk parlak zemin.
  Kullanıcı 1. görseldeki **erkeği** farklı kıyafetlerle istedi → `src/avatar/KnitGuy.tsx` (yandan, uzun boyun, bere,
  örgü kazak deseni, kareli pantolon, kalın tabanlı ayakkabı; düz 2B çizim, kıyafet seçimi için), **OrguKiyafet**
  (`out/orgu-kiyafet.png`): 1 Klasik örgü (krem kazak, kahve kareli, yeşil bere), 2 Sporcu (turuncu kapüşonlu, gri eşofman,
  siyah bere), 3 Renkli (hardal kazak, mavi kareli, mavi bere), 4 Şık (yeşil kazak, krem pantolon, gözlük berede).
  Her biri için ChatGPT/Gemini tarifi verildi. **Kullanıcı 2 = Sporcu'yu seçti** (turuncu kapüşonlu, beyaz şeritli gri
  eşofman, siyah örgü bere, beyaz spor ayakkabı, koyu ten, uzun ince boyun, keçe/örgü dokulu 3B oyuncak tarzı,
  turkuaz düz zemin). Karakter ChatGPT/Gemini'de üretilecek; kullanıcı ilk resmi kaydedip sonraki sahneleri
  "bu karakterin aynısı" diye o resimle üretecek, bize gönderecek → biz videoya dizeriz (hafif yakınlaşma, altyazı, ses, müzik).
  **Karakterin adı: BORA.** Kullanıcı "Bora" dediğinde bu karakter kastedilir ve o video Bora ile yapılır.
  Tüm tarif ve kurallar `icerik/bora-karakter.md`.
  Kullanıcı "sen bana üretiyordun" diye kızdı: **karakteri kullanıcıya ürettirme, kendin üret.** → `src/avatar/Bora.tsx`
  (kodla çizim, 7 duruş + 6 ifade), tanıtım **BoraTanitim** (`out/bora.png`).
  Kullanıcı yandan görünen KnitGuy "Sporcu" çizimini gösterip **buğday ten + daha dikkat çekici spor kıyafeti** istedi →
  KnitGuy'a `skin` (WHEAT_SKIN, açık buğday: kullanıcı "biraz daha aç" dedi), `jacket`, `zip`, `sleeveStripe`, `block` eklendi; 4 seçenek `BORA_SPOR`
  (OrguKiyafet `--props='{"set":"spor"}'`, `out/bora-spor.png`): 1 Neon yeşil ceket + siyah eşofman, 2 kırmızı eşofman
  takımı beyaz şeritli, 3 elektrik mavisi kapüşonlu + turuncu blok, 4 turuncu kapüşonlu + siyah blok/şerit. **Seçim bekleniyor**;
  seçilince önden Bora (`Bora.tsx`) da aynı ten/kıyafete çevrilecek.
  Sonra kullanıcı başka bir Pinterest görselinin ("3D Stylized Character", kıvırcık kahve saç, iri yuvarlak siyah gözlük,
  iri pembe kulak ve burun, uzun boyun, koyu kuzu yünü ceket, krem örgü kazak, koyu gri dar pantolon, turuncu bilekli
  ayakkabı, bej zemin) **aynısını** istedi → `src/avatar/CurlyGuy.tsx`, önizleme **KivircikGenc** (`out/kivircik.png/.mp4`).
  **KARAR (son): Bora = bu kıvırcık saçlı gözlüklü genç (`CurlyGuy`).** Kullanıcı "çok beğendim, adı Bora kalsın" dedi.
  Önceki Bora sürümleri (önden turuncu kapüşonlu `Bora.tsx`, yandan `BoraYan.tsx`/örgü, `Bora3D`) artık **eski**; yeni
  videolarda Bora denince `CurlyGuy` kullanılır. Eksik: pozlar/ifadeler (şu an sadece ayakta, eller cepte, göz kırpma).

- **Zayiflar** — "Zayıfların sakladığı o sır!" (kullanıcının 2. metni, 3 yalan; 30-40 sn kuralı için kullanıcının metni hafif
  sıkılaştırıldı, 590 karakter ≈ 40 sn). Hikâye: her şeyi yiyen kız ("o") ↔ Bora ("sen/biz"). Kız = `CurlyGuy` + `GIRL_LOOK`
  (uzun koyu saç, kâkül, mercan hırka, açık kot, küpe, kirpik; Bora'nın tarzında, kulaklar saç altında).
  Kanca ilk karede ekranda; **her maddede ekranı kaplayan dev rakam** (kullanıcı ipucu, `BigNum`) → efsane kartı + kırmızı YALAN mührü;
  cevaplar sahnede: kız doyunca bırakır / Bora aynı masada zorla bitirir (ölçer taşar), gün boyu kuruyemiş çizelgesi + 3.000 kcal,
  merdiven + adım sayacı, "1 saat spor → kanepe" ↔ kız bütün gün hareket; son sahne fonu = ilk sahne (döngü).
  Metin `icerik/zayiflar.txt`, seslendirme `icerik/zayiflar.seslendirme.txt`. **Kullanıcı isteği: ses = "Manitammm"**
  (kullanıcının klonladığı Türkçe erkek ses, `WYz3C2SUJKV2mMyXR0L3`; eleven_v4, tr, 0.4/0.35/1.05) → `public/audio/zayiflar` (38.6 sn, video 40 sn).
  Kullanıcı "Manitamın sesi" derse bu ses. **Ses efektleri istendi** (sade, olay anında): Mixkit `public/zayiflar/sfx/` — ısırık 117,
  dev rakam 2902, YALAN mührü 2182, doydum 2870, ölçer taştı 946, kcal 2841, alışkanlık 952, yorum bildirimi 2354 (`FX` tablosu).
  Müzik 623 (0.04). Son: `out/zayiflar-paylas.mp4` (-14 LUFS).

- **GeceKilo** — "Gece yemek yemek gerçekten kilo aldırır mı?" (kullanıcının metni, 40 sn'ye sığsın diye sıkılaştırıldı; ~87 kelime).
  Bora (`CurlyGuy`), sahneye göre fon rengi. Seslendirme metni `icerik/gece-kilo.seslendirme.txt` → `public/audio/gece-kilo`.
  Kullanıcı ses olarak `ZDms2uXMdWDykDg7lTQ3` kimliğini verdi; API'de bulunamadı → kullanıcı sesi hesabına ekledi:
  **"Manitam"** (API adı "Manitammm") (`WYz3C2SUJKV2mMyXR0L3`, klon, Türkçe genç erkek). Seslendirildi (eleven_v4, tr, 0.3/0.45/1.05; 36.9 sn, ~600 karakter).
  Sessiz taslak önce gösterildi (kullanıcı "sesi en sona bırak" dedi). Son: `out/gece-kilo-paylas.mp4` (-14 LUFS).
  Kullanıcı "ses efekti yok" dedi → yumuşak efektler eklendi (`FX` tablosu; Mixkit, `public/sfx/<id>.mp3` git'te): saat tıkırtısı + gong,
  buzdolabı kapağı, kart sayfası, ibre dönüşü, EFSANE damgası, kalori sayacı, kefeye düşen sandviç, uyku ölçer, ✓ tonları, telefon bildirimi.
  İlk efektler (gong, sayfa, sayaç, ding) **"amatör" bulundu** → sinematik ses tasarımı: ortam sesi (gece cırcır 1789,
  buzdolabı uğultusu 1837), kancada bas vuruşu 2299, kilit cümlede bant durması 1092 + **müzik susar** (`duck`), soru öncesi
  gerilim yükselişi 790 → cevapta derin vuruş 1143, horlama 2478, temiz arayüz tıkları (2568, 1120). Kullanıcı: "milyonlarca
  izlenecek video, unutma" → **her videoda ses tasarımı profesyonel olsun** (az ama yerinde, çizgi film pop/boing/woosh yok).
  Sonra: **"abartma, profesyonel olsun"** → horlama, bant durması, ışıltı çıkarıldı; hepsi kısık; müzik tamamen susmaz, hafifçe kısılır.
  Genel kural: **abartı/komik efekt yerine sade, gerçekçi, profesyonel** (görselde de, seste de).
  Kullanıcı ayrıca **cırcır böceği** (mutfak) ve **kapanıştaki "gönder" bildirim sesini** istemedi → çıkarıldı.
  **Her videoda ses efekti olsun** (kısık, pop/woosh yok). Kullanıcı "ana ses kısık" dedi → konuşma `volume={1.6}` (~+4 dB, müzik/efekt üstünde).

- **GobekYagi** — "Göbek yağı için yaptığın en büyük hata" (~39 sn, kullanıcının metni hikâyeleştirildi). Kullanıcının kuralı
  (her videoda): **önce acıya dokun → bilimsel açıklama → en son tavsiye → döngü (loop) ile başa dön**; göndermeden önce
  kullanıcının 12 maddelik listesini kendin kontrol et (Neden izlesin: ilk saniye kanca, merak, tempo, his; Neden yorum:
  taraf tutturan an, tartışma payı, söylenecek bir şey, kendini görmek; Neden paylaşsın: "bunu ona atmalıyım", akılda kalan
  replik, "tam ben" hissi, kısa ve net). **Bora spor yapmaz** (mekik çekmez); mekik takvim/sayıyla, kasın şişmesi karnın kesit
  animasyonuyla (üstte yağ hücreleri, altta kas lifleri) gösterilir. Döngü: son cümle "Çünkü bu…" → kanca karesi (son kare = ilk kare).
  `CurlyGuy`'a `belly` (göbek 0-1) eklendi. Metin `icerik/gobek-yagi.seslendirme.txt`. Sessiz taslak onaylandı →
  **Manitam** ile seslendirildi (eleven_v4, tr, 0.4/0.35/1.05; ~640 karakter) → `public/audio/gobek-yagi` 45.2 sn çıktı
  (Manitam yavaş konuşuyor) → kredi harcamadan sadece sessizlikler kısaltıldı (`sikistir-ses.py --max-pause 0.28`, hız yok)
  → `gobek-yagi-kisa` (41.5 sn, video 42 sn). Daha kısa istenirse metni kısaltıp yeniden seslendir (onay al).
  Son: `out/gobek-yagi-paylas.mp4` (-14 LUFS). Döngü geçişinde iki sahne üst üste binmesin (önce söner, sonra kanca gelir).
  Geri bildirim: **"Çünkü bu…" ile yarım bitmesin** → son cümle "…birine gönder." ile tamamlanır (ses sonundan kesildi:
  `gobek-yagi-son`, 40.5 sn; kredi yok), ~0.6 sn bekler, sonra görüntü kancaya döner. **Müzik daha kısık** (0.03).
  Genel: döngü videolarında konuşma yarım cümleyle bitmesin; döngüyü görüntüyle kur.
  Kullanıcı **"mit" kelimesini sevmedi** (İngilizce "meet" gibi duruyor) → "Bölgesel yağ yakımı… olası bir şey değil.",
  damga "OLASI DEĞİL". Genel: yabancı kökenli/İngilizce gibi duyulan terimler yerine gündelik Türkçe kullan.
  Yeniden seslendirildi (Manitam, speed 1.08, ~690 karakter) → `gobek-yagi-v2` 43.8 sn → sessizlik kısaltma →
  `gobek-yagi-v2-kisa` 39.2 sn (video 40 sn, `GY_TAIL` 0.8).

- **BeslenmeSpor** — "Beslenmene dikkat etmeden spor yaparsan ne olur?" (~39 sn). Kahraman Bora'nın tarzında sporcu genç
  (`CurlyGuy` + `SPORCU_LOOK`: koyu kıvırcık saç, kırmızı eşofman ceketi; Bora spor yapmaz).
  1. taslak (düz anlatım) yerine kullanıcı **örnek video** gösterdi (Voom "Mekik çekerek göbek erir mi?": izleyicinin kendi
  sorusuyla kanca, beynin komut merkezinde iki görevlinin diyaloğu "yağları yakın!" → "yetkimiz yok", "varsayımsal benzetme"
  etiketi, her bölüme kısa başlık, sakin anlatım, soruyla başa dönen döngü) → **anlatım böyle hikâyeleştirilsin; kopya değil, kendi
  benzetmemiz.** v2: kanca soru "Her gün antrenman yapıyorum… neden hâlâ kas yapamıyorum?" → dambıl yaparken pazıya dalış →
  liflerde hasar → **baretli tamir ekibi** (`Crew`, iki hücre) mesajı alır "Kol kası hasarlı! Hemen onarın…" → "Şefim, malzeme
  gelmedi. Protein yok, enerji yok, uyku yok." (boş MALZEME kasası, omuz silkme) → 3 kart (protein/enerji/uyku) → evde öğün
  atlama + TAMİR %34 → "daha çok ≠ daha iyi" çubukları → "kas salonda yorulur… sofrada ve yatakta büyür" (kasa dolar, ekip çalışır,
  lifler kalınlaşır) → "bunu ona gönder" → kanca (döngü). Diyalog altyazıları açık mavi (`QUOTE`).
  Metin `icerik/beslenme-spor.seslendirme.txt`. Sessiz taslak onaylandı → kullanıcı **Manitam'ı %15 hızlı** istedi →
  ElevenLabs'te doğrudan `--speed 1.15` ile seslendirildi (sonradan hızlandırma yok; eleven_v4, tr, 0.4/0.35/1.15) →
  `public/audio/beslenme-spor` 41.7 sn → sessizlikler kısaltıldı (`sikistir-ses.py --max-pause 0.28`) → `beslenme-spor-kisa`
  39.0 sn → kullanıcı **"Manitam ElevenLabs'te tam %15 hızlı, toplam 35 sn, aradaki boşlukları kes"** dedi (ek hız yok) →
  `--max-pause 0.06` (tempo yok) → `beslenme-spor-35` 34.55 sn (`BS_TAIL` 0.5, video ~35 sn). Son: `out/beslenme-spor-paylas.mp4` (-14 LUFS). Kullanıcı kuralı: **en fazla 35 sn.**

- **BeslenmeSpor3** — aynı konunun v3'ü (kullanıcı "anlatım daha güzel olsun" dedi, önerilerimizi onayladı): ders anlatır gibi
  tekrar eden cümle ("onarım için üç şey lazım") atıldı; **ters köşe kanca** "Salonda kas yapmıyorsun. Kas, salondan çıkınca
  yapılıyor."; tamir ekibi **karşılıklı konuşur** (çırak sarı baret, şef beyaz baret + bıyık, `chief`): "Şefim, kol kası yine
  hasarlı!" / "Malzeme ne durumda?" / "Kahvaltı atlanmış, öğlen bir poğaça… adam gece üçte yatmış." (GÜNLÜK RAPOR kartı:
  boş tabak ✕, poğaça, 03:00 saat) / "Tamam, bugün de tamir yok." → ayna (haftalar, HÂLÂ AYNI) → "Kas salonda yorulur… sofrada
  ve yatakta büyür." → gönder → döngü. Ders: **yerel, gündelik detay (poğaça, gece üç) "tam ben" hissi ve yorum getirir; diyalog
  tek kişiden iyi; komik anlarda nefes payı.** Metin `icerik/beslenme-spor-v3.seslendirme.txt` (~430 karakter), ortak parçalar
  `BeslenmeSpor.tsx`'ten export. Sessiz taslak `out/beslenme-spor-v3-sessiz.mp4`; onay gelince Manitam %15 hızlı (speed 1.15)
  seslendirilecek, en fazla 35 sn.

- **BeslenmeSpor4** — v3 sonrası kullanıcı: **"seslendirme olmadan da görüntüye bakarak anlamalıyım"** → GENEL KURAL: hikâyeyi
  altyazı/etiket değil görüntü anlatsın (ses kapalı izleyen de anlamalı). v4: ters köşe kanca → pazıya dalış (köşede büyüteçli
  mini genç "PAZI"), liflerde YIRTIK → tamir ekibi çalışır, yol boş "MALZEME ?" → **kötü gün 3 panel** (SABAH: esneyen genç + kahve
  + boş tabak 08:00 ✕; ÖĞLE: tek poğaça ✕; GECE: telefon 03:00 ✕) → **malzeme kamyonu BOŞ gelir** (`Truck`), ekip omuz silker,
  TAMİR YOK → ayna 8. HAFTA HÂLÂ AYNI → **iyi gün 3 panel** (yumurtalı kahvaltı ✓, dolu tabak ✓, 23:00 uyku z z ✓) → kamyon DOLU,
  malzeme kasa akar, lifler kalınlaşır, KAS BÜYÜYOR → ayna 12. HAFTA, pazı belirgin (`Bulge`: üst kol kalınlaşır), FARK VAR →
  gönder → döngü. Metin `icerik/beslenme-spor-v4.seslendirme.txt`. Sessiz taslak `out/beslenme-spor-v4-sessiz.mp4`; onay gelince
  Manitam %15 hızlı (speed 1.15), en fazla 35 sn.

- **BeslenmeSpor5** — v4 de beğenilmedi: "kamyonet çizgi film gibi, okumadan/ses olmadan amaç anlaşılmıyor; örnek videodaki gibi
  vücudun içine girip göstersin, acıya dokunsun". **DERS: benzetme/çizgi film metaforu (kamyon, tamir ekibi) değil, gerçek fizyoloji
  şeması; örnek videonun görsel dili.** v5: koyu lacivert kareli fon, her satırda beyaz başlık + turkuaz el yazısı alt başlık (`TITLES`),
  sade gölgeli altyazı. Akış: 3 ay salon, mezura "1.→3. AY · 32 CM", AYNI → kola dalış, kolun kesiti (`ArmCut`: deri, yağ, pazı kası,
  kemik etiketli) → liflerde MİKRO YIRTIK → büyüteçte tek lif onarılır, DAHA KALIN → tabak → mide → kan → pazı (protein taneleri
  akar) → öğün yok: kan boş, yırtık AÇIK KALDI → uyku: 23:00→07:00 %100, 03:00→07:00 %50 → Kişi A / Kişi B aynı antrenman,
  3 ay sonra A 36 cm (pazı büyür) B 32 cm → "Kas salonda yorulur… sofrada ve yatakta büyür." → gönder → döngü.
  Metin `icerik/beslenme-spor-v5.seslendirme.txt`. Sessiz taslak onaylandı → Manitam %15 hızlı (speed 1.15; 0.4/0.35) →
  `public/audio/beslenme-spor-v5` 35.5 sn → `--max-pause 0.35` → `beslenme-spor-v5-kisa` 33.4 sn (video ~34 sn).
  Son: `out/beslenme-spor-v5-paylas.mp4` (-14 LUFS).
  Kullanıcı daha sağlam kanca istedi → seçilen: **"Spor yapıp kas yapamıyorsan… sorun salonda değil."** (başlık "Spor var, kas yok?" /
  "Sorun salonda değil."). Sadece kanca cümlesi Manitam ile okutuldu (`bs5-kanca`, ~50 karakter), eski kancanın yerine eklendi
  (`beslenme-spor-v5b`, geri kalan ses aynı) → `--max-pause 0.35` → `beslenme-spor-v5b-kisa` 33.7 sn. Son: `out/beslenme-spor-v5b-paylas.mp4`.

- **BeslenmeTekGun** — kullanıcı v5 için "çok karmaşık, anlaşılmaz; baştan düşün, bu videodan dönüştürme; basit, akıcı, herkes
  anlasın, izleyen kendini görsün, gerekirse kolun içine gir" dedi. **DERS: 30 sn'de tek fikir; çok sahne/etiket (kesit, büyüteç, akış
  şeması, çubuklar, A/B) karmaşık geliyor.** Yeni fikir **"Tek gün, iki son"**: aynı genç (sporcu, `SPORCU_LOOK`) aynı günü iki kez yaşar.
  Kanca salonda "SPOR VAR, KAS YOK?" → "SORUN SALONDA DEĞİL." → SENİN GÜNÜN: 08:00 sadece kahve ✕, 13:00 tek poğaça ✕, 18:00 salon ✓,
  03:00 telefon ✕ → ertesi sabah ayna 32 CM AYNI → saat GERİ SAR → AYNI GÜN · DOĞRU HALİ: kahvaltı ✓, dolu tabak ✓, salon ✓, 23:00
  yatakta uyku ✓ → kısa an kolun içi (yırtıklar YEMEK + UYKU ile onarılır, KAS BÜYÜYOR) → 3 AY SONRA ayna 36 CM +4 CM → gönder → döngü.
  Ekranda yazı az: bölüm etiketi + saat rozeti + büyük ✓/✕. Metin `icerik/tek-gun.seslendirme.txt` (~400 karakter, ~29 sn sessiz).
  Sessiz taslak `out/tek-gun-sessiz.mp4`; onay gelince Manitam %15 hızlı (speed 1.15), en fazla 35 sn.

- **KasNedenBuyumuyor** — beslenme/spor konusunda **kullanıcının kendi kurgusu** (birkaç senaryo sunuldu, kullanıcı kendi hikâyesini
  verdi): bir adam (SEN, kırmızı `SPORCU_LOOK`) sürekli spor yapıyor ama gelişmiyor; yanındaki (O, mavi `RIVAL_LOOK`) aynı antrenmanla
  büyüyor, SEN salonda buna şahit oluyor → "benim kasım neden büyümüyor?" (büyük ?) → iki kolun içi alt alta (`MusclePanel`:
  ONUN KOLU dolu tabak → protein akar, yırtıklar onarılır, KALINLAŞTI; SENİN KOLUN poğaça → neredeyse hiçbir şey gelmez, ONARILMADI)
  → AYNI ANTRENMAN / FARK TABAKTA (32 cm ↔ 36 cm) → "Kas salonda yorulur… sofrada büyür." → gönder → döngü (kanca "AYNI ANTRENMAN
  FARKLI SONUÇ?"). Metin `icerik/kas-neden.seslendirme.txt` (~380 karakter, ~27 sn sessiz). Sessiz taslak `out/kas-neden-sessiz.mp4`;
  onay gelince Manitam %15 hızlı (speed 1.15), en fazla 35 sn.
  Geri bildirim "idare eder; boşlukları kısalt, anlatımı hikâyeleştir" → v2: **isimli kahramanlar** EMRE (kırmızı, 6. ay, 32 cm) ve
  MERT (mavi, 2. ay, 36 cm); kanca "6 AY SALON… KOL HÂLÂ AYNI?" (Emre tek başına, sonra Mert gelir), "CEVAP KOLUN İÇİNDE",
  MERT'İN KOLU / EMRE'NİN KOLU, kapanış **"Sen hangisisin, Emre mi, Mert mi?"** (yorum sorusu). Satır beklemeleri kısa (hold 0.1-0.3);
  seslendirmede boşluklar sıkı kesilecek. Sessiz taslak `out/kas-neden-v2-sessiz.mp4`.

- **TabaginiDegistir** — kullanıcının yeni metni ("Her gün salona gidip… aynada tek bir kas çizgisi bile göremiyorsun, değil mi?" →
  "1 yılını çöpe attın" → program/ağırlık → "beslenmen tam bir felaket" → "kasların mutfakta açlıktan ölüyor" → "tuğla vermeden saray
  inşa etmeye çalışıyorsun" → "ter mutfakta yok olup gidiyor" → "ağırlıkları değil, tabağını değiştir" → "sorun antrenmanında mı,
  tabağında mı? Yorumlara yaz."). Metin neredeyse aynen (sadece "attın", "salonda döktüğün o ter"); "1" seslendirmede "Bir".
  Her cümleye tek görüntü: ayna KAS ÇİZGİSİ: 0 → 365 GÜN takvim çöpe → PROGRAM A/B/C çizilir, 20→50 KG → mutfak cips/kola/poğaça/boş
  tabak + FELAKET mührü → kasın içi solar, AÇ KALIYOR → **kasın içinde tuğla saray** (kullanıcı istedi; `Palace`: soluk hedef siluet +
  kubbe/bayrak, tuğla = protein, poğaçadan az tuğla → SARAY YARIM) → ter damlaları salondan mutfaktaki boş tabağa akıp YOK OLDU →
  dambıla ✕, TABAK DEĞİŞTİ, dolu tabaktan tuğlalar yağar, saray tamam → "ANTRENMAN mı? TABAK mı?" kartları + YORUMLARA YAZ → döngü.
  Metin `icerik/tabagini-degistir.seslendirme.txt` (~600 karakter; %15 hızlı Manitam ile ~38 sn ham → boşluklar kesilip ≤35 sn).
  Sessiz taslak `out/tabagini-degistir-sessiz.mp4`.
  Geri bildirim: **"görselde çok zayıfsın"** — pembe kutudaki tuğla duvar/saray **çok saçma** bulundu; kanca çarpıcı olmalı, acıya
  dokunmalı, **her saniye hareket** olsun ki sıkılmasın. v2: kanca ilk karede dev "365 GÜN ANTRENMAN" / kırmızı "0 KAS ÇİZGİSİ"
  (arkada silik genç dambıl çalışır), "aynada" kelimesinde ayna sahnesi; tuğlalar artık **kasılmış kolun içinde pazıyı örüyor**
  (`BrickArm`: soluk hedef pazı silueti, poğaçadan az tuğla → KAS YARIM KALDI; tabak değişince tuğlalar yağar → KAS TAMAMLANDI);
  her satırda kamera yavaşça yaklaşır (`push`). DERS: soyut kutu/oyun ekranı gibi görseller yerine benzetmeyi doğrudan vücut
  üzerinde göster. Sessiz taslak `out/tabagini-degistir-sessiz-v2.mp4`.
  Geri bildirim: **"kas çizgisi" çok saçma/zayıf**, karakter kolunu gösterip hiçbir şey yapmıyor; **ses olmadan anlam katmalı, izleyeni
  tutmalı; gerekirse elinde dambılla çalışsın; göndermeden önce "bunu izler miyim, sıkılır mıyım?" diye kendine sor; 12 maddelik
  listeyi tik atıp gönder.** v3: kanca aynada dambıl çalışan genç + aynaya yapıştırılmış **HEDEF fotoğrafı** (kocaman pazı, `GoalPhoto`),
  "12 AY ANTRENMAN / SONUÇ: SIFIR" → "aynada" kelimesinde durup kolunu kasar: "HEDEF BU… AYNADAKİ BU", HİÇ DEĞİŞMEDİ. Seslendirme
  1. cümle "…aynada hiçbir değişiklik göremiyorsun, değil mi?" ("kas çizgisi" çıkarıldı). Mutfakta genç poğaça yiyerek durur.
  Sessiz taslak `out/tabagini-degistir-sessiz-v3.mp4`.
  Göndermeden önce "izler miyim?" kontrolüyle düzeltildi: "kas açlıktan ölüyor" sahnesindeki pembe kutu kaldırıldı → aynı tuğlalı kol,
  boş tabak ✕, tuğlalar teker teker kaybolur (KAS ERİYOR); kapanış kartları nabız gibi atar, aralarında düşünen genç bir karta bir
  ötekine bakar. Sessiz taslak `out/tabagini-degistir-sessiz-v4.mp4`.
  Sessiz taslak onaylandı → Manitam %15 hızlı (speed 1.15; 0.4/0.35) → `public/audio/tabagini-degistir` 38.2 sn →
  `--max-pause 0.12` → `tabagini-degistir-kisa` 33.5 sn (video ~34 sn). Son: `out/tabagini-degistir-paylas.mp4` (-14 LUFS).
  1. efekt denemesi (dambıl şıngırtısı, duvar saati, buzdolabı uğultusu, gerilim, art arda bas vuruşlar) **"saçma ve kötü"** bulundu →
  sadece **ekrandaki nesnenin gerçek sesi**, olay anında, kısık (Mixkit, `public/sfx`): kanca bas 2299 (tek), "değişiklik"te tek kalp
  atışı 490, takvim buruşur 2996, program çizgileri kalem 2998, mutfakta kola kutusu açılır 116, FELAKET mührü 2182, kolun içi 1143,
  KAS ERİYOR derin vuruş 498, ter damlaları tabağa düştükçe damla 3179 (damla animasyonuna senkron), dolu tabak konur 2933, tuğlalar
  dökülür 388, kas tamam 1120, yorumlara yaz 2568. DERS: soyut/tekrar eden vuruş ve ortam sesi yerine görünen nesnenin sesi.
  2. geri bildirim: efektlerde **"güm" (alçak bas vuruş: 2299, 490, 1143, 498) ve "sis" (hışırtı: kalem 2998, damla 3179, kola 116,
  tuğla 388) sesleri kulağa hoş gelmedi** → hepsi silindi; sadece 4 olay anı: FELAKET mührü 2182, dolu tabak 2933, kas büyüdü 1120,
  yorumlara yaz 2568 (kısa, orta frekans). GENEL: alçak "güm" ve hışırtılı efekt kullanma; az ve temiz.
  Kullanıcı isteği: takvim çöpe düşünce minik ses → kapak kapanırken plastik tık 486 (Mixkit "Plastic CD cover close").
  Görsel: tuğla/kırmızı çubuk kol "çok zayıf" → `MuscleView` (anatomik kol kesiti: kemik, tendonlar, pazı kası lif demetleri çizgili,
  mikro yırtıklar, tabaktan gelen kan damarı, protein = renkli amino asit zinciri). Aç kalınca protein kastan sökülüp gider, kas
  küçülür ve solar (KAS ERİYOR); poğaçayla az protein, yırtıkların çeyreği kapanır (KAS YARIM KALDI, hedef kesikli siluet); tabak
  değişince protein akar, yırtıklar kapanır, kas hedefe büyür (KAS BÜYÜDÜ). Ter sahnesi: üst yarı salon, alt yarı mutfak; ter boş
  tabağa düşüp buhar olur. Son: `out/tabagini-degistir-v2-paylas.mp4`.

## Son durum (yeni oturumda buradan devam)

- **Bora artık `CurlyGuy` (kıvırcık saç, gözlük, koyu kuzu yünü ceket, bej fon).** CurlyGuy'a pozlar eklendi (`pose.r/l` kol: dirsek/bilek,
  el fist/point/thumb/open, elde `item`; `expr`: neutral/smile/grin/chew/surprise/think/ouch/yawn/happy/laugh; `head`), tablo **KivircikPozlar**.
  **GeceYemek v2 (35 sn kuralı):** kısa metin `icerik/gece-yemek-v2.seslendirme.txt` (Chris, ~500 karakter) → `public/audio/gece-yemek-v2`
  (~36.7 sn video). **Fon rengi sahneye göre değişir** (kullanıcı isteği; `SCENE_BG`: gece mutfak akşam mavisi, cevap açık gök mavisi (sarı istenmedi), terazi mint, yatak odası lavanta, atıştırmalık taze yeşil, özet krem, kapanış şeftali; geçişte yumuşak renk kayması). Müzik seviyesi 0.04 (sonda 0.09) — 0.06 "çok yüksek", 0.025 "çok kısık" bulundu. Sahne geçişleri üst üste binmeden (önce söner, sonra gelir).
  **GeceYemekBora** artık kıvırcık Bora ile (`hero: "kivircik"`, bej fon) — kullanıcı "bununla devam" dedi. Render → `out/gece-yemek-bora-paylas.mp4`.
- Son iş: **GeceYemekBora** — yandan, pozlanabilir Bora (`src/avatar/BoraYan.tsx`; açık buğday ten, **pembe örgü kazak + mavi kareli pantolon + mavi bere** (kullanıcının Pinterest görseli), bej fon; ayrıntı
  `icerik/bora-karakter.md`). Aynı ses/akış (43 sn). Render: `npx remotion render GeceYemekBora out/gece-yemek-bora.mp4 ...` → -14 LUFS.
- Son iş: **GeceYemek** (turkuaz, sadece genç) sesli + müzikli. Ses kayıtlı — yeniden seslendirme gerekmez.
  Render: `npx remotion render GeceYemek out/gece-yemek-sesli.mp4 --concurrency=4 --browser-executable=...` → -14 LUFS kopya.
- Son iş: **BoyUzama** — sesli + müzikli (~68 sn). Ses hazır ve kayıtlı (`public/audio/boy-uzama.*`, Chris) —
  yeniden seslendirme gerekmez. Render: `npx remotion render BoyUzama out/boy-uzama-sesli.mp4 --concurrency=4
  --browser-executable=...` (~10 dk), ardından -14 LUFS paylaşım kopyası `out/boy-uzama-paylas.mp4`.
  Müzik `public/music/623.mp3` git'te yok (curl ile indir).
- Önceki iş (kullanıcı sonlandırdı, devam yok): **IsinmaKas** v4 (kas Arman, sporcu Chris, müzik Deep Urban): render `--props='{"music":null}'` → müzik ffmpeg ile karıştırılır (IsinmaKas notlarındaki komut, 1076 yerine 623).
- Önceki iş: **WilmaRudolph** (render: `npx remotion render WilmaRudolph out/wilma-rudolph.mp4 --concurrency=4 --browser-executable=...`, sonra -14 LUFS kopya).
- Önceki iş: **KasAgrisiToon** (karikatür kas ağrısı, sesli). Ses hazır ve kayıtlı (`public/audio/kas-agrisi.*`) —
  yeniden seslendirme gerekmez, kredi harcama. Render:
  `npx remotion render KasAgrisiToon out/kas-agrisi-sesli.mp4 --concurrency=4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  ardından -14 LUFS paylaşım kopyası (İş akışı 4. adım). Müzik `public/music/623.mp3` git'te yok:
  `curl -o public/music/623.mp3 https://assets.mixkit.co/music/623/623.mp3`.
- Render ~25-30 dk sürer (SVG gren filtresi yavaş); arka planda çalıştır.

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
- ElevenLabs hesabı Ekim 2026'dan beri **Starter** planda (aylık ~30.000 karakter): kütüphanedeki Türk sesler API'den
  kullanılabilir (`POST /v1/voices/add/<public_owner_id>/<voice_id>` ile hesaba eklenir).
  Kullanıcının **beğendiği anlatıcı sesi: "Chris"** (`iP95p4xoKVk53GoZ742B`, eleven_v4,
  `--language tr --stability 0.3 --style 0.45 --speed 1.05`; BoyUzama) — tek anlatıcılı yeni videolarda bunu öner.
  Türkçe sesler: "Gökçe Deniz" (oPC5I9GKjMReiaM29gjY), "Arman Yılmazkurt" (qUGjOGoUuQBTUqwY8n0e; IsinmaKas).
  Eski videolarda hazır ses "Sarah" (EXAVITQu4vr4xnSDxMaL) kullanıldı.
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
