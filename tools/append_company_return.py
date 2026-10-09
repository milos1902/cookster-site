#!/usr/bin/env python3
"""Appends a 3 s "return" video (Higgsfield: start = the last picture of the company film, end = the first one) to the company film (make_company_anim.py).
Usage: append_company_return.py VIDEO [NAME=dr1]. Same size, same faded edges as the old pictures."""
import json, os, subprocess, sys, tempfile, glob, shutil
FPS=10; STORE=.8; BOX=(205,245,440,440)
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=os.path.join(REPO,'assets/tavern/company')
def run(*a): return subprocess.run(a,check=True,capture_output=True,text=True).stdout
video=sys.argv[1]; name=sys.argv[2] if len(sys.argv)>2 else 'dr1'
meta_p=os.path.join(OUT,'anim.json'); meta=json.load(open(meta_p)); n0=meta[name]['n']
N_OLD=int(os.environ.get('N_OLD','80')); n0=N_OLD   # the film without the return (80 pictures); running it again replaces the old return
tmp=tempfile.mkdtemp(prefix='cr_'); S=int(round(BOX[2]*STORE))
run('ffmpeg','-v','error','-y','-i',video,'-vf',"select='not(mod(n\\,%d))',scale=%d:%d:flags=lanczos"%(round(30/FPS),S,S),'-vsync','0',tmp+'/f%03d.png')
frames=sorted(glob.glob(tmp+'/f*.png'))
fe=max(4,round(S*.035))
run('convert','-size','%dx%d'%(S,S),'xc:black','-fill','white','-draw','rectangle %d,%d %d,%d'%(fe,fe,S-fe-1,S-fe-1),'-blur','0x%g'%(fe/2.2),'-level','8%,92%',tmp+'/mask.png')
# the two pictures of the Higgsfield video were flattened on black (the faded edges of the old pictures turned into a dark frame): divide that out again
run('convert','%s/%s_000.webp'%(OUT,name),'-alpha','extract',tmp+'/a.png')
for j,f in enumerate(frames):
    run('convert',f,tmp+'/a.png','-fx','u/max(v,0.15)',tmp+'/u.png'); f=tmp+'/u.png'
    run('convert',f,tmp+'/mask.png','-alpha','off','-compose','copy_opacity','-composite','-define','webp:alpha-quality=80','-quality','74','%s/%s_%03d.webp'%(OUT,name,n0+j))
meta[name]['n']=n0+len(frames); meta[name]['segs']=[[0,meta[name]['n']]]
json.dump(meta,open(meta_p,'w'),indent=1); print(name,n0,'->',meta[name]['n']); shutil.rmtree(tmp)
