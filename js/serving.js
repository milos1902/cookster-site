/* Serving: ANY ingredient (every vegetable and fruit in every state: whole, roasted, peeled, sliced, chopped) can be put into ANY vessel that is not for cooking
   (plates, bowls, basins, baking trays, the oval; not the pans and pots, they have their own rules and a capacity). Let the ingredient go above the vessel.
   The picture of the vessel is always computed again from the list of what is in it (dataset.srvItems), nothing is drawn by hand:
     whole pieces and slices lie over each other (a heap), chopped things are scattered as single small pieces over the food, then the oil (a shine over the food and a puddle under it)
     and the parsley (leaves from above). Up to HEAP pieces lie in the vessel, the next ones fall next to it on the table. The right button on the vessel: oil / parsley / clear.
   The only exception is the sour cabbage for the dish "kiseli kupus" that goes into the bowl by the old rules (quality, spices, the waiter). */
(function(){
'use strict';
if(window.CooksterServe)return;
const OVAL='oval_tanjir',HEAP=14,OVALDIR='assets/calibration_props/oval/';
// the zone of the food in every kind of vessel (parts of the width / height of its picture; rot = tilt of the zone)
const ZONES={
  oval_tanjir:{x:.50,y:.50,rx:.40,ry:.38,rot:.34},
  kal_02_tanjir_ravni:{x:.50,y:.50,rx:.27,ry:.22,rot:0},
  kal_02_duboki_tanjir:{x:.50,y:.50,rx:.28,ry:.25,rot:0},
  DEEP:{x:.50,y:.36,rx:.38,ry:.22,rot:0}                               // bowls (vangle, činije, posuda za kupus) are seen from above at an angle: the opening is in the upper part
};
const zoneOf=id=>ZONES[id]||ZONES.DEEP;
function defOf(id){try{return kitchenEquipmentDef(id);}catch(_){return null;}}
const NOT_SERVING={lavor_emajl_veliki:1,kal_01_okrugli_pleh:1,kal_01_pravougaoni_pleh:1};      // the washing basin and the baking trays: this logic is not for them (the choice of the player)
function isServing(el){
  const id=el&&el.dataset&&el.dataset.itemId;if(!id||NOT_SERVING[id])return false;
  if(id===OVAL)return true;
  const d=defOf(id);return !!(d&&d.type==='container'&&d.cooking&&d.cooking.canHeat===false);
}
// ---------- pictures (cut to what is drawn, and kept) ----------
const imgs={},sprites={};
function load(src){return imgs[src]||(imgs[src]=(()=>{const i=new Image();i.src=src;return i;})());}
function sprite(src){                                                    // the ingredient's picture without the empty edge
  if(sprites[src])return sprites[src];
  const im=load(src);if(!im.complete||!im.naturalWidth)return null;
  const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(im,0,0);
  let d;try{d=g.getImageData(0,0,w,h).data;}catch(_){return sprites[src]=im;}
  let x0=w,x1=-1,y0=h,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return sprites[src]=im;
  const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);
  return sprites[src]=o;
}
const piecesCache={};
function piecesOf(src){                                                  // the single pieces of a picture with chopped things (every piece that lies alone)
  if(piecesCache[src])return piecesCache[src];
  const im=load(src);if(!im.complete||!im.naturalWidth)return [];
  const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(im,0,0);
  let d;try{d=g.getImageData(0,0,w,h).data;}catch(_){return piecesCache[src]=[];}
  const lab=new Int32Array(w*h),comps=[];let n=0;
  for(let i=0;i<w*h;i++){
    if(lab[i]||d[i*4+3]<60)continue;
    n++;const st=[i];lab[i]=n;let minx=w,maxx=0,miny=h,maxy=0,area=0;
    while(st.length){
      const j=st.pop(),x=j%w,y=(j-x)/w;area++;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const q=yy*w+xx;if(!lab[q]&&d[q*4+3]>=60){lab[q]=n;st.push(q);}}
    }
    comps.push({n,minx,maxx,miny,maxy,area});
  }
  comps.sort((a,b)=>b.area-a.area);
  const big=comps[0],out=[];
  if(!big)return piecesCache[src]=[];
  comps.slice(1).forEach(cp=>{
    if(cp.area<60||cp.area>big.area*.2)return;
    const bw=cp.maxx-cp.minx+1,bh=cp.maxy-cp.miny+1,pc=document.createElement('canvas');pc.width=bw;pc.height=bh;const pg=pc.getContext('2d'),id=pg.createImageData(bw,bh);
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const q=(cp.miny+y)*w+cp.minx+x;if(lab[q]===cp.n){const o=(y*bw+x)*4,s2=q*4;id.data[o]=d[s2];id.data[o+1]=d[s2+1];id.data[o+2]=d[s2+2];id.data[o+3]=d[s2+3];}}
    pg.putImageData(id,0,0);out.push(pc);
  });
  if(out.length<6){                                                      // not enough single pieces: small squares from inside of the heap
    const bw=big.maxx-big.minx,bh=big.maxy-big.miny,sz=Math.max(14,Math.round(Math.min(bw,bh)*.1));let tries=0;
    while(out.length<10&&tries++<200&&bw>sz&&bh>sz){
      const x=big.minx+Math.floor(Math.random()*(bw-sz)),y=big.miny+Math.floor(Math.random()*(bh-sz));
      let ok=true;for(let yy=0;yy<sz&&ok;yy+=3)for(let xx=0;xx<sz;xx+=3){if(lab[(y+yy)*w+x+xx]!==big.n){ok=false;break;}}
      if(!ok)continue;const pc=document.createElement('canvas');pc.width=sz;pc.height=sz;pc.getContext('2d').drawImage(im,x,y,sz,sz,0,0,sz,sz);out.push(pc);
    }
  }
  return piecesCache[src]=out;
}
// ---------- random and drawing ----------
function rng(seed){let a=(seed>>>0)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function zonePath(g,Z,W,H,k){g.beginPath();g.ellipse(W*Z.x,H*Z.y,W*Z.rx*(k||1),H*Z.ry*(k||1),Z.rot,0,Math.PI*2);}
function zonePoint(r,Z,W,H){const a=r()*Math.PI*2,d=Math.sqrt(r())*.94,ex=Math.cos(a)*d*Z.rx*W,ey=Math.sin(a)*d*Z.ry*H,c=Math.cos(Z.rot),s=Math.sin(Z.rot);return[W*Z.x+ex*c-ey*s,H*Z.y+ex*s+ey*c];}
function leaf(g,size,rot,shade){
  g.save();g.rotate(rot);
  const dark=`hsl(${112+shade*14},${52+shade*8}%,${22+shade*7}%)`,light=`hsl(${100+shade*12},${58+shade*6}%,${36+shade*8}%)`;
  g.strokeStyle=dark;g.lineWidth=size*.07;g.lineCap='round';g.beginPath();g.moveTo(0,size*.55);g.lineTo(0,size*.12);g.stroke();
  [-.95,0,.95].forEach((ang,i)=>{
    g.save();g.translate(0,size*.1);g.rotate(ang);
    const L=size*(i===1?.62:.5),W=size*(i===1?.3:.26),gr=g.createLinearGradient(0,0,0,-L);gr.addColorStop(0,dark);gr.addColorStop(1,light);
    g.fillStyle=gr;g.beginPath();g.moveTo(0,0);
    g.bezierCurveTo(-W*.9,-L*.2,-W*1.15,-L*.55,-W*.45,-L*.78);g.lineTo(-W*.62,-L*.9);g.lineTo(-W*.18,-L*.9);g.lineTo(0,-L);
    g.lineTo(W*.18,-L*.9);g.lineTo(W*.62,-L*.9);g.lineTo(W*.45,-L*.78);
    g.bezierCurveTo(W*1.15,-L*.55,W*.9,-L*.2,0,0);g.fill();
    g.strokeStyle='rgba(210,245,170,.35)';g.lineWidth=size*.018;g.beginPath();g.moveTo(0,-L*.08);g.lineTo(0,-L*.8);g.stroke();
    g.restore();
  });
  g.restore();
}
function shines(g,Z,W,H,r,count,strength){
  for(let i=0;i<count;i++){
    const [x,y]=zonePoint(r,Z,W,H),len=W*(.05+r()*.07),th=len*(.18+r()*.14),rot=Z.rot+(r()-.5)*.9;
    g.save();g.translate(x,y);g.rotate(rot);g.scale(1,th/len);
    const gr=g.createRadialGradient(0,0,0,0,0,len);gr.addColorStop(0,`rgba(255,252,225,${.85*strength})`);gr.addColorStop(.5,`rgba(255,244,190,${.35*strength})`);gr.addColorStop(1,'rgba(255,240,170,0)');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,len,0,Math.PI*2);g.fill();g.restore();
  }
}
// ---------- the list of what is in the vessel ----------
function listOf(el){
  let l=null;try{l=JSON.parse(el.dataset.srvItems||'null');}catch(_){}
  if(!Array.isArray(l)){
    l=[];                                                                // older saves of the oval (green / red peeled peppers and chopped things)
    let o=null;try{o=JSON.parse(el.dataset.ovalItems||'null');}catch(_){}
    if(Array.isArray(o))o.forEach(k=>l.push(k==='z'?{s:'assets/ingredients/zelena_peel/peeled.png',f:'p',w:.6,k:'zelena_oljustena',l:'Oljuštena zelena paprika'}:{s:'assets/ingredients/paprika_peel/peeled.png',f:'p',w:.42,k:'crvena_oljustena',l:'Oljuštena crvena paprika'}));
    let e=null;try{e=JSON.parse(el.dataset.ovalExtras||'null');}catch(_){}
    if(Array.isArray(e))e.forEach(k=>{let s='';try{s=VEGETABLES[k].dicedSrc;}catch(_){}if(s)l.push({s,f:'d',w:.3,k:k+'_diced',l:k});});
    if(l.length){el.dataset.srvItems=JSON.stringify(l);el.dataset.srvOil=el.dataset.srvOil||el.dataset.ovalOil||'0';el.dataset.srvParsley=el.dataset.srvParsley||el.dataset.ovalParsley||'0';el.dataset.srvSeed=el.dataset.srvSeed||el.dataset.ovalSeed||'7';}
  }
  return l.filter(x=>x&&typeof x.s==='string');
}
const pieces=l=>l.filter(x=>x.f!=='d'),scattered=l=>l.filter(x=>x.f==='d');
const isFinished=(el,l)=>el.dataset.itemId===OVAL&&l.length===3&&l.every(x=>x.k==='zelena_oljustena');
function baseSrc(el){const d=defOf(el.dataset.itemId);return(d&&d.src)||'';}
// where the pieces lie: a heap in the zone (every next piece a little over the previous ones; the more pieces, the smaller they are)
function places(n,Z,W,H,seed){
  const r=rng((seed||7)*7+3),out=[],phase=r()*6.28,c=Math.cos(Z.rot),s=Math.sin(Z.rot);
  for(let i=0;i<n;i++){
    const rad=i===0?0:Math.sqrt((i+.5)/HEAP)*.62,sc=i===0?1:.78,a=phase+i*2.39996,ex=Math.cos(a)*rad*Z.rx*W+(r()-.5)*.03*W,ey=Math.sin(a)*rad*Z.ry*H+(r()-.5)*.03*H;
    out.push({x:W*Z.x+ex*c-ey*s,y:H*Z.y+ex*s+ey*c,rot:Z.rot*.7+(r()-.5)*.9,sc:sc*(.9+r()*.2)});
  }
  return out;                                       // the lower ones are drawn over the higher ones
}
// ---------- the calibrated vessels (the player drew where the food is seen: js/data/vessel-food-zones.js, tool "Maska hrane u posudi") ----------
function calOf(id){
  let c=null;
  try{const ls=JSON.parse(localStorage.getItem('cookster.vessel-food-mask-calibration.v1')||'null');const v=ls&&ls.vessels?ls.vessels[id]:ls&&ls[id];if(v&&Array.isArray(v.foodVisible)&&v.foodVisible.length>=3)c=v;}catch(_){}
  if(!c){const z=window.__COOKSTER_VESSEL_FOOD_ZONES__;c=z&&z[id]||null;}
  return c;
}
const pt2=p=>Array.isArray(p)?[p[0],p[1]]:[p.x,p.y];
function calPx(c,W,H){
  const poly=l=>(l||[]).map(p=>{const q=pt2(p);return[q[0]/100*W,q[1]/100*H];});
  const dp=p=>p?(()=>{const q=pt2(p);return[q[0]/100*W,q[1]/100*H];})():null;
  const food=poly(c.foodVisible),bottom=poly(c.bottom),db=dp(c.depth&&c.depth.bottom),dt=dp(c.depth&&c.depth.foodTop);
  const ys=food.map(p=>p[1]),xs=food.map(p=>p[0]);
  return{food,bottom:bottom.length>=3?bottom:null,by:db?db[1]:Math.max(...ys)*.9,top:dt?dt[1]:Math.min(...ys),minx:Math.min(...xs),maxx:Math.max(...xs),bx:db?db[0]:(Math.min(...xs)+Math.max(...xs))/2};
}
function inPoly(poly,x,y){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ins=!ins;}return ins;}
function polyPath(g,poly){g.beginPath();poly.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();}
function polyBox(poly){const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};}
function polyPoint(r,poly,y0,y1){const b=polyBox(poly);for(let i=0;i<90;i++){const x=b.x0+r()*(b.x1-b.x0),y=y0+r()*(y1-y0);if(inPoly(poly,x,y))return[x,y];}return[(b.x0+b.x1)/2,(y0+y1)/2];}
// the first thing lies on the bottom of the vessel (blue), the next ones fill it up to the green polygon: the more there is, the higher the food reaches (from the point of the bottom to the point of the top)
function calState(cal,n){
  const level=n<=1?0:Math.min(1,(n-1)/9),bandBottom=cal.by+(cal.top<cal.by?(cal.by-cal.top)*.04:4),bandTop=cal.by-(cal.by-cal.top)*(.18+.82*level)*(n<=1?0:1);
  const single=n===1&&!!cal.bottom;
  return{single,poly:single?cal.bottom:cal.food,y0:single?polyBox(cal.bottom).y0:Math.min(bandTop,cal.by),y1:single?polyBox(cal.bottom).y1:bandBottom,clip:single?cal.bottom:cal.food};
}
const cache={};
function compose(el){
  const id=el.dataset.itemId,l=listOf(el),oil=Math.max(0,Math.min(2,+el.dataset.srvOil||0)),pars=Math.max(0,Math.min(40,+el.dataset.srvParsley||0)),seed=+el.dataset.srvSeed||7;
  const finished=isFinished(el,l),bsrc=finished?OVALDIR+'oval_puna.webp':baseSrc(el);
  const cj=calOf(id),key=id+'|'+JSON.stringify(l)+'|o'+oil+'|p'+pars+'|s'+seed+(cj?'|c'+JSON.stringify(cj).length:'');
  if(cache[key])return cache[key];
  const base=load(bsrc);
  if(!bsrc||!base.complete||!base.naturalWidth)return bsrc;
  const sp=l.map(x=>x.f==='d'?(piecesOf(x.s).length?1:null):sprite(x.s));
  if(sp.some(v=>v===null))return bsrc;                                  // the pictures are still coming
  const W=base.naturalWidth,H=base.naturalHeight,Z=zoneOf(id),mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
  const out=mk(),g=out.getContext('2d'),r=rng(seed);
  const pcs=finished?[]:pieces(l),cal=(!finished&&cj)?calPx(cj,W,H):null,st=cal?calState(cal,pcs.length||(scattered(l).length?2:0)):null;
  const sample=rr=>cal?polyPoint(rr,st.poly,st.y0,st.y1):zonePoint(rr,Z,W,H);
  g.drawImage(base,0,0);
  let food=null;
  if(pcs.length){
    if(oil>0){g.save();if(cal)polyPath(g,st.clip);else zonePath(g,Z,W,H,.93);g.clip();const cx=cal?cal.bx:W*Z.x,cy=cal?(st.y0+st.y1)/2:H*Z.y,gr=g.createRadialGradient(cx,cy,W*.03,cx,cy,W*.32);gr.addColorStop(0,`rgba(255,206,70,${.20+.12*oil})`);gr.addColorStop(1,`rgba(255,196,60,${.06*oil})`);g.fillStyle=gr;g.fillRect(0,0,W,H);g.restore();}
    food=mk();const f=food.getContext('2d');
    let pl;
    if(cal){                                                             // inside of the calibrated vessel: the heap rises with the number of pieces
      const bb0=cal.bottom?polyBox(cal.bottom):null;                      // a piece's place depends only on its number (not on how many there are), so nothing moves when something new is added
      pl=pcs.map((it,i)=>{const rp=rng(seed*7+3+i*977);let x,y;
        if(i===0){x=bb0?(bb0.x0+bb0.x1)/2:cal.bx;y=bb0?(bb0.y0+bb0.y1)/2:cal.by;}
        else{const lv=Math.min(1,i/9),yb=cal.by+(cal.top<cal.by?(cal.by-cal.top)*.04:4),yt=cal.by-(cal.by-cal.top)*(.18+.82*lv);[x,y]=polyPoint(rp,cal.food,Math.min(yt,cal.by),yb);}
        return{x,y,rot:(rp()-.5)*1.1,sc:i===0?1:.9+rp()*.2,first:i===0};});
    }else pl=places(pcs.length,Z,W,H,seed);
    pcs.map((it,i)=>i).sort((a,b)=>pl[a].y-pl[b].y).forEach(i=>{                  // the lower ones are drawn over the higher ones (the places themselves do not change)
      const it=pcs[i],spr=sprite(it.s),p=pl[i];let w=W*Math.max(.1,Math.min(.62,it.w))*p.sc;
      let h=w*spr.height/spr.width;
      if(cal){                                                           // the piece is fitted INTO the polygon (not cut by its edge): its size is limited by the width and the height of the polygon
        const bb=(p.first&&cal.bottom)?polyBox(cal.bottom):polyBox(cal.food),maxW=(bb.x1-bb.x0)*(p.first?.97:.46),maxH=(bb.y1-bb.y0)*(p.first?.97:.62);if(p.first){const k1=Math.max((bb.x1-bb.x0)*.9/w,(bb.y1-bb.y0)*.9/h);if(k1>1){w*=Math.min(k1,1.8);h*=Math.min(k1,1.8);}}   // the first thing fills the floor (blue) and stays there
        const k=Math.min(1,maxW/w,maxH/h);w*=k;h*=k;
      }
      {                                                                  // a whole piece is never cut: if it does not fit, it is made smaller until it reaches the edge
        const poly=cal?((p.first&&cal.bottom)?cal.bottom:cal.food):null,cs=Math.cos(p.rot),sn=Math.sin(p.rot);
        const inside=(x,y)=>poly?inPoly(poly,x,y):(()=>{const c=Math.cos(Z.rot),s2=Math.sin(Z.rot),dx=x-W*Z.x,dy=y-H*Z.y,u=dx*c+dy*s2,v=-dx*s2+dy*c;return(u*u)/((W*Z.rx)**2)+(v*v)/((H*Z.ry)**2)<=1;})();
        const fits=(ww,hh)=>{for(let a=0;a<16;a++){const t=a/16*Math.PI*2,ex=Math.cos(t)*ww*.46,ey=Math.sin(t)*hh*.46;if(!inside(p.x+ex*cs-ey*sn,p.y+ex*sn+ey*cs))return false;}return true;};
        const cx=poly?(polyBox(poly).x0+polyBox(poly).x1)/2:W*Z.x,cy=poly?(polyBox(poly).y0+polyBox(poly).y1)/2:H*Z.y;
        for(let n=0;n<14&&!fits(w,h);n++){p.x+=(cx-p.x)*.12;p.y+=(cy-p.y)*.12;}   // first it is moved a little toward the middle
        for(let n=0;n<40&&!fits(w,h);n++){w*=.94;h*=.94;}
      }
      [g,f].forEach((c,k)=>{c.save();if(cal){polyPath(c,cal.food);c.clip();}c.translate(p.x,p.y);c.rotate(p.rot);if(k===0){c.shadowColor='rgba(50,25,5,.38)';c.shadowBlur=10;c.shadowOffsetY=4;}c.drawImage(spr,-w/2,-h/2,w,h);c.restore();});
    });
  }
  if(oil>0&&(finished||food)){
    const sh=mk(),s=sh.getContext('2d');
    if(food){s.drawImage(food,0,0);s.globalCompositeOperation='source-atop';}else{zonePath(s,Z,W,H,1);s.clip();}
    if(food){s.save();s.globalAlpha=.09*oil;s.fillStyle='rgba(255,236,170,1)';s.fillRect(0,0,W,H);s.restore();}
    for(let i=0;i<9+6*oil;i++){const [x,y]=sample(r),len=W*(.05+r()*.07),th=len*(.18+r()*.14),rot=(r()-.5)*.9,strength=.50+.18*oil;
      s.save();s.translate(x,y);s.rotate(rot);s.scale(1,th/len);const gr=s.createRadialGradient(0,0,0,0,0,len);gr.addColorStop(0,`rgba(255,252,225,${.85*strength})`);gr.addColorStop(.5,`rgba(255,244,190,${.35*strength})`);gr.addColorStop(1,'rgba(255,240,170,0)');s.fillStyle=gr;s.beginPath();s.arc(0,0,len,0,Math.PI*2);s.fill();s.restore();}
    g.save();g.globalCompositeOperation='screen';g.globalAlpha=.75;g.drawImage(sh,0,0);g.restore();
    if(food){g.save();g.globalCompositeOperation='overlay';g.globalAlpha=.34*oil;g.drawImage(food,0,0);g.restore();}
  }
  const sc=scattered(l);
  if(sc.length){
    const re=rng(seed*13+5);let fd=null;try{if(food)fd=food.getContext('2d').getImageData(0,0,W,H).data;}catch(_){}
    const onFood=(x,y)=>{if(!fd)return true;return fd[((Math.round(y)*W)+Math.round(x))*4+3]>140;};
    g.save();if(cal){polyPath(g,cal.food);g.clip();}
    sc.slice(0,12).forEach(it=>{
      const ps=piecesOf(it.s);if(!ps.length)return;
      for(let i=0;i<24;i++){
        let x,y;for(let t=0;t<40;t++){[x,y]=sample(re);if(re()<.12||onFood(x,y))break;}
        const pc=ps[Math.floor(re()*ps.length)],a=W*(.034+re()*.016),h=a*pc.height/pc.width;
        g.save();g.translate(x,y);g.rotate(re()*Math.PI*2);g.shadowColor='rgba(40,20,5,.4)';g.shadowBlur=3;g.shadowOffsetY=1.5;g.drawImage(pc,-a/2,-h/2,a,h);g.restore();
      }
    });
    g.restore();
  }
  if(pars>0){const rp=rng(seed*31+17);g.save();if(cal){polyPath(g,cal.food);g.clip();}for(let i=0;i<pars;i++){const [x,y]=sample(rp),size=W*(.045+rp()*.03);g.save();g.translate(x,y);g.shadowColor='rgba(20,30,5,.45)';g.shadowBlur=4;g.shadowOffsetY=2.5;leaf(g,size,rp()*Math.PI*2,rp());g.restore();}g.restore();}
  if(window.__SRV_DEBUG&&cal){g.save();g.lineWidth=3;g.strokeStyle='#18c24a';polyPath(g,cal.food);g.stroke();if(cal.bottom){g.strokeStyle='#2b6bff';polyPath(g,cal.bottom);g.stroke();}g.restore();}
  try{return cache[key]=out.toDataURL('image/png');}catch(_){return bsrc;}
}
function nameOf(el,l){
  if(!l.length)return el.dataset.baseLabel||'';
  if(isFinished(el,l))return 'Belolučane paprike';
  const cnt={},order=[];l.forEach(x=>{const n=x.l||x.k;if(!cnt[n]){cnt[n]=0;order.push(n);}cnt[n]++;});
  return (el.dataset.baseLabel||'')+' · '+order.map(n=>cnt[n]>1?`${cnt[n]}× ${n.toLowerCase()}`:n.toLowerCase()).join(', ');
}
function render(el){
  if(!el.dataset.baseLabel)el.dataset.baseLabel=String(el.dataset.label||'').replace(/ ·.*$/,'');
  const l=listOf(el);
  if(!l.length&&!(+el.dataset.srvOil)&&!(+el.dataset.srvParsley)){
    if(el.dataset.srvDrawn){const b=el.querySelector('.body'),sh=el._contactShadow&&el._contactShadow.querySelector('img'),s=baseSrc(el);if(b&&s){b.src=s;if(sh)sh.src=s;}delete el.dataset.srvDrawn;delete el.dataset.srvSrc;el.dataset.label=el.dataset.baseLabel;const fm=el._vesselFrontMask||el.querySelector('.vessel-front-mask');if(fm)fm.style.display='';}
    return;
  }
  const src=compose(el);if(!src)return;
  const b=el.querySelector('.body'),sh=el._contactShadow&&el._contactShadow.querySelector('img');
  if(b&&el.dataset.srvSrc!==src){el.dataset.srvSrc=src;b.src=src;if(sh)sh.src=src;}
  el.dataset.srvDrawn='1';
  const fm=el._vesselFrontMask||el.querySelector('.vessel-front-mask');if(fm)fm.style.display='none';          // the old "front wall" picture would cover the food: the picture drawn here already has the right edges
  el.dataset.label=nameOf(el,l)+((+el.dataset.srvOil)?' · nauljeno':'')+((+el.dataset.srvParsley)?' · peršun':'');
}
// ---------- the vessels in the scene ----------
function vessels(){return(window.items||[]).filter(isServing);}
function vesselAt(x,y){
  const l=vessels();
  for(let i=l.length-1;i>=0;i--){if(l[i]===window.holding)continue;const r=l[i].getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return l[i];}
  return null;
}
function hasOldContents(el){
  try{const c=JSON.parse(el.dataset.containerContents||'[]');if(Array.isArray(c)?c.length:Object.keys(c||{}).length)return true;}catch(_){}
  return !!(el.dataset.plateFill||(+el.dataset.bagCount>0));
}
function tryDrop(item){
  if(!item||!item.dataset)return false;
  const el=vesselAt(mouse.x,mouse.y);if(!el)return false;
  let meta=null;try{meta=ingredientVisualMeta(item);}catch(_){}
  if(!meta||(meta.type!=='vegetable'&&meta.type!=='fruit'))return false;
  if(/kiseli|kupus_diced_kiseli/.test(String(meta.key||'')+String(item.dataset.fermentPhase||''))&&(el.dataset.itemId==='posuda_za_kupus'||el.dataset.itemId==='kal_02_duboki_tanjir'))return false;   // the dish "kiseli kupus" has its own rules
  if(hasOldContents(el)&&!listOf(el).length)return false;
  const body=item.querySelector('.body'),src=body&&body.getAttribute('src');if(!src)return false;
  const l=listOf(el);
  const form=((meta.cutState==='diced'||meta.form==='diced')&&item.dataset.cutStyle!=='slices')?'d':'p';
  if(form==='p'&&pieces(l).length>=HEAP){                                // the vessel is full: the piece falls next to it (it is put down on the table there)
    const rc=el.getBoundingClientRect(),a=Math.random()*Math.PI*2,sx=rc.width*.62+Math.random()*30,sy=rc.height*.55+Math.random()*20;
    mouse.x=Math.round(mouse.x+Math.cos(a)*sx);mouse.y=Math.round(mouse.y+Math.sin(a)*sy*.8);
    showToast('Posuda je puna — palo je pored nje.');return false;
  }
  const vd=defOf(el.dataset.itemId)||{w:150},ratio=(+item.dataset.baseW||+body.offsetWidth||60)/(vd.w||150);
  let kk=String(meta.key||'x'),ll=String(meta.label||item.dataset.label||'sastojak');
  if(item.dataset.peeled==='1'&&item.dataset.vegKey==='paprika_zelena'){kk='zelena_oljustena';ll='Oljuštena zelena paprika';}
  else if(item.dataset.peeled==='1'&&item.dataset.vegKey==='paprika'){kk='crvena_oljustena';ll='Oljuštena crvena paprika';}
  const entry={s:src,f:form,w:Math.max(.16,Math.min(.6,ratio*1.9*(meta.cutState==='sliced'?.85:1))),k:kk,l:ll};
  l.push(entry);el.dataset.srvItems=JSON.stringify(l);el.dataset.srvSeed=el.dataset.srvSeed||String(1+Math.floor(Math.random()*99999));
  removeItem(item);holding=null;
  try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(_){}
  render(el);try{playImpactSound(el,'drop');}catch(_){}try{CooksterSave.schedule();}catch(_){}
  showToast(isFinished(el,l)?'Belolučane paprike su gotove!':`${entry.l} je u posudi.`);
  return true;
}
// right click on a vessel: oil and parsley (until the real pouring and sprinkling), clear
let menu=null;
function closeMenu(){if(menu){menu.remove();menu=null;}}
function openMenu(el,x,y){
  closeMenu();menu=document.createElement('div');
  Object.assign(menu.style,{position:'fixed',left:x+'px',top:y+'px',zIndex:'30000',display:'flex',flexDirection:'column',gap:'5px',padding:'7px',background:'rgba(39,28,19,.96)',border:'1px solid rgba(255,220,150,.75)',borderRadius:'7px',boxShadow:'0 5px 18px rgba(0,0,0,.45)',color:'#fff',font:'600 13px/1.2 system-ui,sans-serif'});
  menu.addEventListener('pointerdown',e=>e.stopPropagation());menu.addEventListener('contextmenu',e=>e.preventDefault());
  const t=document.createElement('strong');t.textContent=el.dataset.label||'Posuda';t.style.padding='2px 5px 4px';menu.appendChild(t);
  const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;Object.assign(b.style,{border:'0',borderRadius:'5px',padding:'7px 10px',cursor:'pointer',background:'#f0c36a',color:'#2a1a0e',font:'700 13px system-ui'});
    b.onclick=()=>{fn();el.dataset.srvSeed=el.dataset.srvSeed||String(1+Math.floor(Math.random()*99999));render(el);try{CooksterSave.schedule();}catch(_){}closeMenu();};menu.appendChild(b);};
  const oil=+el.dataset.srvOil||0,pars=+el.dataset.srvParsley||0,has=listOf(el).length;
  add(oil<2?(oil?'Još ulja':'Prelij uljem'):'Ulja je dosta',()=>{el.dataset.srvOil=String(Math.min(2,oil+1));});
  add(pars<30?'Pospi peršunom':'Peršuna je dosta',()=>{el.dataset.srvParsley=String(Math.min(30,pars+(pars?7:9)));});
  if(oil||pars||has)add('Isprazni posudu',()=>{el.dataset.srvItems='[]';el.dataset.ovalItems='[]';el.dataset.ovalExtras='[]';el.dataset.srvOil='0';el.dataset.srvParsley='0';});
  document.body.appendChild(menu);
  const r=menu.getBoundingClientRect();menu.style.left=Math.max(6,Math.min(innerWidth-r.width-6,x))+'px';menu.style.top=Math.max(6,Math.min(innerHeight-r.height-6,y))+'px';
}
window.addEventListener('contextmenu',e=>{
  try{if(typeof holding!=='undefined'&&holding)return;}catch(_){}
  const el=vesselAt(e.clientX,e.clientY);
  if(!el){closeMenu();return;}
  if(el.dataset.itemId!==OVAL&&!listOf(el).length&&!(+el.dataset.srvOil)&&!(+el.dataset.srvParsley))return;     // an empty ordinary vessel keeps its old right click
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openMenu(el,e.clientX,e.clientY);
},true);
window.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
setInterval(()=>{vessels().forEach(render);},1200);
window.CooksterServe={tryDrop,render,compose,listOf,isServing,ZONES};
})();
