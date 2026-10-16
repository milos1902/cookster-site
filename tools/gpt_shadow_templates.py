#!/usr/bin/env python3
"""Makes the templates for ChatGPT: the thing (its picture) on a pure white 1536x1024 canvas, in the left part, so that there is room on the right and below for the shadow.
ChatGPT is asked to draw ONLY the shadow (dark, soft) on the pure white and to keep the canvas exactly as it is. tools/import_gpt_shadow.py then turns that picture into a transparent shadow of the thing.
Usage: python3 tools/gpt_shadow_templates.py <out-dir> [id ...]"""
import json,os,sys
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CW,CH=1536,1024
def main():
    out=sys.argv[1];os.makedirs(out,exist_ok=True)
    defs={d['id']:d for d in json.load(open(os.path.join(ROOT,'tools','item_defs.json')))}
    ids=sys.argv[2:] or list(defs.keys())
    tp=os.path.join(ROOT,'tools','gpt_templates.json');T=json.load(open(tp)) if os.path.exists(tp) else {}
    for iid in ids:
        d=defs[iid];spr=Image.open(os.path.join(ROOT,d['src'])).convert('RGBA');W,H=spr.size
        s=min(560/W,520/H)      # the thing takes about 1/3 of the width of the canvas
        sw,sh=int(W*s),int(H*s);x0,y0=180,int((CH-sh)/2)-60
        canvas=Image.new('RGBA',(CW,CH),(255,255,255,255));canvas.alpha_composite(spr.resize((sw,sh),Image.LANCZOS),(x0,y0))
        canvas.convert('RGB').save(os.path.join(out,'%s.png'%iid))
        T[iid]={'sw':W,'sh':H,'scale':s,'x0':x0,'y0':y0,'cw':CW,'ch':CH}
    json.dump(T,open(tp,'w'),indent=1);print('templates:',len(ids))
if __name__=='__main__':main()
