#!/usr/bin/env python3
"""Turns the picture of a shadow that ChatGPT drew (dark soft shadow on PURE WHITE, the same canvas as the template) into a transparent shadow of the thing and
puts it into assets/shadows (+ meta.json), so that the game lays it under the thing (js/sun-shadow.js).
Usage: python3 tools/import_gpt_shadow.py <id> <jutro|podne|vece> <picture.png> [gain]"""
import json,os,sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def main():
    iid,key,path=sys.argv[1:4];gain=float(sys.argv[4]) if len(sys.argv)>4 else 1.0
    T=json.load(open(os.path.join(ROOT,'tools','gpt_templates.json')))[iid]
    im=Image.open(path).convert('RGB').resize((T['cw'],T['ch']),Image.LANCZOS)      # ChatGPT may change the size: back to the size of the template
    g=np.asarray(im.convert('L'),dtype=np.float32)
    bg=np.percentile(g,97);bg=max(bg,200.0)          # the white of the canvas
    a=np.clip((bg-g)/bg*gain,0,1)
    # the thing itself must not remain in the picture: its place (the footprint) is under the thing anyway, but if ChatGPT left the thing, we cut it by its own alpha
    s=T['scale'];spr=Image.open(os.path.join(ROOT,[d for d in json.load(open(os.path.join(ROOT,'tools','item_defs.json'))) if d['id']==iid][0]['src'])).convert('RGBA')
    sw,sh=int(T['sw']*s),int(T['sh']*s)
    # to the scale of the picture of the thing (1:1 with the pixels of its picture)
    inv=1.0/s;W2,H2=int(T['cw']*inv),int(T['ch']*inv)
    A=Image.fromarray((a*255).astype(np.uint8)).resize((W2,H2),Image.LANCZOS);A=np.asarray(A,dtype=np.float32)/255
    x0,y0=int(T['x0']*inv),int(T['y0']*inv)
    ys,xs=np.where(A>.015)
    if not len(ys):raise SystemExit('no shadow found in the picture')
    Y0,Y1,X0,X1=max(0,ys.min()-1),min(H2,ys.max()+2),max(0,xs.min()-1),min(W2,xs.max()+2)
    crop=A[Y0:Y1,X0:X1];rgba=np.zeros(crop.shape+(4,),np.uint8);rgba[...,3]=np.clip(crop*255,0,255)
    out=os.path.join(ROOT,'assets','shadows');os.makedirs(out,exist_ok=True);fn='%s_%s.png'%(iid,key)
    Image.fromarray(rgba,'RGBA').save(os.path.join(out,fn),optimize=True)
    mp=os.path.join(out,'meta.json');meta=json.load(open(mp)) if os.path.exists(mp) else {}
    e=meta.setdefault(iid,{'sw':T['sw'],'sh':T['sh'],'keys':{}});e['sw']=T['sw'];e['sh']=T['sh']
    e['keys'][key]={'file':'assets/shadows/'+fn,'ox':int(x0-X0),'oy':int(y0-Y0),'w':int(crop.shape[1]),'h':int(crop.shape[0])}
    json.dump(meta,open(mp,'w'),indent=1);print('ok',iid,key,e['keys'][key])
if __name__=='__main__':main()
