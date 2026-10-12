import json,numpy as np,sys
from PIL import Image,ImageDraw
S='/tmp/'   # (a folder for the cache of the measurements and the result: cutf_def.json)
R='/home/user/cookster-site/assets/tavern/guests/'
# arms.json and cutdef.json: the ARMS and CUT_DEF of js/tavern-scene.js saved as JSON (see NOTES.md)
A=json.load(open(S+'arms.json'));D=json.load(open(S+'cutdef.json'));M=json.load(open(R+'anim/anim.json'))
def comp(im,bg=(128,128,128)):
    b=Image.new('RGBA',im.size,bg+(255,));b.alpha_composite(im);return np.asarray(b.convert('RGB'),dtype=float)
def timeline(ch,film):
    g='g%02d'%ch;still=Image.open(R+g+'_sedi_lice.webp').convert('RGBA');sw,sh=still.size
    m=M[g][film];base=comp(still);masks=[]
    for poly in A[str(ch)][:2]:
        im=Image.new('L',(sw,sh),0);ImageDraw.Draw(im).polygon([(u*sw,v*sh) for u,v in poly],fill=255);masks.append(np.asarray(im)>0)
    out=[]
    for i in range(m['n']):
        fr=Image.open(R+'anim/%s_%s_%03d.webp'%(g,film,i)).convert('RGBA').resize((max(1,round(m['w'])),max(1,round(m['h']))))
        cv=Image.new('RGBA',(sw,sh),(0,0,0,0));ox,oy=round(m['ox']),round(m['oy'])
        cv.paste(fr,(ox,oy))                # (frames may stick out of the picture; paste crops them)
        d=np.abs(comp(cv)-base).mean(2);out.append([float((d[mk]>40).mean()) for mk in masks])
    return np.array(out)
DELTA=float(__import__('os').environ.get('DELTA','.15'))
def states(t,ch):
    st=[]
    for a in range(2):
        v=t[:,a];base=np.sort(v)[:max(3,len(v)//10)].mean();thr=base+max(.12,.45*(v.max()-base))
        st.append(v>thr)
    s=np.stack(st,1)           # (n,2) moving flags
    # remove blips shorter than 3 frames
    for a in range(2):
        col=s[:,a].copy();n=len(col);i=0
        while i<n:
            j=i
            while j<n and col[j]==col[i]:j+=1
            if j-i<5 and i>0:col[i:j]=col[i-1]
            i=j
        s[:,a]=col
    return s
def shapes_for(ch,mv):
    sh=[p for p in D[str(ch)]]
    for a in range(2):
        if mv[a]:sh.append(A[str(ch)][a])
    return sh
res={}
chs=[int(x) for x in sys.argv[1:]] or range(1,11)
for ch in chs:
    g='g%02d'%ch
    for film in M[g]:
        if 'ledja' in film:continue
        import os;cp=S+'tl_%d_%s.npy'%(ch,film)
        if os.path.exists(cp):t=np.load(cp)
        else:t=timeline(ch,film);np.save(cp,t)
        s=states(t,ch)
        kfs=[];prev=None
        for i in range(len(s)):
            k=(bool(s[i,0]),bool(s[i,1]))
            if k!=prev:kfs.append({'f':i,'s':shapes_for(ch,k),'k':k});prev=k
        if len(kfs)<=1 and not kfs[0]['k'][0] and not kfs[0]['k'][1]:
            print(g,film,'only rest');continue
        res.setdefault(str(ch),{})[film]=kfs
        print(g,film,[(k['f'],''.join('LR'[a] for a in range(2) if k['k'][a]) or '-') for k in kfs])
json.dump({c:{f:[{'f':k['f'],'s':k['s']} for k in L] for f,L in d.items()} for c,d in res.items()},open(S+'cutf_def.json','w'))
