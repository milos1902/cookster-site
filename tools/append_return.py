#!/usr/bin/env python3
"""Appends a "return" film (3 s: from the last picture of a film back to the still picture, made in Higgsfield with start = last picture, end = the still)
to an existing guest film. Usage: append_return.py VIDEO NAME G1 G2 G3 G4   (same quarters as make_guest_anims.py; NAME e.g. doziv)
The new pictures are cut exactly like the old ones (same crop and size, from anim.json), appended after the last one, and the film becomes one part (segs [[0,n]]).
Little pieces of the neighbouring characters that touch the border of the cut picture are erased (see clean())."""
import json, os, re, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.65; CHROMA='chromakey=0x00ff00:0.22:0.08,despill=type=green'
OFFS=[(30,60),(545,60),(30,560),(545,560)]
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GU=os.path.join(REPO,'assets/tavern/guests'); OUT=os.path.join(GU,'anim')
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout
def clean(f):
    """erase every piece of picture that touches the border and is not joined to the biggest piece"""
    w,h=map(int,run('identify','-format','%w %h',f).split())
    out=run('convert',f,'-alpha','extract','-threshold','10%','-define','connected-components:verbose=true','-connected-components','8','null:')
    c=[]
    for l in out.splitlines():
        m=re.match(r'\s*(\d+): (\d+)x(\d+)\+(\d+)\+(\d+) [\d.,-]+ (\d+) \w+\((\d+)',l)
        if m and int(m.group(7))>100: c.append((int(m.group(6)),int(m.group(2)),int(m.group(3)),int(m.group(4)),int(m.group(5))))
    if len(c)<2: return
    big=max(c); a=['convert',f,'-alpha','set']
    for t in c:
        if t is big: continue
        _,tw,th,tx,ty=t
        if (tx<=0 or tx+tw>=w or ty<=0 or ty+th>=h):
            a+=['-region','%dx%d+%d+%d'%(tw,th,tx,ty),'-alpha','transparent','+region']
    if len(a)>4: run(*a,'-define','webp:alpha-quality=90','-quality','76',f)
if __name__=='__main__':
    video,name=sys.argv[1],sys.argv[2]; guests=[int(a) for a in sys.argv[3:7]]
    tmp=tempfile.mkdtemp(prefix='ar_')
    vw=int(run('ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width','-of','csv=p=0',video).split()[0]); V=vw/1024.0
    run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,3))',%s,format=rgba"%CHROMA,'-vsync','0',tmp+'/f%04d.png')
    frames=sorted(glob.glob(tmp+'/f*.png')); meta_p=os.path.join(OUT,'anim.json'); meta=json.load(open(meta_p))
    for i,g in enumerate(guests):
        gid='g%02d'%g; m=meta[gid][name]; n0=m['n']
        sw,sh=map(int,run('identify','-format','%w %h',os.path.join(GU,gid+'_sedi_lice.webp')).split())
        sc=min(450/sw,450/sh); k=sc*V
        W,H=[int(v) for v in run('identify','-format','%w %h',os.path.join(OUT,'%s_%s_000.webp'%(gid,name))).split()]
        x=OFFS[i][0]*V+m['ox']*k; y=OFFS[i][1]*V+m['oy']*k
        for j,f in enumerate(frames):
            run('convert',f,'-crop','%dx%d+%d+%d'%(round(m['w']*k),round(m['h']*k),round(x),round(y)),'+repage','-filter','Lanczos','-resize','%dx%d!'%(W,H),'-define','webp:alpha-quality=90','-quality','76','%s/%s_%s_%03d.webp'%(OUT,gid,name,n0+j))
            clean('%s/%s_%s_%03d.webp'%(OUT,gid,name,n0+j))
        m['n']=n0+len(frames); m['segs']=[[0,m['n']]]
        print(gid,name,n0,'->',m['n'])
    json.dump(meta,open(meta_p,'w'),indent=1); shutil.rmtree(tmp)
