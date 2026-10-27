"""SadikMusteri: videoyu yeniden çizmeden sesi yeniden karıştırır (konuşma + efektler + örnek müzik, konuşma altında hafif kısılır).
Kullanım: python3 scripts/sadik-ses-karistir.py <müzik seviyesi, ör. 0.4> out/<çıktı>.mp4  (görüntü out/sadik-musteri-paylas.mp4 dosyasından kopyalanır)"""
import json,re,subprocess,sys
MV=float(sys.argv[1]); out=sys.argv[2]
d=json.load(open('public/audio/sadik-musteri-hizli.json'))
src=open('src/compositions/SadikMusteri.tsx').read()
lines=re.findall(r'\{ text: "([^"]+)"',src)
offs=[];o=0
for l in lines: offs.append(o); o+=len(l.split())
ws=lambda i:d['words'][min(len(d['words'])-1,i)]['start']
L=lambda i:0 if i==0 else ws(offs[i])-0.06
Wt=lambda i,k:ws(offs[i]+k)
T=d['durationInSeconds']+1.15
fx=[(0,2299,.2,.05,None),(L(0)+.65,2568,.16,0,None),(Wt(1,1)-.1,2182,.2,0,None),(L(2)+.15,2568,.16,0,None),
(L(5)+.1,1120,.14,.1,None),(L(8)+.1,1120,.14,.1,None),(L(10)+.1,1120,.14,.1,None),(Wt(14,3)-.2,1143,.16,.14,1.6)]
args=['ffmpeg','-v','error','-y','-i','public/audio/sadik-musteri-hizli.mp3','-i','public/audio/sadik-orijinal.mp3']
for f in fx: args+=['-i',f'public/sfx/{f[1]}.mp3']
fc=['[0:a]volume=1.6,apad,atrim=0:%.3f,asplit=2[v][key]'%T]
names=['[v]']
for j,(at,i,v,lead,dur) in enumerate(fx):
    tr=f'atrim={lead}:{lead+dur}' if dur else f'atrim=start={lead}'
    fd=f',afade=t=out:st={dur-0.8}:d=0.8' if dur else ''
    fc.append(f'[{j+2}:a]{tr},asetpts=PTS-STARTPTS,volume={v}{fd},adelay={int(max(0,at)*1000)}:all=1[f{j}]'); names.append(f'[f{j}]')
fc.append(f'[1:a]volume={MV},apad,atrim=0:{T:.3f},afade=t=in:d=0.3,afade=t=out:st={T-0.9:.3f}:d=0.8[m]')
fc.append('[m][key]sidechaincompress=threshold=0.05:ratio=2:attack=30:release=350[md]')
names.append('[md]')
fc.append(''.join(names)+f'amix=inputs={len(names)}:duration=first:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]')
args+=['-i','out/sadik-musteri-paylas.mp4','-filter_complex',';'.join(fc),'-map',f'{len(fx)+2}:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-ac','2','-movflags','+faststart',out]
subprocess.run(args,check=True)
