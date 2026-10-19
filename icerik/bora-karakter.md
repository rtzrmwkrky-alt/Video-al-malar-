# Bora — kanal karakteri

> **GÜNCEL (son karar):** Bora = kıvırcık kahve saçlı, iri yuvarlak siyah gözlüklü genç — `src/avatar/CurlyGuy.tsx`
> (önizleme `KivircikGenc`). İri pembe kulak ve burun, uzun ince boyun, koyu gri kuzu yünü fermuarlı ceket, krem örgü
> kazak, çapraz çanta askısı, koyu gri dar pantolon (katlı paça), turuncu bilekli spor ayakkabı, bej zemin.
> Kullanıcı "Bora" dediğinde bu karakter kullanılır. Aşağıdaki eski notlar önceki denemelere aittir.


Kullanıcı "Bora" dediğinde bu karakter kastedilir: o videoda ana karakter / anlatıcı Bora'dır.

## Görünüm (değişmez)
- Keçe/örgü dokulu, yumuşak ışıklı 3B oyuncak figür tarzı (Pinterest örgü referansı).
- Genç erkek, koyu ten, uzun ince boyun, ifadeli gözler.
- Turuncu kapüşonlu sweatshirt, yanında beyaz şerit olan gri eşofman altı, siyah örgü bere, beyaz spor ayakkabı.
- Zemin: düz tek renk (varsayılan turkuaz), başka eşya yok. Dikey 9:16.
- Kıyafet seçimi çizimi: `src/avatar/KnitGuy.tsx` (`KNIT_OUTFITS[1]` "Sporcu").

## Kodla çizilmiş Bora (kullanıcı "sen üret" dedi)
`src/avatar/Bora.tsx` — önden, keçe dokusu filtresi; `pose` (pocket/cheeks/point/tired/cheer/phone/dumbbell),
`expr` (smile/talk/surprised/tired/happy/smug), `talk`, `blink`. Tanıtım: **BoraTanitim** (`out/bora.png`, `out/bora.mp4`).
Videolarda varsayılan bu çizim kullanılır; daha gerçekçi 3B görsel istenirse (ücretli yapay zekâ aracı) önce sorulur.

## Üretim (alternatif: yapay zekâ görseli)
Görseller ChatGPT/Gemini resim aracında kullanıcı tarafından üretilir (kodla çizim bu kaliteye ulaşmıyor).
İlk resim = kimlik kartı; sonraki her sahne o resim yüklenerek "Bu karakterin aynısı, aynı kıyafet ve aynı tarz, ..." ile istenir.

### İlk tarif
> 3 boyutlu, yumuşak ışıklı, keçe ve örgü dokulu oyuncak figür tarzında bir karakter çiz: uzun ince boyunlu, koyu tenli,
> ifadeli gözlü genç bir erkek. Üzerinde turuncu kapüşonlu sweatshirt, yanında beyaz şerit olan gri eşofman altı, siyah
> örgü bere ve beyaz spor ayakkabı var. Karakter ayakta, tam boy, kameraya dönük ve hafif gülümsüyor. Arka plan düz
> turkuaz renkte, başka eşya yok. Dikey format (9:16).

### Temel ifade seti
şaşkın (eller yanakta) · elinde dambıl, emin · parmak kaldırmış anlatıyor · yorgun/esniyor · sevinçle kollar havada ·
telefona bakıp gülüyor.

## Videoya entegrasyon
Kullanıcının gönderdiği Bora resimleri `public/bora/` altına konur; sahneler cümle başlarında kesilir, hafif yakınlaşma
(push-in), altyazı, ses (tek anlatıcıda Chris önerilir) ve kısık müzik eklenir.

## Videolar
- **GeceYemek (Bora sürümü)** — mevcut ses/metin/akış aynen (43 sn, `gece-yemek-kisa`), çizilmiş genç yerine Bora.
  Arka fon **krem / açık bej** (kullanıcı turkuazı istemedi). Kullanıcıdan 8 resim istendi (düz krem zemin):
  1 sandviçle yakalanmış şaşkın · 2 eli çenesinde düşünüyor · 3 parmak kaldırmış anlatıyor · 4 elleri karnında ağrı ·
  5 esniyor yorgun · 6 elinde yoğurt + elma mutlu · 7 başparmak yukarı · 8 telefona bakıp gülüyor, göz kırpıyor.
  Resimler gelince `public/bora/gece-1..8.png`; zemin kesilip sahne nesneleri (buzdolabı, terazi, saat, yatak) etrafına çizilir.

## Kodla çizilen Bora (güncel, kullanıcı onayı: KnitGuy taslağı)
Kullanıcı yapay zekâ resmi yerine kendi taslağımızı (KnitGuy, yandan görünüm) Bora olarak seçti:
**buğday ten**, dikkat çeken spor kıyafeti (elektrik mavisi eşofman üstü + neon sarı-yeşil şeritler, siyah jogger, neon tabanlı
beyaz ayakkabı, siyah bere + neon etiket), **bej zemin**. Bileşen `src/avatar/BoraYan.tsx` (yandan; önden olan `Bora.tsx` ayrı) (pozlanabilir yakın kol, el biçimi
fist/point/thumb/open, elde nesne, ifadeler neutral/smile/grin/chew/surprise/think/ouch/yawn/happy/laugh, baş eğimi).
Poz tablosu: `BoraPozlar`. İlk video: **GeceYemekBora** (`GeceYemek` + `hero: "bora"`, bej fon), `out/gece-yemek-bora-paylas.mp4`.

## Son seçim (kıyafet)
Kullanıcı Pinterest örgü görselini gösterip "direk bu olsun" dedi → `BORA_ORGU` (BoraYan varsayılanı): pembe örgü kazak (balıkçı
yaka, örgü dokusu), mavi-krem kareli pantolon (lastikli paça), mavi bere, krem burunlu mavi ayakkabı; açık buğday ten; **fon da görseldeki mercan/somon pembesi** (`#e86d6f → #d85b5e`; kullanıcı "arka ton da bu olsun").
Önceki spor kıyafet denemeleri (mavi-neon, Retro, Yeşil vintage, basketbol/futbol/koşu/tenis) beğenilmedi / seçilmedi.

## 3B Bora (deneme)
`src/three/Bora3D.tsx` (basit geometri + canvas örgü/kareli/lastik dokuları, yumuşak gölge), deneme karesi **Bora3DDeneme**
(`out/bora-3d.png`, mercan pembe fon). Kullanıcı geri bildirimi: ten **biraz daha kapalı** (`#d39b6d`), **boyun daha kısa**.
Sonra "vücudu örnekle alakası yok" → oranlar örneğe göre: bol kutumsu kazak (lathe), uzun geniş paçalı pantolon (pantolon ≈ 1.2× kazak boyu), puf kollar, eller cepte, tıknaz kalın krem tabanlı ayakkabı, kısa boyun.
3B video kurulumu kullanıcı onayı bekliyor (~2-3 saat iş, ek ücret yok).
Kullanıcı sonra ayrıntılı tarif yapıştırdı (ilk Pinterest görselindeki esmer erkek **kesin referans**): belirgin koyu zengin
kahverengi ten (`#7d4b31`; beyazlatma yok), ince uzun oval kafa, yuvarlak belirgin burun, **çok uzun ince boyun** (önceki
"kısa boyun" isteğinin yerine geçti), küçük sade gözler, sakin nötr ifade, kobalt mavi bere, kalın örgü toz pembe bol kazak,
büyük mavi-krem kareli pijama pantolon + mavi örgü paça, beyaz burunlu/tabanlı mavi ayakkabı, uzun ince silüet, mercan pembe fon,
başka nesne/yazı yok. Bora3D buna göre güncellendi.
Kullanıcı yapay zekâ resim aracı (Apify, ücretli) önerisini reddetti: **para harcanmayacak**, 3B kodla devam. Dokular kalın örgü ilmekleri + yün lifleri, kareli yün kumaş.
