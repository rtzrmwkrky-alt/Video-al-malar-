# Bora — kanal karakteri

Kullanıcı "Bora" dediğinde bu karakter kastedilir: o videoda ana karakter / anlatıcı Bora'dır.

## Görünüm (değişmez)
- Keçe/örgü dokulu, yumuşak ışıklı 3B oyuncak figür tarzı (Pinterest örgü referansı).
- Genç erkek, koyu ten, uzun ince boyun, ifadeli gözler.
- Turuncu kapüşonlu sweatshirt, yanında beyaz şerit olan gri eşofman altı, siyah örgü bere, beyaz spor ayakkabı.
- Zemin: düz tek renk (varsayılan turkuaz), başka eşya yok. Dikey 9:16.
- Kıyafet seçimi çizimi: `src/avatar/KnitGuy.tsx` (`KNIT_OUTFITS[1]` "Sporcu").

## Üretim
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
