#!/usr/bin/env python3
"""Makes the film of a fixed company (js/tavern-scene.js COMPANY: four guests at one table) from a video of the whole table.
The video is made from a picture of the table with the four guests, taken from the game (the crop BOX of the scene), so the table, the chairs and the guests
look as in the game; the game plays the film over that part of the scene.   Usage: make_company_anim.py VIDEO NAME
Writes assets/tavern/company/NAME_NNN.webp (the edges fade out) and adds NAME to assets/tavern/company/anim.json (position and size in scene pixels)."""
import json, os, re, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.8; BOX=(205,245,440,440)                # the part of the scene that was filmed (x, y, w, h)
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=os.path.join(REPO,'assets/tavern/company')
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout
video,name=sys.argv[1:3]
tmp=tempfile.mkdtemp(prefix='co_'); os.makedirs(OUT,exist_ok=True)
S=int(round(BOX[2]*STORE))
run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,%d))',scale=%d:%d:flags=lanczos"%(round(30/FPS),S,S),'-vsync','0',tmp+'/f%03d.png')
frames=sorted(glob.glob(tmp+'/f*.png')); N=len(frames)
fe=max(4,round(S*.035))                                  # the edges fade out (the film lies over the scene without a visible border)
run('convert','-size','%dx%d'%(S,S),'xc:black','-fill','white','-draw','rectangle %d,%d %d,%d'%(fe,fe,S-fe-1,S-fe-1),'-blur','0x%g'%(fe/2.2),'-level','8%,92%',tmp+'/mask.png')
for old in glob.glob('%s/%s_*.webp'%(OUT,name)): os.remove(old)
out=['%s/%s_%03d.webp'%(OUT,name,n) for n in range(N)]
for n,f in enumerate(frames):
    run('convert',f,tmp+'/mask.png','-alpha','off','-compose','copy_opacity','-composite','-define','webp:alpha-quality=80','-quality','74',out[n])
def dist(a,b):
    r=subprocess.run(['compare','-metric','RMSE',a,b,'null:'],capture_output=True,text=True).stderr
    m=re.search(r'\(([0-9.eE+-]+)\)',r); return float(m.group(1)) if m else 0.0
mv=[dist(out[i],out[i+1]) for i in range(N-1)]
K=max(1,round(N/FPS/3.5)); cuts=[0]
for j in range(1,K):
    c=round(j*N/K); w=range(max(cuts[-1]+6,c-8),min(N-6,c+9))
    if len(w): cuts.append(min(w,key=lambda i:mv[i]))
cuts.append(N); segs=[[cuts[i],cuts[i+1]] for i in range(len(cuts)-1)]
meta_p=os.path.join(OUT,'anim.json'); meta=json.load(open(meta_p)) if os.path.exists(meta_p) else {}
meta[name]={'n':N,'fps':FPS,'segs':segs,'w':BOX[2],'h':BOX[3],'ox':BOX[0],'oy':BOX[1]}
json.dump(meta,open(meta_p,'w'),indent=1); print(name,N,segs); shutil.rmtree(tmp)
