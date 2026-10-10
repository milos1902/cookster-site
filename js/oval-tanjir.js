/* Oval plate: peeled roasted peppers (green and red) are put on the empty oval (let go of the pepper above it). The picture of the plate is built from LAYERS: the empty oval, then every pepper
   in its own picture (the green and the red one look different), placed on the prepared places of the plate, each with its own shadow. Exactly three green peppers are the hand drawn
   picture of the finished dish "Belolučane paprike" (oval_puna.webp). What is on the plate is kept as a list in dataset.ovalItems (["z","c",...]: z = green, c = red; at most 4).
   The same idea (a list of what is on the plate -> the picture of the dish) is the base for the menu of the player's own dishes. */
(function(){
'use strict';
if(window.CooksterOval)return;
const ID='oval_tanjir',DIR='assets/calibration_props/oval/',MAX=4;
const SPR={z:DIR+'zelena_oljustena.png',c:DIR+'crvena_oljustena.png'};
const WIDTH={z:.60,c:.42};                                             // the width of one pepper on the plate (a part of the width of the plate picture)
// the places for 1..4 peppers: [x, y, rotation] as a part of the picture of the plate (the plate is tilted a little, the peppers lie along it)
const SLOTS={
  1:[[.50,.50,.20]],
  2:[[.47,.38,.17],[.53,.63,.22]],
  3:[[.45,.30,.18],[.50,.50,.22],[.55,.70,.20]],
  4:[[.44,.25,.18],[.49,.41,.22],[.53,.58,.20],[.57,.75,.18]]
};
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
function srcFor(l){
  if(!l.length)return DIR+'oval_prazan.webp';
  if(isFinished(l))return DIR+'oval_puna.webp';
  const key=l.join('');
  if(cache[key])return cache[key];
  const base=load(DIR+'oval_prazan.webp');
  if(!base.complete||!base.naturalWidth||l.some(k=>{const p=load(SPR[k]);return !p.complete||!p.naturalWidth;}))return DIR+'oval_prazan.webp';
  const c=document.createElement('canvas');c.width=base.naturalWidth;c.height=base.naturalHeight;const g=c.getContext('2d');
  g.drawImage(base,0,0);
  const slots=SLOTS[l.length];
  l.forEach((k,i)=>{                                                     // the first is drawn first (at the back), the next ones lie over it
    const pep=load(SPR[k]),[fx,fy,rot]=slots[i],w=c.width*WIDTH[k],h=w*pep.naturalHeight/pep.naturalWidth;
    g.save();g.translate(c.width*fx,c.height*fy);g.rotate(rot);
    g.shadowColor='rgba(50,25,5,.38)';g.shadowBlur=11;g.shadowOffsetY=5;
    g.drawImage(pep,-w/2,-h/2,w,h);g.restore();
  });
  try{return cache[key]=c.toDataURL('image/png');}catch(_){return DIR+'oval_prazan.webp';}
}
function labelOf(l){
  if(!l.length)return 'Oval (prazan)';
  if(isFinished(l))return 'Belolučane paprike';
  const z=l.filter(x=>x==='z').length,c=l.length-z,p=[];
  if(z)p.push(`${z}× zelena`);if(c)p.push(`${c}× crvena`);
  return `Oval · ${p.join(', ')} paprika`;
}
function ovals(){return(window.items||[]).filter(el=>el&&el.dataset&&el.dataset.itemId===ID);}
function render(el){
  const l=listOf(el),src=srcFor(l);
  const body=el.querySelector('.body'),shadow=el._contactShadow&&el._contactShadow.querySelector('img');
  if(body&&body.dataset.ovalSrc!==src){body.dataset.ovalSrc=src;body.src=src;if(shadow)shadow.src=src;}
  el.dataset.label=labelOf(l);
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
function tryDrop(item){
  const k=kindOf(item);if(!k)return false;
  const el=ovalAt(mouse.x,mouse.y);if(!el)return false;
  const l=listOf(el);
  if(l.length>=MAX){showToast('Oval je pun — staje najviše 4 paprike.');return true;}
  l.push(k);el.dataset.ovalItems=JSON.stringify(l);el.dataset.ovalN=String(l.length);
  removeItem(item);holding=null;
  try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(_){}
  render(el);try{playImpactSound(el,'drop');}catch(_){}try{CooksterSave.schedule();}catch(_){}
  showToast(isFinished(l)?'Belolučane paprike su gotove!':`Paprika je na ovalu (${l.length}/${MAX}).`);
  return true;
}
setInterval(()=>{ovals().forEach(render);},1200);          // after a load of the saved world, and when the pictures have come
window.CooksterOval={tryDrop,render,srcFor,listOf};
})();
