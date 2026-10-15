# Stok video kaynakları

Tüm klipler **Mixkit** (mixkit.co) — ücretsiz, ticari kullanıma uygun lisans
(Mixkit Stock Video Free License; ham haliyle tekrar dağıtılamaz, videoda kullanılabilir).

İndirme (dosyalar `public/stock/<id>.mp4`, git'e eklenmez):

```bash
cd public/stock
for i in <id listesi>; do
  curl -sS -o $i.mp4 https://assets.mixkit.co/videos/$i/$i-1080.mp4   # yoksa -720
done
```

Arama: `https://mixkit.co/free-stock-video/<kelime>/` (ör. squat, pilates, treadmill).
Önizleme: `https://assets.mixkit.co/videos/<id>/<id>-360.mp4`

## "Her kafadan bir ses" (HerkesBaskaDiyorGercek)

| id | içerik | kullanım |
|---|---|---|
| 52107 | Siyah kıyafetli kadın, yakın plan (kahraman) | açılış + kapanış |
| 24305 | Koç squat yaptıran kadını izliyor | "önce kardiyo yap" diyen |
| 42899 | Evde küçük dambıllı kadın | "hafif ağırlık" diyen / hafif |
| 48548 | Pilates eğitmeni talimat veriyor | "pilates her şeyi çözer" diyen |
| 15776 | Düşünen kadın yakın plan | "hangisi doğru?" |
| 52127 / 52128 | Koşan / yorulup duran kadın | önce koşarsan |
| 52106 | Kahraman squat (yavaş, kırmızı ton) | yorgun bacak |
| 44434 | Kadın barbell ile squat | hedef güç |
| 32807 | Pistte koşan kadın (dikey) | hedef koşu |
| 52109 | Kahraman ağır dambıl | ağır |
| 12794 | Makinede zorlanan kadın | son tekrarlar |
| 52094 | Ağır barbell | güç için ağır yük |
| 48552 | Pilates reformer | karın + duruş |
| 50965 | Kondisyon bisikleti | kalp için kardiyo |
| 52111 | Kahraman dambıl press | daha fazla yük |
| 48556 | Pilates grubu (soluk) | "başkaları" |
| 52117 | Kahraman geniş salonda yalnız | senin vücudun |
| 21273, 44438, 52116, 52115, 52110, 52108 ... | yedek (aynı seri / squat) | — |

## Müzik

| id | ad | kullanım |
|---|---|---|
| 623 | Deep Urban (Eugenio Mininni, House) | HerKafadanAkici — giriş: parçanın 99. sn'si, ana: 0. sn; bas girişi 15.35 sn |

İndirme: `curl -o public/music/623.mp3 https://assets.mixkit.co/music/623/623.mp3`
(Mixkit Stock Music Free License)

## HerKafadanAkici ek klipler
52108 (burpee), 52110 (lunge), 52116 (squat), 32019, 48564, 44432, 47462, 47877
