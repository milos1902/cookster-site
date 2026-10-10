/* Oval plate for the "belolučane paprike": three peeled green peppers are put on the empty oval (let go of the pepper above it) and the oval turns into the finished dish.
   One and two peppers are drawn on the plate by this file (canvas), three are the finished picture. The count is in dataset.ovalN (saved with the world).
   Images: assets/calibration_props/oval/oval_prazan.webp, oval_puna.webp, the peeled pepper assets/ingredients/zelena_peel/peeled.png. */
(function(){
'use strict';
if(window.CooksterOval)return;
const ID='oval_tanjir',DIR='assets/calibration_props/oval/',PEPPER='assets/ingredients/zelena_peel/peeled.png',NEED=3;
const imgs={};
function load(src){return imgs[src]||(imgs[src]=(()=>{const i=new Image();i.src=src;return i;})());}
['oval_prazan.webp','oval_puna.webp'].forEach(f=>load(DIR+f));load(PEPPER);
const cache={};
function srcFor(n){
  if(n<=0)return DIR+'oval_prazan.webp';
  if(n>=NEED)return DIR+'oval_puna.webp';
  if(cache[n])return cache[n];
  const base=load(DIR+'oval_prazan.webp'),pep=load(PEPPER);
  if(!base.complete||!pep.complete||!base.naturalWidth||!pep.naturalWidth)return DIR+'oval_prazan.webp';
  const c=document.createElement('canvas');c.width=base.naturalWidth;c.height=base.naturalHeight;const g=c.getContext('2d');
  g.drawImage(base,0,0);
  const spots=n===1?[[.5,.5,-.12]]:[[.47,.4,-.08],[.53,.62,.07]];
  spots.forEach(([fx,fy,rot])=>{
    const w=c.width*.66,h=w*pep.naturalHeight/pep.naturalWidth;
    g.save();g.translate(c.width*fx,c.height*fy);g.rotate(rot);g.shadowColor='rgba(60,30,5,.35)';g.shadowBlur=10;g.shadowOffsetY=4;g.drawImage(pep,-w/2,-h/2,w,h);g.restore();
  });
  try{return cache[n]=c.toDataURL('image/png');}catch(_){return DIR+'oval_prazan.webp';}
}
function ovals(){return(window.items||[]).filter(el=>el&&el.dataset&&el.dataset.itemId===ID);}
function render(el){
  const n=Math.max(0,Math.min(NEED,+el.dataset.ovalN||0)),src=srcFor(n);
  const body=el.querySelector('.body'),shadow=el._contactShadow&&el._contactShadow.querySelector('img');
  if(body&&body.dataset.ovalSrc!==src){body.dataset.ovalSrc=src;body.src=src;if(shadow)shadow.src=src;}
  el.dataset.label=n>=NEED?'Belolučane paprike':n>0?`Oval · ${n}/${NEED} paprike`:'Oval (prazan)';
}
function ovalAt(x,y){
  const l=ovals();
  for(let i=l.length-1;i>=0;i--){const r=l[i].getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return l[i];}
  return null;
}
function tryDrop(item){
  if(!item||!item.dataset||item.dataset.vegKey!=='paprika_zelena'||item.dataset.peeled!=='1')return false;
  const el=ovalAt(mouse.x,mouse.y);if(!el)return false;
  const n=+el.dataset.ovalN||0;
  if(n>=NEED){showToast('Oval je pun — to su tri paprike.');return true;}
  el.dataset.ovalN=String(n+1);
  removeItem(item);holding=null;
  try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(_){}
  render(el);try{playImpactSound(el,'drop');}catch(_){}try{CooksterSave.schedule();}catch(_){}
  showToast(n+1>=NEED?'Belolučane paprike su gotove!':`Paprika je na ovalu (${n+1}/${NEED}).`);
  return true;
}
setInterval(()=>{ovals().forEach(render);},1200);          // after a load of the saved world, and when the pictures have come
window.CooksterOval={tryDrop,render,srcFor};
})();
