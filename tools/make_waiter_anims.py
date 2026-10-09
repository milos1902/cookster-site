#!/usr/bin/env python3
"""Cuts the video of the waiter (three copies on pure green: from behind | in profile facing right | in profile facing left, made from
assets/tavern/waiter/walku24/f01.webp and waiter_writes1.webp, 1280x720) into frames for the game.
Usage: make_waiter_anims.py VIDEO      Writes assets/tavern/waiter/anim/wait_NNN.webp ("ceka": waits from behind) and write_NNN.webp ("pise": writes, facing right;
the game mirrors it for the left) and anim.json. The frames are given relative to the 640x470 pictures of the waiter (the pictures of the walks)."""
import json, os, re, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.7; CHROMA='chromakey=0x00ff00:0.22:0.08,despill=type=green'
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=os.path.join(REPO,'assets/tavern/waiter/anim')
# name, video x of the sprite's trimmed picture, y, trimmed box of the source picture in its 640x470 canvas (w,h,x,y), mirrored?
CELLS=[('wait',110,70,(216,454,210,16)),('write',498,70,(211,448,247,22))]
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout
video=sys.argv[1]; tmp=tempfile.mkdtemp(prefix='wa_'); os.makedirs(OUT,exist_ok=True)
vw=int(run('ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width','-of','csv=p=0',video).split()[0]); V=vw/1280.0
run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,%d))',%s,format=rgba"%(round(30/FPS),CHROMA),'-vsync','0',tmp+'/f%04d.png')
frames=sorted(glob.glob(tmp+'/f*.png')); meta={}
def dist(a,b):
    r=subprocess.run(['compare','-metric','RMSE',a,b,'null:'],capture_output=True,text=True).stderr
    m=re.search(r'\(([0-9.eE+-]+)\)',r); return float(m.group(1)) if m else 0.0
for name,vx,vy,(tw,th,tx,ty) in CELLS:
    s1=600.0/th                                           # the picture was made 600 high: video pixels (at 1280 wide) per canvas pixel
    k=s1*V                                                # video pixels (real) per canvas pixel
    # the region around the sprite that is cut (room for the hand that scratches the head and for the notebook)
    L,T,R,B=tx-110,ty-60,tx+tw+110,ty+th+6                # canvas pixels
    d=tmp+'/'+name; os.makedirs(d)
    for n,f in enumerate(frames):
        cx=(vx*V)+(L-tx)*k; cy=(vy*V)+(T-ty)*k
        run('convert',f,'-crop','%dx%d+%d+%d'%(round((R-L)*k),round((B-T)*k),round(cx),round(cy)),'+repage','-filter','Lanczos','-resize','%d%%'%round(100*STORE/k),'%s/%04d.png'%(d,n))
    bb=run('convert',*sorted(glob.glob(d+'/*.png')),'-alpha','extract','-evaluate-sequence','max','-threshold','10%','-format','%@','info:').strip()
    for old in glob.glob('%s/%s_*.webp'%(OUT,name)): os.remove(old)
    out=['%s/%s_%03d.webp'%(OUT,name,n) for n in range(len(frames))]
    for n in range(len(frames)):
        run('convert','%s/%04d.png'%(d,n),'-crop',bb,'+repage','-define','webp:alpha-quality=90','-quality','76',out[n])
    N=len(frames); dd=[dist(out[0],out[i]) for i in range(N)]
    mv=[dist(out[i],out[i+1]) for i in range(N-1)]
    K=max(1,round(N/FPS/2.5)); cuts=[0]
    for j in range(1,K):
        c=round(j*N/K); w=range(max(cuts[-1]+4,c-6),min(N-4,c+7))
        if len(w): cuts.append(min(w,key=lambda i:mv[i]))
    cuts.append(N); segs=[[cuts[i],cuts[i+1]] for i in range(len(cuts)-1)]
    w,h,x,y=[int(v) for v in bb.replace('x','+').split('+')][:4]
    meta[name]={'n':N,'fps':FPS,'segs':segs,'w':round(w/STORE,1),'h':round(h/STORE,1),'ox':round(L+x/STORE,1),'oy':round(T+y/STORE,1)}
    print(name,N,segs,bb)
json.dump(meta,open(os.path.join(OUT,'anim.json'),'w'),indent=1); shutil.rmtree(tmp)
