#!/usr/bin/env python3
"""Cuts a video of four seated guests on a green background into one frame sequence per guest.
The video is made from a 1024x1024 picture on pure green: the sprites g??_sedi_lice.webp, each resized to fit 450x450 and put into its quarter
(offsets below). Usage:  make_guest_anims.py VIDEO NAME G1 G2 G3 G4   (G1..G4: guest numbers, order: top left, top right, bottom left, bottom right)
Writes assets/tavern/guests/anim/gNN_NAME_000.webp ... and merges the sizes into assets/tavern/guests/anim/anim.json.
The frames are stored at STORE of the size of the sprite pictures and cropped to the part that moves (the frame position is given relative to the sprite)."""
import json, os, re, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.65; CHROMA='chromakey=0x00ff00:0.22:0.08,despill=type=green'
OFFS=[(30,60),(545,60),(30,560),(545,560)]          # where the resized sprite was put on the 1024 picture (top left)
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GU=os.path.join(REPO,'assets/tavern/guests'); OUT=os.path.join(GU,'anim')
def run(*a):
    return subprocess.run(a,check=True,capture_output=True,text=True).stdout
def ident(p):
    w,h=run('identify','-format','%w %h',p).split(); return int(w),int(h)
video,name=sys.argv[1],sys.argv[2]; guests=[int(x) for x in sys.argv[3:7]]
tmp=tempfile.mkdtemp(prefix='ga_'); os.makedirs(OUT,exist_ok=True)
vw=int(run('ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width','-of','csv=p=0',video).split()[0]); V=vw/1024.0
run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,%d))',%s,format=rgba"%(round(30/FPS),CHROMA),'-vsync','0',tmp+'/f%04d.png')
frames=sorted(glob.glob(tmp+'/f*.png')); meta_p=os.path.join(OUT,'anim.json')
meta=json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for i,g in enumerate(guests):
    gid='g%02d'%g; sw,sh=ident(os.path.join(GU,gid+'_sedi_lice.webp'))
    sc=min(450/sw,450/sh); k=sc*V                        # video pixels per sprite pixel
    ox,oy=OFFS[i]; qx,qy=(i%2)*vw/2,(i//2)*vw/2          # the quarter
    sx,sy=(ox*V-qx)/k,(oy*V-qy)/k                         # the sprite's top left, in sprite pixels, inside the quarter
    # the part of the quarter that is cut: the sprite and some room for the hand and the head
    L,T,R,B=max(0,sx-70),max(0,sy-120),min(vw/2/k,sx+sw+70),sy+sh+6
    d=tmp+'/c%d'%i; os.makedirs(d)
    for n,f in enumerate(frames):
        run('convert',f,'-crop','%dx%d+%d+%d'%(round((R-L)*k),round((B-T)*k),round(qx+L*k),round(qy+T*k)),'+repage','-filter','Lanczos','-resize','%d%%'%round(100*STORE/k),'%s/%04d.png'%(d,n))
    # the union of what is not transparent, in all the frames: that is the picture that is stored
    bb=run('convert',*sorted(glob.glob(d+'/*.png')),'-alpha','extract','-evaluate-sequence','max','-threshold','10%','-format','%@','info:').strip()
    out=['%s/%s_%s_%03d.webp'%(OUT,gid,name,n) for n in range(len(frames))]
    for n in range(len(frames)):
        run('convert','%s/%04d.png'%(d,n),'-crop',bb,'+repage','-define','webp:alpha-quality=90','-quality','76',out[n])
    # how far every picture is from the first one (= the still guest): the end of the film is where the guest is nearest to the still picture
    def dist(a,b):
        r=subprocess.run(['compare','-metric','RMSE',a,b,'null:'],capture_output=True,text=True).stderr
        m=re.search(r'\(([0-9.eE+-]+)\)',r); return float(m.group(1)) if m else 0.0
    N=len(frames); dd=[dist(out[0],out[i]) for i in range(N)]; dmax=max(dd) or 1
    lo=max(10,int(N*.55)); end=min(range(lo,N),key=lambda i:(dd[i],-i))
    n=end+1
    # the film is cut into short parts (about 2.5 s each) at the places where the guest is calm (little change between two pictures), so the game can play
    # one part now and another part later; the first part is what a guest who sits alone gets
    mv=[dist(out[i],out[i+1]) for i in range(n-1)]
    K=max(1,round(n/FPS/2.5)); cuts=[0]
    for j in range(1,K):
        c=round(j*n/K); w=range(max(cuts[-1]+4,c-6),min(n-4,c+7))
        if len(w): cuts.append(min(w,key=lambda i:mv[i]))
    cuts.append(n); segs=[[cuts[i],cuts[i+1]] for i in range(len(cuts)-1)]
    for i in range(n,N):
        if os.path.exists(out[i]): os.remove(out[i])
    for old in glob.glob('%s/%s_%s_*.webp'%(OUT,gid,name)):
        if int(old[-8:-5])>=n: os.remove(old)
    w,h,x,y=[int(v) for v in bb.replace('x','+').split('+')][:4]
    # position of the stored picture relative to the sprite's top left (in sprite pixels) and its size (in sprite pixels)
    meta.setdefault(gid,{})[name]={'n':n,'fps':FPS,'segs':segs,'w':round(w/STORE,1),'h':round(h/STORE,1),'ox':round(L+x/STORE-sx,1),'oy':round(T+y/STORE-sy,1)}
    print(gid,name,'frames',N,'->',n,'parts',segs,bb)
json.dump(meta,open(meta_p,'w'),indent=1)
shutil.rmtree(tmp)
