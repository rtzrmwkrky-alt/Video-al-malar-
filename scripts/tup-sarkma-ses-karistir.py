"""TupMideSarkma: videoyu yeniden çizmeden müziği ekler (örnek videonun kendi müziği, enerjik ve inişli çıkışlı).
Müzik konuşma aralarında yükselir, konuşmanın altında belirgin ama konuşmayı bastırmadan iner (sidechain, ratio 4).
Kullanım: python3 scripts/tup-sarkma-ses-karistir.py <müzik seviyesi, ör. 0.55> <görüntü+konuşma mp4> out/<çıktı>.mp4"""
import subprocess,sys
MV=float(sys.argv[1]); src=sys.argv[2]; out=sys.argv[3]
T=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True,check=True).stdout)
fc=';'.join([
 '[0:a]asplit=2[v][key]',
 f'[1:a]volume={MV},apad,atrim=0:{T:.3f},afade=t=in:d=0.2,afade=t=out:st={T-0.9:.3f}:d=0.8[m]',
 '[m][key]sidechaincompress=threshold=0.04:ratio=4:attack=25:release=220:makeup=1[md]',
 '[v][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]'])
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-i','public/audio/tup-sarkma-orijinal.mp3','-filter_complex',fc,
 '-map','0:v','-map','[a]','-c:v','libx264','-crf','18','-preset','slow','-maxrate','10M','-bufsize','20M','-pix_fmt','yuv420p',
 '-c:a','aac','-b:a','320k','-ar','48000','-ac','2','-movflags','+faststart',out],check=True)
