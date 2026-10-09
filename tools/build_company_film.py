#!/usr/bin/env python3
"""Builds the film of the company at the table from: the first pictures of the old film (picture 20 on), plus a 3 s intro and a 3 s return made in Higgsfield.
 intro  : start = the still table, end = picture 20 of the old film        return : start = the last picture of the old film, end = the still table
Usage: build_company_film.py INTRO.mp4 RETURN.mp4        (the old film = dr1_000 ... dr1_079, those are not changed; the result is written as dr1_000 ...: intro + old 20..79 + return)
The two Higgsfield pictures were flattened on black (the faded edges became a dark frame): that is divided out again with the alpha of the old picture 0."""
import json, os, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.8; BOX=(205,245,440,440); OLD=80; JOIN=20
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=os.path.join(REPO,'assets/tavern/company'); NAME='dr1'
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout
intro,ret=sys.argv[1:3]; tmp=tempfile.mkdtemp(prefix='cb_'); S=int(round(BOX[2]*STORE)); fe=max(4,round(S*.035))
f0=lambda i:'%s/%s_%03d.webp'%(OUT,NAME,i)
run('convert','-size','%dx%d'%(S,S),'xc:black','-fill','white','-draw','rectangle %d,%d %d,%d'%(fe,fe,S-fe-1,S-fe-1),'-blur','0x%g'%(fe/2.2),'-level','8%,92%',tmp+'/mask.png')
run('convert',f0(0),'-alpha','extract',tmp+'/a.png')
old=[tmp+'/old%03d.webp'%i for i in range(OLD)]
for i in range(OLD): shutil.copy(f0(i),old[i])
def clip(video,tag):
    os.makedirs(tmp+'/'+tag); run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,%d))',scale=%d:%d:flags=lanczos"%(round(30/FPS),S,S),'-vsync','0',tmp+'/'+tag+'/f%03d.png')
    res=[]
    for j,f in enumerate(sorted(glob.glob(tmp+'/'+tag+'/f*.png'))):
        o='%s/%s/o%03d.webp'%(tmp,tag,j)
        run('convert',f,tmp+'/a.png','-fx','u/max(v,0.15)',tmp+'/u.png')
        run('convert',tmp+'/u.png',tmp+'/mask.png','-alpha','off','-compose','copy_opacity','-composite','-define','webp:alpha-quality=80','-quality','74',o); res.append(o)
    return res
A=clip(intro,'in'); B=clip(ret,'rt')
seq=A+old[JOIN:]+B
for old_f in glob.glob('%s/%s_*.webp'%(OUT,NAME)): os.remove(old_f)
for n,f in enumerate(seq): shutil.copy(f,f0(n))
meta_p=os.path.join(OUT,'anim.json'); meta=json.load(open(meta_p)); meta[NAME]['n']=len(seq); meta[NAME]['segs']=[[0,len(seq)]]
json.dump(meta,open(meta_p,'w'),indent=1); print(NAME,len(A),'+',OLD-JOIN,'+',len(B),'=',len(seq)); shutil.rmtree(tmp)
