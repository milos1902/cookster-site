#!/usr/bin/env python3
"""Bakes the shadows of the sun for the things of the game (Jutro / Podne / Veče).
The thing is "extruded" in the mind: its footprint (the whole picture for the flat things, the bottom part for the tall ones) is swept along the direction of the sun for as long as the thing is high;
the shadow is sharp at the foot and gets softer (penumbra) the farther it goes. The result is a PNG of the shadow (black + alpha) for every key of the day, that lies under the thing in the game.
Usage: python3 tools/bake_sun_shadows.py [id ...]      (without ids: all the things of tools/sun_shadow_items.json)"""
import json,math,os,sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG=json.load(open(os.path.join(ROOT,'tools','sun_shadow_items.json')))
KEYS=CFG['keys']      # name -> {angle (deg, 0 = to the right, 90 = toward the viewer), len (x the height)}
OUT=os.path.join(ROOT,'assets','shadows')
def bake(iid,it):
    src=os.path.join(ROOT,it['src']);im=Image.open(src).convert('RGBA')
    a=np.asarray(im.getchannel('A'),dtype=np.float32)/255
    H,W=a.shape
    foot=a.copy()
    if it.get('foot','full')=='base':      # tall things: only the bottom part of the picture touches the table
        band=int(H*it.get('band',.25));foot[:H-band,:]=0
    h=float(it['h']);res={}
    for kn,k in KEYS.items():
        L=h*k['len'];ang=math.radians(k['angle']);vx,vy=math.cos(ang)*L,max(.2,math.sin(ang))*L*it.get('flat',1.3)
        s0,s1=it.get('blur0',1.5),it.get('blur1',7.0)
        pad=int(L+4*s1)+6
        canvas=np.zeros((H+2*pad,W+2*pad),np.float32);canvas[pad:pad+H,pad:pad+W]=foot
        acc=np.zeros_like(canvas);N=max(8,int(L/1.5))
        for i in range(N+1):
            t=i/N
            sh=ndi.shift(canvas,(t*vy,t*vx),order=1,mode='constant')
            sh=ndi.gaussian_filter(sh,s0+t*(s1-s0))
            acc=np.maximum(acc,sh*(1-.25*t))
        acc=ndi.gaussian_filter(acc,.8)
        ys,xs=np.where(acc>.01)
        y0,y1,x0,x1=max(0,ys.min()-1),min(acc.shape[0],ys.max()+2),max(0,xs.min()-1),min(acc.shape[1],xs.max()+2)
        crop=acc[y0:y1,x0:x1]
        rgba=np.zeros(crop.shape+(4,),np.uint8);rgba[...,3]=np.clip(crop*255*.9,0,255)
        fn='%s_%s.png'%(iid,kn);Image.fromarray(rgba,'RGBA').save(os.path.join(OUT,fn),optimize=True)
        res[kn]={'file':'assets/shadows/'+fn,'ox':int(pad-x0),'oy':int(pad-y0),'w':int(crop.shape[1]),'h':int(crop.shape[0])}      # ox,oy: where the top-left corner of the picture of the thing is inside the shadow picture
    return {'sw':W,'sh':H,'keys':res}
if __name__=='__main__':
    ids=sys.argv[1:] or list(CFG['items'].keys())
    meta_path=os.path.join(OUT,'meta.json');meta=json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    for iid in ids:
        meta[iid]=bake(iid,CFG['items'][iid]);print('baked',iid)
    json.dump(meta,open(meta_path,'w'),indent=1)
