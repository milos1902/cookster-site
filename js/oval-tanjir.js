/* Oval plate: peeled roasted peppers (green and red) are put on the empty oval (let go of the pepper above it). The picture of the plate is built from LAYERS: the empty oval, then every pepper
   in its own picture (the green and the red one look different), placed on the prepared places of the plate, each with its own shadow. Exactly three green peppers are the hand drawn
   picture of the finished dish "Belolučane paprike" (oval_puna.webp). What is on the plate is kept as a list in dataset.ovalItems (["z","c",...]: z = green, c = red; at most 4).
   The same idea (a list of what is on the plate -> the picture of the dish) is the base for the menu of the player's own dishes. */
(function(){
'use strict';
if(window.CooksterOval)return;
const ID='oval_tanjir',DIR='assets/calibration_props/oval/',NEAT=4,MAX=8;          // up to NEAT peppers lie tidily, up to MAX in a heap; what is more falls next to the plate
const SPR={z:DIR+'zelena_oljustena.png',c:DIR+'crvena_oljustena.png'};
const WIDTH={z:.60,c:.42};                                             // the width of one pepper on the plate (a part of the width of the plate picture)
// the places for 1..4 peppers: [x, y, rotation] as a part of the picture of the plate (the plate is tilted a little, the peppers lie along it)
const SLOTS={
  1:[[.50,.50,.20]],
  2:[[.47,.38,.17],[.53,.63,.22]],
  3:[[.45,.30,.18],[.50,.50,.22],[.55,.70,.20]],
  4:[[.44,.25,.18],[.49,.41,.22],[.53,.58,.20],[.57,.75,.18]]
};
// where the pieces lie: up to NEAT on the prepared places, more of them in a heap (smaller, lying over each other, along the plate)
function placesFor(n,seed){
  if(n<=NEAT)return SLOTS[n].map(p=>[p[0],p[1],p[2],1]);
  const r=rng((seed||7)*7+3),rows=Math.ceil(n/2),sc=n<=6?.64:.52,c=Math.cos(ZONE.rot),sn=Math.sin(ZONE.rot),out=[];
  // plate coordinates: a along the plate, b across it (in the units of the width of the picture), then turned like the plate
  for(let i=0;i<n;i++){
    const row=Math.floor(i/2),inRow=(i%2),single=(row===rows-1&&n%2===1);
    const b=(row-(rows-1)/2)*(rows>3?.105:.125)+(r()-.5)*.012,a=(single?0:(inRow?.15:-.15))+(r()-.5)*.03;
    out.push([ZONE.x+(a*c-b*sn),ZONE.y+(a*sn+b*c)*(W0/H0),ZONE.rot*.8+(r()-.5)*.25,sc*(.94+r()*.1)]);
  }
  return out.sort((x,y)=>x[1]-y[1]);                                     // the lower ones are drawn over the higher ones
}
const imgs={};
function load(src){return imgs[src]||(imgs[src]=(()=>{const i=new Image();i.src=src;return i;})());}
[DIR+'oval_prazan.webp',DIR+'oval_puna.webp',SPR.z,SPR.c].forEach(load);
const cache={};
function listOf(el){
  let l=null;try{l=JSON.parse(el.dataset.ovalItems||'null');}catch(_){}
  if(!Array.isArray(l)){l=[];const n=Math.max(0,Math.min(MAX,+el.dataset.ovalN||0));for(let i=0;i<n;i++)l.push('z');}   // older saves: only green ones
  return l.filter(x=>x==='z'||x==='c').slice(0,MAX);
}
const isFinished=l=>l.length===3&&l.every(x=>x==='z');
// everything else that is cut small (garlic, onion, tomato...) is a "pinch" that is scattered over the food: the list is dataset.ovalExtras (vegetable keys, at most 4)
function extrasOf(el){let l=null;try{l=JSON.parse(el.dataset.ovalExtras||'null');}catch(_){}return Array.isArray(l)?l.filter(k=>typeof k==='string'):[];}
function dicedSrcOf(k){try{return VEGETABLES[k]&&VEGETABLES[k].dicedSrc||'';}catch(_){return '';}}
// the single pieces of a "pinch" picture (a heap of chopped garlic...): every piece that is not touching the others is cut out of the picture (the heap itself gives a few more squares)
const piecesCache={};
function piecesOf(k){
  if(piecesCache[k])return piecesCache[k];
  const src=dicedSrcOf(k),im=load(src);if(!src||!im.complete||!im.naturalWidth)return[];
  const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(im,0,0);
  let d;try{d=g.getImageData(0,0,w,h).data;}catch(_){return piecesCache[k]=[];}
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
  comps.slice(1).forEach(cp=>{                                           // the pieces that lie alone
    if(cp.area<80||cp.area>big.area*.2)return;
    const bw=cp.maxx-cp.minx+1,bh=cp.maxy-cp.miny+1,pc=document.createElement('canvas');pc.width=bw;pc.height=bh;const pg=pc.getContext('2d'),id=pg.createImageData(bw,bh);
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const q=(cp.miny+y)*w+cp.minx+x;if(lab[q]===cp.n){const o=(y*bw+x)*4,s2=q*4;id.data[o]=d[s2];id.data[o+1]=d[s2+1];id.data[o+2]=d[s2+2];id.data[o+3]=d[s2+3];}}
    pg.putImageData(id,0,0);out.push(pc);
  });
  if(out.length<6&&big){                                                 // not enough single pieces: small squares from inside of the heap
    const bw=big.maxx-big.minx,bh=big.maxy-big.miny,sz=Math.max(18,Math.round(Math.min(bw,bh)*.1));let tries=0;
    while(out.length<10&&tries++<200){
      const x=big.minx+Math.floor(Math.random()*(bw-sz)),y=big.miny+Math.floor(Math.random()*(bh-sz));
      let ok=true;for(let yy=0;yy<sz&&ok;yy+=3)for(let xx=0;xx<sz;xx+=3){if(lab[(y+yy)*w+x+xx]!==big.n){ok=false;break;}}
      if(!ok)continue;const pc=document.createElement('canvas');pc.width=sz;pc.height=sz;pc.getContext('2d').drawImage(im,x,y,sz,sz,0,0,sz,sz);out.push(pc);
    }
  }
  return piecesCache[k]=out;
}
function veg(k){try{return(VEGETABLES[k]&&VEGETABLES[k].label)||k;}catch(_){return k;}}
// The zone of the food on the plate (an ellipse, tilted like the plate; the rim of the plate is outside of it). Oil shines and parsley falls only here.
const W0=640,H0=478;
const ZONE={x:.50,y:.50,rx:.40,ry:.285,rot:.34};
function rng(seed){let a=(seed>>>0)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function zonePath(g,W,H,k){g.beginPath();g.ellipse(W*ZONE.x,H*ZONE.y,W*ZONE.rx*(k||1),W*ZONE.ry*(k||1),ZONE.rot,0,Math.PI*2);}
function zonePoint(r,W,H){                                              // a random point inside of the zone
  for(let i=0;i<30;i++){
    const a=r()*Math.PI*2,d=Math.sqrt(r())*.96,ex=Math.cos(a)*d*ZONE.rx*W,ey=Math.sin(a)*d*ZONE.ry*W,c=Math.cos(ZONE.rot),s=Math.sin(ZONE.rot);
    return[W*ZONE.x+ex*c-ey*s,H*ZONE.y+ex*s+ey*c];
  }
}
// a leaf of parsley: three lobes with a notched edge on a short stem, drawn here (no pictures needed)
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
// soft elongated shines: they make everything under them look oiled
function shines(g,W,H,r,count,strength,box){
  for(let i=0;i<count;i++){
    const [x,y]=box?box(r):zonePoint(r,W,H),len=W*(.05+r()*.07),th=len*(.18+r()*.14),rot=ZONE.rot+(r()-.5)*.9;
    g.save();g.translate(x,y);g.rotate(rot);g.scale(1,th/len);
    const gr=g.createRadialGradient(0,0,0,0,0,len);gr.addColorStop(0,`rgba(255,252,225,${.85*strength})`);gr.addColorStop(.5,`rgba(255,244,190,${.35*strength})`);gr.addColorStop(1,'rgba(255,240,170,0)');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,len,0,Math.PI*2);g.fill();g.restore();
  }
}
function compose(l,oil,parsley,seed,extras){
  extras=extras||[];
  const key=l.join('')+'|o'+oil+'|p'+parsley+'|s'+seed+'|e'+extras.join(',');
  if(cache[key])return cache[key];
  const finished=isFinished(l),baseSrc=finished?DIR+'oval_puna.webp':DIR+'oval_prazan.webp',base=load(baseSrc);
  if(!base.complete||!base.naturalWidth||l.some(k=>{const p=load(SPR[k]);return !p.complete||!p.naturalWidth;})||extras.some(k=>{const p=load(dicedSrcOf(k));return !p.complete||!p.naturalWidth;}))return baseSrc;
  const W=base.naturalWidth,H=base.naturalHeight,mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
  const out=mk(),g=out.getContext('2d'),r=rng(seed||7);
  g.drawImage(base,0,0);
  let food=null;                                                         // only the peppers (their own picture), to know where the food is
  if(!finished&&l.length){
    if(oil>0){                                                           // the oil that has run on the plate under the peppers
      g.save();zonePath(g,W,H,.93);g.clip();
      const gr=g.createRadialGradient(W*.5,H*.5,W*.05,W*.5,H*.5,W*.4);gr.addColorStop(0,`rgba(255,206,70,${.20+.12*oil})`);gr.addColorStop(1,`rgba(255,196,60,${.06*oil})`);
      g.fillStyle=gr;g.fillRect(0,0,W,H);g.restore();
    }
    food=mk();const f=food.getContext('2d'),slots=placesFor(l.length,seed);
    l.forEach((k,i)=>{
      const pep=load(SPR[k]),[fx,fy,rot,sc]=slots[i],w=W*WIDTH[k]*sc,h=w*pep.naturalHeight/pep.naturalWidth;
      g.save();g.translate(W*fx,H*fy);g.rotate(rot);g.shadowColor='rgba(50,25,5,.38)';g.shadowBlur=11;g.shadowOffsetY=5;g.drawImage(pep,-w/2,-h/2,w,h);g.restore();
      f.save();f.translate(W*fx,H*fy);f.rotate(rot);f.drawImage(pep,-w/2,-h/2,w,h);f.restore();
    });
  }
  if(oil>0&&(finished||food)){                                           // the shine of the oil: only over the food (or over the zone of the finished picture)
    const sh=mk(),s=sh.getContext('2d');
    if(food){s.drawImage(food,0,0);s.globalCompositeOperation='source-atop';}
    else{zonePath(s,W,H,1);s.clip();}
    s.save();s.globalAlpha=.09*oil;s.globalCompositeOperation=food?'source-atop':'source-over';s.fillStyle='rgba(255,236,170,1)';
    if(food)s.fillRect(0,0,W,H);s.restore();
    shines(s,W,H,r,9+6*oil,.50+.18*oil,food?null:undefined);
    g.save();g.globalCompositeOperation='screen';g.globalAlpha=.75;g.drawImage(sh,0,0);g.restore();
    if(food){g.save();g.globalCompositeOperation='overlay';g.globalAlpha=.34*oil;g.drawImage(food,0,0);g.restore();}   // a bit more contrast and colour, as on a wet surface
  }
  if(extras.length){                                                     // the pinches of chopped things: single small pieces, scattered all over the food
    const re=rng((seed||7)*13+5);
    let fd=null;try{if(food)fd=food.getContext('2d').getImageData(0,0,W,H).data;}catch(_){}
    const onFood=(x,y)=>{if(!fd)return true;const i=((Math.round(y)*W)+Math.round(x))*4+3;return fd[i]>140;};
    extras.slice(0,12).forEach(k=>{
      const ps=piecesOf(k);if(!ps.length)return;
      for(let i=0;i<24;i++){
        let x,y;
        for(let t=0;t<40;t++){[x,y]=zonePoint(re,W,H);if(re()<.12||onFood(x,y))break;}      // most of the pieces lie on the food, a few fall on the plate
        const pc=ps[Math.floor(re()*ps.length)],a=W*(.034+re()*.016),h=a*pc.height/pc.width;
        g.save();g.translate(x,y);g.rotate(re()*Math.PI*2);g.shadowColor='rgba(40,20,5,.4)';g.shadowBlur=3;g.shadowOffsetY=1.5;g.drawImage(pc,-a/2,-h/2,a,h);g.restore();
      }
    });
  }
  if(parsley>0){
    const rp=rng((seed||7)*31+17);
    for(let i=0;i<parsley;i++){
      const [x,y]=zonePoint(rp,W,H),size=W*(.045+rp()*.03);
      g.save();g.translate(x,y);g.shadowColor='rgba(20,30,5,.45)';g.shadowBlur=4;g.shadowOffsetY=2.5;leaf(g,size,rp()*Math.PI*2,rp());g.restore();
    }
  }
  try{return cache[key]=out.toDataURL('image/png');}catch(_){return baseSrc;}
}
function labelOf(l,oil,parsley,extras){const x=((extras&&extras.length)?' · '+[...new Set(extras)].map(k=>veg(k).toLowerCase()).join(', '):'')+(oil?' · nauljeno':'')+(parsley?' · peršun':'');return labelBase(l)+((l.length||(extras&&extras.length))?x:'');}
function labelBase(l){
  if(!l.length)return 'Oval (prazan)';
  if(isFinished(l))return 'Belolučane paprike';
  const z=l.filter(x=>x==='z').length,c=l.length-z,p=[];
  if(z)p.push(`${z}× zelena`);if(c)p.push(`${c}× crvena`);
  return `Oval · ${p.join(', ')} paprika`;
}
function ovals(){return(window.items||[]).filter(el=>el&&el.dataset&&el.dataset.itemId===ID);}
function render(el){
  const l=listOf(el),ex=extrasOf(el),src=compose(l,Math.max(0,Math.min(2,+el.dataset.ovalOil||0)),Math.max(0,Math.min(40,+el.dataset.ovalParsley||0)),+el.dataset.ovalSeed||7,ex);
  const body=el.querySelector('.body'),shadow=el._contactShadow&&el._contactShadow.querySelector('img');
  if(body&&body.dataset.ovalSrc!==src){body.dataset.ovalSrc=src;body.src=src;if(shadow)shadow.src=src;}
  el.dataset.label=labelOf(l,+el.dataset.ovalOil||0,+el.dataset.ovalParsley||0,ex);
}
function ovalAt(x,y){
  const l=ovals();
  for(let i=l.length-1;i>=0;i--){const r=l[i].getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return l[i];}
  return null;
}
function kindOf(item){
  if(!item||!item.dataset||item.dataset.peeled!=='1')return null;
  if(item.dataset.vegKey==='paprika_zelena')return 'z';
  if(item.dataset.vegKey==='paprika')return 'c';
  return null;
}
function tryDropExtra(item){
  if(!item||!item.dataset||item.dataset.vegetable!=='1'||item.dataset.cutState!=='diced'||!dicedSrcOf(item.dataset.vegKey))return false;
  const el=ovalAt(mouse.x,mouse.y);if(!el)return false;
  const ex=extrasOf(el);
  ex.push(item.dataset.vegKey);el.dataset.ovalExtras=JSON.stringify(ex);el.dataset.ovalSeed=el.dataset.ovalSeed||String(1+Math.floor(Math.random()*99999));
  removeItem(item);holding=null;
  try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(_){}
  render(el);try{playImpactSound(el,'drop');}catch(_){}try{CooksterSave.schedule();}catch(_){}
  showToast(`${veg(item.dataset.vegKey)} (seckano) je na ovalu.`);
  return true;
}
function tryDrop(item){
  if(tryDropExtra(item))return true;
  const k=kindOf(item);if(!k)return false;
  const el=ovalAt(mouse.x,mouse.y);if(!el)return false;
  const l=listOf(el);
  if(l.length>=MAX){                                                     // the plate is full: the pepper falls next to the plate (it is put down on the table there)
    const rc=el.getBoundingClientRect(),a=Math.random()*Math.PI*2,sx=rc.width*.62+Math.random()*30,sy=rc.height*.55+Math.random()*20;
    mouse.x=Math.round(mouse.x+Math.cos(a)*sx);mouse.y=Math.round(mouse.y+Math.sin(a)*sy*.8);
    showToast('Oval je pun — paprika je pala pored tanjira.');
    return false;
  }
  l.push(k);el.dataset.ovalItems=JSON.stringify(l);el.dataset.ovalN=String(l.length);
  removeItem(item);holding=null;
  try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(_){}
  render(el);try{playImpactSound(el,'drop');}catch(_){}try{CooksterSave.schedule();}catch(_){}
  showToast(isFinished(l)?'Belolučane paprike su gotove!':`Paprika je na ovalu (${l.length}).`);
  return true;
}
// right click on the plate: oil and parsley (until there are the real pouring and sprinkling): the same for every dish, the picture is computed from what is on the plate
let menu=null;
function closeMenu(){if(menu){menu.remove();menu=null;}}
function openMenu(el,x,y){
  closeMenu();
  menu=document.createElement('div');
  Object.assign(menu.style,{position:'fixed',left:x+'px',top:y+'px',zIndex:'30000',display:'flex',flexDirection:'column',gap:'5px',padding:'7px',background:'rgba(39,28,19,.96)',border:'1px solid rgba(255,220,150,.75)',borderRadius:'7px',boxShadow:'0 5px 18px rgba(0,0,0,.45)',color:'#fff',font:'600 13px/1.2 system-ui,sans-serif'});
  menu.addEventListener('pointerdown',e=>e.stopPropagation());menu.addEventListener('contextmenu',e=>e.preventDefault());
  const t=document.createElement('strong');t.textContent=el.dataset.label||'Oval';t.style.padding='2px 5px 4px';menu.appendChild(t);
  const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;
    Object.assign(b.style,{border:'0',borderRadius:'5px',padding:'7px 10px',cursor:'pointer',background:'#f0c36a',color:'#2a1a0e',font:'700 13px system-ui'});
    b.onclick=()=>{fn();el.dataset.ovalSeed=el.dataset.ovalSeed||String(1+Math.floor(Math.random()*99999));render(el);try{CooksterSave.schedule();}catch(_){}closeMenu();};menu.appendChild(b);};
  const oil=+el.dataset.ovalOil||0,pars=+el.dataset.ovalParsley||0;
  add(oil<2?(oil?'Još ulja':'Prelij uljem'):'Ulja je dosta',()=>{el.dataset.ovalOil=String(Math.min(2,oil+1));});
  add(pars<30?'Pospi peršunom':'Peršuna je dosta',()=>{el.dataset.ovalParsley=String(Math.min(30,pars+(pars?7:9)));});
  if(oil||pars||extrasOf(el).length)add('Očisti ulje, peršun i dodatke',()=>{el.dataset.ovalOil='0';el.dataset.ovalParsley='0';el.dataset.ovalExtras='[]';});
  document.body.appendChild(menu);
  const r=menu.getBoundingClientRect();menu.style.left=Math.max(6,Math.min(innerWidth-r.width-6,x))+'px';menu.style.top=Math.max(6,Math.min(innerHeight-r.height-6,y))+'px';
}
window.addEventListener('contextmenu',e=>{
  try{if(typeof holding!=='undefined'&&holding)return;}catch(_){}
  const el=ovalAt(e.clientX,e.clientY);
  if(!el){closeMenu();return;}
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openMenu(el,e.clientX,e.clientY);
},true);
window.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
setInterval(()=>{ovals().forEach(render);},1200);          // after a load of the saved world, and when the pictures have come
window.CooksterOval={tryDrop,render,compose,listOf,ZONE};
})();
