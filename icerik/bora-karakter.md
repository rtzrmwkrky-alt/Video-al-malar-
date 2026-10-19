# Bora — kanal karakteri

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
